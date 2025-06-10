const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

console.log('=== Pomodoro Timer Server Diagnostics ===\n');

// Check if running from packaged app
console.log('App packaged:', app.isPackaged);
console.log('App path:', app.getAppPath());
console.log('Resources path:', process.resourcesPath);
console.log('User data path:', app.getPath('userData'));

// Check server file locations
const devServerPath = path.join(__dirname, 'server', 'server.js');
const prodServerPath = path.join(process.resourcesPath, 'app', 'server', 'server.js');

console.log('\n--- Server File Checks ---');
console.log('Development server path:', devServerPath);
console.log('Development server exists:', fs.existsSync(devServerPath));

console.log('\nProduction server path:', prodServerPath);
console.log('Production server exists:', fs.existsSync(prodServerPath));

// Check port availability
console.log('\n--- Port Availability ---');
const net = require('net');
const testPort = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
};

async function checkPorts() {
  const ports = [3000, 3456, 3457, 3458];
  for (const port of ports) {
    const available = await testPort(port);
    console.log(`Port ${port}: ${available ? 'Available' : 'In use'}`);
  }
}

// Check Node.js availability
console.log('\n--- Node.js Check ---');
console.log('Process executable:', process.execPath);
console.log('Node version:', process.version);

// Try to start server
console.log('\n--- Server Start Test ---');
async function testServerStart() {
  const serverPath = app.isPackaged ? prodServerPath : devServerPath;
  
  if (!fs.existsSync(serverPath)) {
    console.error('Server file not found!');
    return;
  }
  
  console.log('Attempting to start server from:', serverPath);
  
  const serverProcess = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: '3456' },
    stdio: 'pipe'
  });
  
  serverProcess.stdout.on('data', (data) => {
    console.log('Server output:', data.toString());
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
  });
  
  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
  });
  
  // Give it 3 seconds then kill it
  setTimeout(() => {
    serverProcess.kill();
    console.log('\nTest completed. Server process terminated.');
    process.exit(0);
  }, 3000);
}

checkPorts().then(() => {
  testServerStart();
});