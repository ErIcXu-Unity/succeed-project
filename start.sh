#!/bin/bash
# Don't exit on error for testing commands
set +e

echo "Starting Railway deployment..."

# Check if frontend files exist
echo "Checking frontend files..."
ls -la /var/www/html/ | head -10

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t
if [ $? -ne 0 ]; then
    echo "ERROR: nginx configuration test failed!"
    exit 1
fi

# Start nginx
echo "Starting nginx..."
nginx
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start nginx!"
    exit 1
fi

echo "Nginx started successfully!"
sleep 2

# Start Flask backend
echo "Starting Flask backend on port 5001..."
cd /app/backend

# Set production environment
export FLASK_ENV=production
export PYTHONUNBUFFERED=1

echo "Starting Flask application..."
# Run Flask app in foreground (no background)
exec python app.py
