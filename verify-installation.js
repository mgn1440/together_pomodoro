#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🍅 Collaborative Pomodoro Timer - Installation Verification\n');

// Check Node.js version
const nodeVersion = process.version;
const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
console.log(`Node.js version: ${nodeVersion}`);
if (nodeMajor >= 16) {
    console.log('✅ Node.js version is compatible (16+)');
} else {
    console.log('❌ Node.js version is too old. Please upgrade to v16 or higher.');
}

// Check if we're in the right directory
const requiredFiles = [
    'package.json',
    'src/main.js',
    'src/renderer.js',
    'src/index.html',
    'server/server.js'
];

console.log('\n📁 Checking project structure...');
let allFilesPresent = true;
for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesPresent = false;
    }
}

// Check package.json
console.log('\n📦 Checking package.json...');
try {
    const pkg = require('./package.json');
    console.log(`✅ App name: ${pkg.name}`);
    console.log(`✅ Version: ${pkg.version}`);
    console.log(`✅ Main entry: ${pkg.main}`);
    
    const scripts = ['start', 'server', 'dev', 'build'];
    scripts.forEach(script => {
        if (pkg.scripts[script]) {
            console.log(`✅ Script '${script}' configured`);
        } else {
            console.log(`❌ Script '${script}' missing`);
        }
    });
} catch (err) {
    console.log('❌ package.json is invalid or missing');
    allFilesPresent = false;
}

// Check node_modules
console.log('\n📚 Checking dependencies...');
if (fs.existsSync('node_modules')) {
    const criticalDeps = ['electron', 'socket.io', 'uuid', 'electron-store'];
    criticalDeps.forEach(dep => {
        if (fs.existsSync(`node_modules/${dep}`)) {
            console.log(`✅ ${dep} installed`);
        } else {
            console.log(`❌ ${dep} missing - run 'npm install'`);
        }
    });
} else {
    console.log('❌ node_modules not found - run "npm install"');
    allFilesPresent = false;
}

console.log('\n🎯 Installation Summary:');
if (allFilesPresent && nodeMajor >= 16) {
    console.log('✅ Installation is COMPLETE and ready!');
    console.log('\n🚀 To start the application:');
    console.log('   npm run dev    (recommended - starts both server and app)');
    console.log('   npm run server (server only)');
    console.log('   npm start      (app only - server must be running separately)');
    console.log('\n📖 For detailed instructions, see README.md and INSTALL.md');
} else {
    console.log('❌ Installation has issues. Please:');
    console.log('   1. Ensure you are in the pomodoro-app directory');
    console.log('   2. Run "npm install" to install dependencies');
    console.log('   3. Check that Node.js v16+ is installed');
}

console.log('\n🍅 Happy focusing with your team!');
process.exit(allFilesPresent && nodeMajor >= 16 ? 0 : 1);