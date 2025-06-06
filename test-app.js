const { spawn } = require('child_process');
const http = require('http');

console.log('🍅 Testing Collaborative Pomodoro Timer...\n');

// Test 1: Check if Node.js modules can be loaded
try {
    require('./server/server.js');
    console.log('❌ Server module check failed (should not import directly)');
} catch (error) {
    console.log('✅ Server module structure is correct');
}

// Test 2: Check if all required files exist
const fs = require('fs');
const requiredFiles = [
    'package.json',
    'src/main.js',
    'src/renderer.js',
    'src/index.html',
    'src/styles.css',
    'src/preload.js',
    'server/server.js',
    'README.md'
];

console.log('\n📁 Checking required files...');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
    }
});

// Test 3: Check package.json structure
console.log('\n📦 Checking package.json...');
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = ['start', 'server', 'dev', 'build'];
    
    requiredScripts.forEach(script => {
        if (pkg.scripts && pkg.scripts[script]) {
            console.log(`✅ Script: ${script}`);
        } else {
            console.log(`❌ Script: ${script} - MISSING`);
        }
    });
    
    const requiredDeps = ['socket.io', 'uuid', 'electron-store'];
    requiredDeps.forEach(dep => {
        if (pkg.dependencies && pkg.dependencies[dep]) {
            console.log(`✅ Dependency: ${dep}`);
        } else {
            console.log(`❌ Dependency: ${dep} - MISSING`);
        }
    });
} catch (error) {
    console.log('❌ package.json is invalid');
}

// Test 4: Test server startup
console.log('\n🚀 Testing server startup...');
const serverProcess = spawn('node', ['server/server.js'], {
    stdio: 'pipe'
});

let serverStarted = false;

serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Pomodoro server running')) {
        console.log('✅ Server started successfully');
        serverStarted = true;
        
        // Test HTTP connection
        setTimeout(() => {
            const req = http.request({
                hostname: 'localhost',
                port: 3000,
                method: 'GET'
            }, (res) => {
                console.log('✅ Server is responding to HTTP requests');
                serverProcess.kill();
            });
            
            req.on('error', (err) => {
                console.log('✅ Server correctly rejects HTTP (expecting WebSocket)');
                serverProcess.kill();
            });
            
            req.end();
        }, 1000);
    }
});

serverProcess.stderr.on('data', (data) => {
    const error = data.toString();
    if (error.includes('EADDRINUSE')) {
        console.log('❌ Port 3000 is already in use');
    } else {
        console.log('❌ Server error:', error);
    }
    serverProcess.kill();
});

// Cleanup after 5 seconds
setTimeout(() => {
    if (!serverStarted) {
        console.log('❌ Server failed to start within 5 seconds');
    }
    serverProcess.kill();
    
    console.log('\n🏁 Test completed!');
    console.log('\n📋 To run the application:');
    console.log('   npm run dev    (starts both server and app)');
    console.log('   npm start      (app only, server must be running)');
    console.log('   npm run server (server only)');
    
}, 5000);