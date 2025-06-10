let socket;
let currentSession = null;
let currentUser = null;
let isHost = false;
let preferences = {};
let statistics = {};
let sessionStartTime = null;
let circularTimerCanvas = null;
let circularTimerCtx = null;
let connectionRetryCount = 0;
let maxRetries = 5;
let isReconnecting = false;
let connectionStatus = 'disconnected'; // 'connected', 'connecting', 'disconnected', 'error'

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const timerScreen = document.getElementById('timerScreen');
const usernameInput = document.getElementById('username');
const sessionCodeInput = document.getElementById('sessionCode');
const createSessionBtn = document.getElementById('createSessionBtn');
const joinSessionBtn = document.getElementById('joinSessionBtn');
const loginError = document.getElementById('loginError');
const sessionCodeDisplay = document.getElementById('sessionCodeDisplay');
const leaveSessionBtn = document.getElementById('leaveSessionBtn');
const settingsBtn = document.getElementById('settingsBtn');
const sessionTypeDisplay = document.getElementById('sessionType');
const timerDisplay = document.getElementById('timerDisplay');
const cycleIndicator = document.getElementById('cycleIndicator');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const hostIndicator = document.getElementById('hostIndicator');
const usersList = document.getElementById('usersList');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const notificationSound = document.getElementById('notificationSound');
const statsBtn = document.getElementById('statsBtn');
const statsModal = document.getElementById('statsModal');
const closeStatsBtn = document.getElementById('closeStatsBtn');
const resetStatsBtn = document.getElementById('resetStatsBtn');

// Initialize socket connection with retry logic
function initializeSocketConnection(port) {
    updateConnectionStatus('connecting');
    
    socket = io(`http://localhost:${port}`, {
        reconnection: true,
        reconnectionAttempts: maxRetries,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ['websocket', 'polling']
    });
    
    setupSocketListeners();
}

// Update connection status and UI
function updateConnectionStatus(status) {
    connectionStatus = status;
    
    // Update UI based on connection status
    const statusIndicator = document.getElementById('connectionStatus');
    if (statusIndicator) {
        switch (status) {
            case 'connected':
                statusIndicator.textContent = 'Connected';
                statusIndicator.className = 'connection-status connected';
                break;
            case 'connecting':
                statusIndicator.textContent = 'Connecting...';
                statusIndicator.className = 'connection-status connecting';
                break;
            case 'disconnected':
                statusIndicator.textContent = 'Disconnected';
                statusIndicator.className = 'connection-status disconnected';
                break;
            case 'error':
                statusIndicator.textContent = 'Connection Error';
                statusIndicator.className = 'connection-status error';
                break;
        }
    }
}

// Initialize
async function init() {
    // Load preferences
    preferences = await window.electronAPI.getPreferences();
    applyTheme(preferences.theme);
    
    // Load saved user data
    const userData = await window.electronAPI.getUserData();
    if (userData.username) {
        usernameInput.value = userData.username;
    }
    
    // Load statistics
    await loadStatistics();
    
    // Initialize circular timer
    circularTimerCanvas = document.getElementById('circularTimer');
    circularTimerCtx = circularTimerCanvas.getContext('2d');
    
    // Try to read port from file, fallback to default
    let serverPort = 3456;
    try {
        const portData = await window.electronAPI.getServerPort();
        if (portData) {
            serverPort = parseInt(portData);
        }
    } catch (err) {
        console.log('Using default port:', serverPort);
    }
    
    // Initialize socket connection with retry logic
    initializeSocketConnection(serverPort);
    
    // Setup event listeners
    setupEventListeners();
}

