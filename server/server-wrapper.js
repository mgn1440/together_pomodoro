// Server wrapper for production builds
// This helps with module resolution in packaged apps

const path = require('path');
const Module = require('module');

// Add the app's node_modules to the module search path
if (process.resourcesPath) {
  const appNodeModules = path.join(process.resourcesPath, 'app', 'node_modules');
  Module.globalPaths.push(appNodeModules);
  
  // Also add to NODE_PATH
  if (process.env.NODE_PATH) {
    process.env.NODE_PATH = `${process.env.NODE_PATH}${path.delimiter}${appNodeModules}`;
  } else {
    process.env.NODE_PATH = appNodeModules;
  }
  
  // Reinitialize the module system with new paths
  Module._initPaths();
}

// Now start the actual server
require('./server.js');