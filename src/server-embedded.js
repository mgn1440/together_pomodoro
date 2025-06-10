// Embedded server for production builds
// This runs the server in the same process as Electron

const { Server } = require('socket.io');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

let server = null;
let io = null;
let httpServer = null;

// Session storage
const sessions = new Map();

class PomodoroSession {
  constructor(id, hostId) {
    this.id = id;
    this.hostId = hostId;
    this.users = new Map();
    this.timer = {
      duration: 25 * 60, // 25 minutes in seconds
      remaining: 25 * 60,
      isRunning: false,
      sessionType: 'work', // 'work', 'shortBreak', 'longBreak'
      cycleCount: 0
    };
    this.interval = null;
  }

  addUser(userId, username, socketId) {
    this.users.set(userId, {
      id: userId,
      username,
      socketId,
      isHost: userId === this.hostId,
      joinedAt: Date.now()
    });
  }

  removeUser(userId) {
    this.users.delete(userId);
    if (this.users.size === 0) {
      this.stopTimer();
      return true; // Session should be deleted
    }
    // Transfer host if host leaves
    if (userId === this.hostId && this.users.size > 0) {
      const newHost = this.users.values().next().value;
      this.hostId = newHost.id;
      newHost.isHost = true;
    }
    return false;
  }

  startTimer() {
    if (this.isRunning) return;
    
    this.timer.isRunning = true;
    this.interval = setInterval(() => {
      if (this.timer.remaining > 0) {
        this.timer.remaining--;
        io.to(this.id).emit('timerUpdate', this.timer);
      } else {
        this.completeSession();
      }
    }, 1000);
  }

