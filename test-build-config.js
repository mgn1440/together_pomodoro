const fs = require('fs');
const path = require('path');

console.log('Verifying Windows Build Configuration...\n');

// Check package.json
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    console.log('✓ package.json found');
    
    // Check Windows build config
    if (packageJson.build && packageJson.build.win) {
        console.log('✓ Windows build configuration present');
        console.log('  - Target:', JSON.stringify(packageJson.build.win.target));
        console.log('  - Icon:', packageJson.build.win.icon);
    } else {
        console.log('✗ Windows build configuration missing');
    }
    
    // Check build scripts
    if (packageJson.scripts && packageJson.scripts['build:win']) {
        console.log('✓ Windows build script present:', packageJson.scripts['build:win']);
    } else {
        console.log('✗ Windows build script missing');
    }
    
} catch (error) {
    console.log('✗ Error reading package.json:', error.message);
}

// Check icon file
const iconPath = path.join('assets', 'icons', 'icon.ico');
if (fs.existsSync(iconPath)) {
    const stats = fs.statSync(iconPath);
    console.log(`✓ Windows icon found (${stats.size} bytes)`);
} else {
    console.log('✗ Windows icon missing at:', iconPath);
}

// Check build scripts
const scripts = ['build-windows.bat', 'build-windows.ps1'];
scripts.forEach(script => {
    if (fs.existsSync(script)) {
        console.log(`✓ ${script} found`);
    } else {
        console.log(`✗ ${script} missing`);
    }
});

console.log('\nConfiguration check complete!');