const { Server } = require('socket.io');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3456;

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

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createSession', (username, callback) => {
    const sessionId = uuidv4().substring(0, 6).toUpperCase();
    const userId = uuidv4();
    const session = new PomodoroSession(sessionId, userId);
    
    session.addUser(userId, username, socket.id);
    sessions.set(sessionId, session);
    
    socket.join(sessionId);
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
  });

  socket.on('joinSession', (sessionId, username, callback) => {
    const session = sessions.get(sessionId);
    
    if (!session) {
      callback({ success: false, error: 'Session not found' });
      return;
    }
    
    const userId = uuidv4();
    session.addUser(userId, username, socket.id);
    socket.join(sessionId);
    
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
    
    // Find and remove user from any sessions
    for (const [sessionId, session] of sessions) {
      for (const [userId, user] of session.users) {
        if (user.socketId === socket.id) {
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
          break;
        }
      }
    }
  });
});

// Try to find an available port
async function startServer(port) {
  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      console.log(`🍅 Pomodoro server running on port ${port}`);
      // Write the port to a file so the client can read it
      const fs = require('fs');
      const path = require('path');
      const portFile = path.join(__dirname, '..', 'server-port.txt');
      fs.writeFileSync(portFile, port.toString());
      resolve(port);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port
        console.log(`Port ${port} is in use, trying ${port + 1}...`);
        server.removeAllListeners('error');
        startServer(port + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// Start the server
startServer(PORT).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});