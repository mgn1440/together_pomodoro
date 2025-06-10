#!/bin/bash

# Start only Electron (for when server is running separately)
echo "🍅 Starting Electron app only..."

# This is useful for development when you want to run server separately
export NODE_ENV=development
npm run start