// Socket event listeners
function setupSocketListeners() {
    socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus('connected');
        connectionRetryCount = 0;
        
        // If we have a current session, try to reconnect
        if (currentSession && currentUser && !isReconnecting) {
            isReconnecting = true;
            socket.emit('reconnectSession', {
                sessionId: currentSession.sessionId,
                userId: currentUser.id,
                username: currentUser.username
            }, (response) => {
                isReconnecting = false;
                if (response.success) {
                    console.log('Successfully reconnected to session');
                    currentSession = response;
                    isHost = response.isHost;
                    updateTimerDisplay(response.session.timer);
                    updateUsersList(response.session.users);
                    if (isHost) {
                        showHostControls();
                    }
                } else {
                    console.error('Failed to reconnect:', response.error);
                    showLoginScreen();
                    showError('Session no longer exists. Please create or join a new session.');
                }
            });
        }
    });
    
    socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        updateConnectionStatus('disconnected');
        
        if (reason === 'io server disconnect') {
            // Server disconnected us
            showError('Disconnected by server');
        } else if (reason === 'ping timeout') {
            showError('Connection timeout - attempting to reconnect...');
        } else if (reason === 'transport close' || reason === 'transport error') {
            showError('Connection lost - attempting to reconnect...');
        }
        
        // Don't immediately go to login screen if we might reconnect
        if (!['io server disconnect', 'io client disconnect'].includes(reason) && currentSession) {
            setTimeout(() => {
                if (connectionStatus === 'disconnected') {
                    showLoginScreen();
                    showError('Unable to reconnect. Please rejoin the session.');
                }
            }, 10000); // Give 10 seconds to reconnect
        }
    });
    
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message);
        updateConnectionStatus('error');
        connectionRetryCount++;
        
        if (connectionRetryCount >= maxRetries) {
            showError('Unable to connect to server. Please check if the server is running.');
            updateConnectionStatus('error');
        } else {
            showError(`Connection failed. Retrying... (${connectionRetryCount}/${maxRetries})`);
        }
    });
    
    socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        updateConnectionStatus('connected');
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Reconnection attempt', attemptNumber);
        updateConnectionStatus('connecting');
    });
    
    socket.on('reconnect_failed', () => {
        console.error('Failed to reconnect');
        updateConnectionStatus('error');
        showLoginScreen();
        showError('Failed to reconnect to server. Please try again.');
    });
    
    socket.on('timerUpdate', (timer) => {
        updateTimerDisplay(timer);
    });
    
    socket.on('timerStarted', () => {
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'flex';
    });
    
    socket.on('timerPaused', () => {
        pauseBtn.style.display = 'none';
        startBtn.style.display = 'flex';
    });
    
    socket.on('timerReset', () => {
        pauseBtn.style.display = 'none';
        startBtn.style.display = 'flex';
    });
    
    socket.on('sessionComplete', ({ nextSession, cycleCount }) => {
        playNotificationSound();
        showNotification('Session Complete!', `Time for a ${nextSession.replace(/([A-Z])/g, ' $1').trim()}`);
        updateCycleIndicator(cycleCount);
        
        // Track completed session
        trackSessionComplete(currentSession.session.timer.sessionType);
    });
    
    socket.on('userJoined', ({ user, users }) => {
        updateUsersList(users);
        if (user.id !== currentUser.id) {
            showNotification('User Joined', `${user.username} joined the session`);
        }
    });
    
    socket.on('userLeft', ({ userId, users, newHostId }) => {
        updateUsersList(users);
        if (newHostId === currentUser.id) {
            isHost = true;
            showHostControls();
            showNotification('Host Transfer', 'You are now the session host');
        }
    });
    
    socket.on('settingsChanged', ({ duration, sessionType }) => {
        if (!isHost) {
            showNotification('Settings Changed', 'The host has updated the timer settings');
        }
    });
}

// Event listeners
function setupEventListeners() {
    createSessionBtn.addEventListener('click', createSession);
    joinSessionBtn.addEventListener('click', joinSession);
    leaveSessionBtn.addEventListener('click', leaveSession);
    settingsBtn.addEventListener('click', () => openSettings());
    closeSettingsBtn.addEventListener('click', () => closeSettings());
    saveSettingsBtn.addEventListener('click', saveSettings);
    statsBtn.addEventListener('click', () => openStatistics());
    closeStatsBtn.addEventListener('click', () => closeStatistics());
    resetStatsBtn.addEventListener('click', () => resetStatistics());
    
    startBtn.addEventListener('click', () => {
        if (isHost) {
            socket.emit('startTimer', currentSession.sessionId, currentUser.id);
        }
    });
    
    pauseBtn.addEventListener('click', () => {
        if (isHost) {
            socket.emit('pauseTimer', currentSession.sessionId, currentUser.id);
        }
    });
    
    resetBtn.addEventListener('click', () => {
        if (isHost) {
            socket.emit('resetTimer', currentSession.sessionId, currentUser.id);
        }
    });
    
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createSession();
        }
    });
    
    sessionCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinSession();
        }
    });
}

