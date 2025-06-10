#!/bin/bash

echo "=== Testing Pomodoro Timer Build ==="
echo ""

# Function to test server connection
test_server_connection() {
    local port=$1
    echo -n "Testing connection to port $port... "
    
    # Use netcat or telnet to test
    if command -v nc &> /dev/null; then
        if nc -z localhost $port 2>/dev/null; then
            echo "✅ Connected"
            return 0
        else
            echo "❌ Failed"
            return 1
        fi
    elif command -v telnet &> /dev/null; then
        if echo "quit" | telnet localhost $port 2>/dev/null | grep -q "Connected"; then
            echo "✅ Connected"
            return 0
        else
            echo "❌ Failed"
            return 1
        fi
    else
        echo "⚠️  No network testing tool available"
        return 2
    fi
}

# Test development mode
echo "1. Testing Development Mode (start.sh)"
echo "-----------------------------------"
./start.sh &
DEV_PID=$!

echo "Waiting for server to start..."
sleep 5

# Test connection
test_server_connection 3456

# Kill the dev process
echo "Stopping development server..."
kill $DEV_PID 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "node server/server.js" 2>/dev/null
sleep 2

echo ""
echo "2. Testing Production Build"
echo "-------------------------"

# Build the app
echo "Building application..."
npm run build

# Find the built app
if [[ "$OSTYPE" == "darwin"* ]]; then
    APP_PATH=$(find dist -name "*.app" -type d | head -1)
    if [ -n "$APP_PATH" ]; then
        echo "Found app at: $APP_PATH"
        
        # Check server files
        echo ""
        echo "Checking server files in build..."
        if [ -f "$APP_PATH/Contents/Resources/app/server/server.js" ]; then
            echo "✅ server.js found"
        else
            echo "❌ server.js missing"
        fi
        
        if [ -f "$APP_PATH/Contents/Resources/app/server/server-wrapper.js" ]; then
            echo "✅ server-wrapper.js found"
        else
            echo "❌ server-wrapper.js missing"
        fi
        
        # Check node_modules
        if [ -d "$APP_PATH/Contents/Resources/app/node_modules/socket.io" ]; then
            echo "✅ socket.io modules found"
        else
            echo "❌ socket.io modules missing"
        fi
        
        # Run the built app
        echo ""
        echo "Starting built application..."
        open "$APP_PATH"
        
        echo "Waiting for server to start..."
        sleep 10
        
        # Test connection
        test_server_connection 3456
        test_server_connection 3457
        test_server_connection 3458
        
        echo ""
        echo "Check the application window and try creating a session."
        echo "Press Enter to close the app and finish testing..."
        read
        
        # Close the app
        osascript -e "quit app \"Collaborative Pomodoro Timer\""
    else
        echo "❌ No built app found"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Linux build testing not implemented yet"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Windows build testing not implemented yet"
fi

echo ""
echo "Testing complete!"