  pauseTimer() {
    this.timer.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  resetTimer() {
    this.pauseTimer();
    this.timer.remaining = this.timer.duration;
    io.to(this.id).emit('timerUpdate', this.timer);
  }

  stopTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  completeSession() {
    this.pauseTimer();
    
    // Determine next session type
    if (this.timer.sessionType === 'work') {
      this.timer.cycleCount++;
      if (this.timer.cycleCount % 4 === 0) {
        this.timer.sessionType = 'longBreak';
        this.timer.duration = 15 * 60; // 15 minutes
      } else {
        this.timer.sessionType = 'shortBreak';
        this.timer.duration = 5 * 60; // 5 minutes
      }
    } else {
      this.timer.sessionType = 'work';
      this.timer.duration = 25 * 60; // 25 minutes
    }
    
    this.timer.remaining = this.timer.duration;
    io.to(this.id).emit('sessionComplete', {
      nextSession: this.timer.sessionType,
      cycleCount: this.timer.cycleCount
    });
    io.to(this.id).emit('timerUpdate', this.timer);
  }

  setTimerDuration(duration, sessionType) {
    this.pauseTimer();
    this.timer.duration = duration;
    this.timer.remaining = duration;
    this.timer.sessionType = sessionType;
    io.to(this.id).emit('timerUpdate', this.timer);
  }
}

function setupSocketHandlers() {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Handle reconnection
    socket.on('reconnectSession', ({ sessionId, userId, username }, callback) => {
      try {
        const session = sessions.get(sessionId);
        
        if (!session) {
          callback({ success: false, error: 'Session no longer exists' });
          return;
        }
        
        // Update user's socket ID
        const user = session.users.get(userId);
        if (user) {
          user.socketId = socket.id;
          socket.join(sessionId);
          socket.data = { sessionId, userId, username };
          
          callback({
            success: true,
            sessionId,
            userId,
            isHost: session.hostId === userId,
            session: {
              users: Array.from(session.users.values()),
              timer: session.timer
            }
          });
        } else {
          // User was removed, rejoin as new user
          session.addUser(userId, username, socket.id);
          socket.join(sessionId);
          socket.data = { sessionId, userId, username };
          
          callback({
            success: true,
            sessionId,
            userId,
            isHost: false,
            session: {
              users: Array.from(session.users.values()),
              timer: session.timer
            }
          });
          
          io.to(sessionId).emit('userJoined', {
            user: session.users.get(userId),
            users: Array.from(session.users.values())
          });
        }
      } catch (error) {
        console.error('Error reconnecting to session:', error);
        callback({ success: false, error: 'Failed to reconnect' });
      }
    });

    socket.on('createSession', (username, callback) => {
      try {
        if (!username || typeof username !== 'string') {
          callback({ success: false, error: 'Invalid username' });
          return;
        }
        
        const sessionId = uuidv4().substring(0, 6).toUpperCase();
        const userId = uuidv4();
        const session = new PomodoroSession(sessionId, userId);
        
        session.addUser(userId, username, socket.id);
        sessions.set(sessionId, session);
        
        socket.join(sessionId);
        socket.data = { sessionId, userId, username };
        
        callback({
          success: true,
          sessionId,
          userId,
          isHost: true,
          session: {
            users: Array.from(session.users.values()),
            timer: session.timer
          }
        });
        
        io.to(sessionId).emit('userJoined', {
          user: session.users.get(userId),
          users: Array.from(session.users.values())
        });
      } catch (error) {
        console.error('Error creating session:', error);
        callback({ success: false, error: 'Failed to create session' });
      }
    });

    socket.on('joinSession', (sessionId, username, callback) => {
      try {
        if (!username || typeof username !== 'string') {
          callback({ success: false, error: 'Invalid username' });
          return;
        }
        
        if (!sessionId || typeof sessionId !== 'string') {
          callback({ success: false, error: 'Invalid session code' });
          return;
        }
        
        const session = sessions.get(sessionId);
        
        if (!session) {
          callback({ success: false, error: 'Session not found' });
          return;
        }
        
        const userId = uuidv4();
        session.addUser(userId, username, socket.id);
        socket.join(sessionId);
        socket.data = { sessionId, userId, username };
        
        callback({
          success: true,
          sessionId,
          userId,
          isHost: false,
          session: {
            users: Array.from(session.users.values()),
            timer: session.timer
          }
        });
        
        io.to(sessionId).emit('userJoined', {
          user: session.users.get(userId),
          users: Array.from(session.users.values())
        });
      } catch (error) {
        console.error('Error joining session:', error);
        callback({ success: false, error: 'Failed to join session' });
      }
    });

    socket.on('startTimer', (sessionId, userId) => {
      const session = sessions.get(sessionId);
      if (!session || session.hostId !== userId) return;
      
      session.startTimer();
      io.to(sessionId).emit('timerStarted');
    });

    socket.on('pauseTimer', (sessionId, userId) => {
      const session = sessions.get(sessionId);
      if (!session || session.hostId !== userId) return;
      
      session.pauseTimer();
      io.to(sessionId).emit('timerPaused');
    });

    socket.on('resetTimer', (sessionId, userId) => {
      const session = sessions.get(sessionId);
      if (!session || session.hostId !== userId) return;
      
      session.resetTimer();
      io.to(sessionId).emit('timerReset');
    });

    socket.on('changeTimerSettings', ({ sessionId, userId, duration, sessionType }) => {
      const session = sessions.get(sessionId);
      if (!session || session.hostId !== userId) return;
      
      session.setTimerDuration(duration, sessionType);
      io.to(sessionId).emit('settingsChanged', { duration, sessionType });
    });

    socket.on('leaveSession', ({ sessionId, userId }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      
      socket.leave(sessionId);
      const shouldDelete = session.removeUser(userId);
      
      if (shouldDelete) {
        sessions.delete(sessionId);
      } else {
        io.to(sessionId).emit('userLeft', {
          userId,
          users: Array.from(session.users.values()),
          newHostId: session.hostId
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Use stored socket data for faster lookup
      if (socket.data && socket.data.sessionId && socket.data.userId) {
        const { sessionId, userId } = socket.data;
        const session = sessions.get(sessionId);
        
        if (session) {
          const shouldDelete = session.removeUser(userId);
          
          if (shouldDelete) {
            sessions.delete(sessionId);
          } else {
            io.to(sessionId).emit('userLeft', {
              userId,
              users: Array.from(session.users.values()),
              newHostId: session.hostId
            });
          }
        }
      }
    });
  });
}

function startEmbeddedServer(port = 3456) {
  return new Promise((resolve, reject) => {
    try {
      httpServer = http.createServer();
      io = new Server(httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling'],
        allowEIO3: true
      });
      
      setupSocketHandlers();
      
      httpServer.listen(port, () => {
        console.log(`🍅 Embedded Pomodoro server running on port ${port}`);
        resolve(port);
      });
      
      httpServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is in use, trying ${port + 1}...`);
          httpServer.close();
          startEmbeddedServer(port + 1).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function stopEmbeddedServer() {
  if (httpServer) {
    httpServer.close();
    httpServer = null;
  }
  if (io) {
    io.close();
    io = null;
  }
  
  // Clear all sessions and timers
  for (const session of sessions.values()) {
    session.stopTimer();
  }
  sessions.clear();
}

module.exports = {
  startEmbeddedServer,
  stopEmbeddedServer
};