// Session management
async function createSession() {
    const username = usernameInput.value.trim();
    if (!username) {
        showError('Please enter your name');
        return;
    }
    
    if (connectionStatus !== 'connected') {
        showError('Not connected to server. Please wait...');
        return;
    }
    
    clearError();
    
    // Add timeout for session creation
    const timeoutId = setTimeout(() => {
        showError('Session creation timed out. Please try again.');
    }, 5000);
    
    socket.emit('createSession', username, async (response) => {
        clearTimeout(timeoutId);
        
        if (response && response.success) {
            currentSession = response;
            currentUser = { id: response.userId, username };
            isHost = true;
            
            await window.electronAPI.saveUserData({ userId: response.userId, username });
            
            showTimerScreen();
            showHostControls();
        } else {
            showError(response?.error || 'Failed to create session');
        }
    });
}

async function joinSession() {
    const username = usernameInput.value.trim();
    const sessionCode = sessionCodeInput.value.trim().toUpperCase();
    
    if (!username) {
        showError('Please enter your name');
        return;
    }
    
    if (!sessionCode) {
        showError('Please enter a session code');
        return;
    }
    
    if (connectionStatus !== 'connected') {
        showError('Not connected to server. Please wait...');
        return;
    }
    
    clearError();
    
    // Add timeout for joining session
    const timeoutId = setTimeout(() => {
        showError('Join session timed out. Please try again.');
    }, 5000);
    
    socket.emit('joinSession', sessionCode, username, async (response) => {
        clearTimeout(timeoutId);
        
        if (response && response.success) {
            currentSession = response;
            currentUser = { id: response.userId, username };
            isHost = response.isHost;
            
            await window.electronAPI.saveUserData({ userId: response.userId, username });
            
            showTimerScreen();
            if (isHost) {
                showHostControls();
            }
        } else {
            showError(response?.error || 'Failed to join session');
        }
    });
}

function leaveSession() {
    if (currentSession) {
        socket.emit('leaveSession', {
            sessionId: currentSession.sessionId,
            userId: currentUser.id
        });
    }
    showLoginScreen();
}

// UI updates
function showLoginScreen() {
    loginScreen.classList.add('active');
    timerScreen.classList.remove('active');
    currentSession = null;
    currentUser = null;
    isHost = false;
}

function showTimerScreen() {
    loginScreen.classList.remove('active');
    timerScreen.classList.add('active');
    
    sessionCodeDisplay.textContent = currentSession.sessionId;
    updateTimerDisplay(currentSession.session.timer);
    updateUsersList(currentSession.session.users);
    
    // Initialize session tracking
    sessionStartTime = Date.now();
}

function showHostControls() {
    hostIndicator.style.display = 'block';
    startBtn.disabled = false;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
}

function updateTimerDisplay(timer) {
    const minutes = Math.floor(timer.remaining / 60);
    const seconds = timer.remaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update session type display
    const sessionTypeText = {
        work: 'Work Session',
        shortBreak: 'Short Break',
        longBreak: 'Long Break'
    };
    sessionTypeDisplay.textContent = sessionTypeText[timer.sessionType] || 'Work Session';
    
    // Update button states
    if (timer.isRunning) {
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'flex';
    } else {
        pauseBtn.style.display = 'none';
        startBtn.style.display = 'flex';
    }
    
    // Draw circular timer
    drawCircularTimer(timer);
    
    // Pulse animation when timer reaches 0
    if (timer.remaining === 0) {
        timerDisplay.classList.add('pulse');
        setTimeout(() => timerDisplay.classList.remove('pulse'), 1000);
    }
}

function drawCircularTimer(timer) {
    if (!circularTimerCtx) return;
    
    const centerX = circularTimerCanvas.width / 2;
    const centerY = circularTimerCanvas.height / 2;
    const radius = 100;
    const lineWidth = 12;
    
    // Clear canvas
    circularTimerCtx.clearRect(0, 0, circularTimerCanvas.width, circularTimerCanvas.height);
    
    // Calculate progress (remaining time ratio)
    const progress = timer.remaining / timer.duration;
    // For clockwise countdown: start at top and go clockwise
    const startAngle = -Math.PI / 2; // Top of circle (12 o'clock)
    const endAngle = startAngle + (1 - progress) * 2 * Math.PI; // Clockwise from top
    
    // Draw background circle
    circularTimerCtx.beginPath();
    circularTimerCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    circularTimerCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border');
    circularTimerCtx.lineWidth = lineWidth;
    circularTimerCtx.stroke();
    
    // Draw progress arc (starts full and decreases clockwise)
    if (progress > 0) {
        circularTimerCtx.beginPath();
        // Draw from the elapsed position back to start (creates remaining time arc)
        circularTimerCtx.arc(centerX, centerY, radius, endAngle, startAngle + 2 * Math.PI);
        circularTimerCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
        circularTimerCtx.lineWidth = lineWidth;
        circularTimerCtx.lineCap = 'round';
        circularTimerCtx.stroke();
    }
    
    // Draw inner shadow effect
    const gradient = circularTimerCtx.createRadialGradient(centerX, centerY, radius - lineWidth, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    circularTimerCtx.beginPath();
    circularTimerCtx.arc(centerX, centerY, radius - lineWidth / 2, 0, 2 * Math.PI);
    circularTimerCtx.strokeStyle = gradient;
    circularTimerCtx.lineWidth = lineWidth;
    circularTimerCtx.stroke();
}

function updateCycleIndicator(cycleCount) {
    const dots = cycleIndicator.querySelectorAll('.cycle-dot');
    const activeDots = cycleCount % 4 || (cycleCount > 0 ? 4 : 0);
    
    dots.forEach((dot, index) => {
        if (index < activeDots) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function updateUsersList(users) {
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        avatar.textContent = user.username.charAt(0).toUpperCase();
        
        const name = document.createElement('div');
        name.className = 'user-name';
        name.textContent = user.username;
        
        userItem.appendChild(avatar);
        userItem.appendChild(name);
        
        if (user.isHost) {
            const hostBadge = document.createElement('div');
            hostBadge.className = 'user-host';
            hostBadge.textContent = 'Host';
            userItem.appendChild(hostBadge);
        }
        
        usersList.appendChild(userItem);
    });
}

// Settings
async function openSettings() {
    settingsModal.classList.add('active');
    
    // Load current preferences
    document.getElementById('workDuration').value = preferences.workDuration;
    document.getElementById('shortBreakDuration').value = preferences.shortBreakDuration;
    document.getElementById('longBreakDuration').value = preferences.longBreakDuration;
    document.getElementById('alwaysOnTop').checked = preferences.alwaysOnTop;
    document.getElementById('notificationSound').checked = preferences.notificationSound;
    document.getElementById('theme').value = preferences.theme;
}

function closeSettings() {
    settingsModal.classList.remove('active');
}

async function saveSettings() {
    const newPreferences = {
        workDuration: parseInt(document.getElementById('workDuration').value),
        shortBreakDuration: parseInt(document.getElementById('shortBreakDuration').value),
        longBreakDuration: parseInt(document.getElementById('longBreakDuration').value),
        alwaysOnTop: document.getElementById('alwaysOnTop').checked,
        notificationSound: document.getElementById('notificationSound').checked,
        theme: document.getElementById('theme').value
    };
    
    await window.electronAPI.savePreferences(newPreferences);
    preferences = newPreferences;
    applyTheme(preferences.theme);
    
    // Update timer if host
    if (isHost && currentSession) {
        const currentType = currentSession.session.timer.sessionType;
        let duration;
        
        switch (currentType) {
            case 'work':
                duration = preferences.workDuration * 60;
                break;
            case 'shortBreak':
                duration = preferences.shortBreakDuration * 60;
                break;
            case 'longBreak':
                duration = preferences.longBreakDuration * 60;
                break;
        }
        
        socket.emit('changeTimerSettings', {
            sessionId: currentSession.sessionId,
            userId: currentUser.id,
            duration,
            sessionType: currentType
        });
    }
    
    closeSettings();
}

// Utilities
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    // Redraw timer with new theme colors
    if (currentSession && currentSession.session) {
        drawCircularTimer(currentSession.session.timer);
    }
}

function showError(message) {
    loginError.textContent = message;
}

function clearError() {
    loginError.textContent = '';
}

function showNotification(title, body) {
    window.electronAPI.showNotification({ title, body });
}

function playNotificationSound() {
    if (preferences.notificationSound) {
        // Try to play the audio file first
        notificationSound.play().catch(e => {
            console.log('Audio file not available, creating programmatic sound');
            // Fallback to programmatic sound
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            } catch (soundError) {
                console.log('Could not create notification sound:', soundError);
            }
        });
    }
}

// Statistics functions
async function loadStatistics() {
    const defaultStats = {
        todayWorkSessions: 0,
        todayFocusTime: 0,
        todayBreakTime: 0,
        currentStreak: 0,
        totalWorkSessions: 0,
        totalFocusTime: 0,
        longestStreak: 0,
        lastActivityDate: new Date().toDateString(),
        sessionHistory: []
    };
    
    try {
        const userData = await window.electronAPI.getUserData();
        statistics = userData.statistics || defaultStats;
        
        // Reset daily stats if it's a new day
        const today = new Date().toDateString();
        if (statistics.lastActivityDate !== today) {
            statistics.todayWorkSessions = 0;
            statistics.todayFocusTime = 0;
            statistics.todayBreakTime = 0;
            statistics.lastActivityDate = today;
            await saveStatistics();
        }
    } catch (error) {
        statistics = defaultStats;
    }
}

async function saveStatistics() {
    try {
        const userData = await window.electronAPI.getUserData();
        userData.statistics = statistics;
        await window.electronAPI.saveUserData(userData);
    } catch (error) {
        console.error('Failed to save statistics:', error);
    }
}

function trackSessionComplete(sessionType) {
    const duration = sessionType === 'work' ? preferences.workDuration : 
                    sessionType === 'shortBreak' ? preferences.shortBreakDuration : 
                    preferences.longBreakDuration;
    
    if (sessionType === 'work') {
        statistics.todayWorkSessions++;
        statistics.totalWorkSessions++;
        statistics.todayFocusTime += duration;
        statistics.totalFocusTime += duration;
        statistics.currentStreak++;
        
        if (statistics.currentStreak > statistics.longestStreak) {
            statistics.longestStreak = statistics.currentStreak;
        }
    } else {
        statistics.todayBreakTime += duration;
    }
    
    // Add to session history
    statistics.sessionHistory.push({
        type: sessionType,
        duration: duration,
        timestamp: Date.now(),
        date: new Date().toDateString()
    });
    
    // Keep only last 100 sessions
    if (statistics.sessionHistory.length > 100) {
        statistics.sessionHistory = statistics.sessionHistory.slice(-100);
    }
    
    saveStatistics();
}

function openStatistics() {
    statsModal.classList.add('active');
    updateStatisticsDisplay();
}

function closeStatistics() {
    statsModal.classList.remove('active');
}

async function resetStatistics() {
    if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
        statistics = {
            todayWorkSessions: 0,
            todayFocusTime: 0,
            todayBreakTime: 0,
            currentStreak: 0,
            totalWorkSessions: 0,
            totalFocusTime: 0,
            longestStreak: 0,
            lastActivityDate: new Date().toDateString(),
            sessionHistory: []
        };
        await saveStatistics();
        updateStatisticsDisplay();
    }
}

function updateStatisticsDisplay() {
    // Today's stats
    document.getElementById('todayWorkSessions').textContent = statistics.todayWorkSessions;
    document.getElementById('todayFocusTime').textContent = `${statistics.todayFocusTime}m`;
    document.getElementById('todayBreakTime').textContent = `${statistics.todayBreakTime}m`;
    document.getElementById('currentStreak').textContent = statistics.currentStreak;
    
    // All time stats
    document.getElementById('totalWorkSessions').textContent = statistics.totalWorkSessions;
    document.getElementById('totalFocusTime').textContent = `${Math.round(statistics.totalFocusTime / 60)}h`;
    document.getElementById('longestStreak').textContent = statistics.longestStreak;
    
    // Calculate average daily sessions
    const daysActive = Math.max(1, Math.ceil(statistics.sessionHistory.length / 4)); // Rough estimate
    const avgDaily = Math.round(statistics.totalWorkSessions / daysActive);
    document.getElementById('averageDaily').textContent = avgDaily;
    
    // Current session stats
    if (currentSession) {
        document.getElementById('sessionParticipants').textContent = currentSession.session.users.length;
        
        const sessionDuration = sessionStartTime ? 
            Math.round((Date.now() - sessionStartTime) / 1000 / 60) : 0;
        document.getElementById('sessionDuration').textContent = `${sessionDuration}m`;
        
        document.getElementById('sessionCycles').textContent = currentSession.session.timer.cycleCount || 0;
    }
}

// Initialize app
init();