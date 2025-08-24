#!/bin/bash
set -e

echo "Starting Railway deployment..."

# Check if frontend files exist
echo "Checking frontend files..."
ls -la /var/www/html/ | head -10

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# Start nginx
echo "Starting nginx..."
nginx

# Check if nginx is running
echo "Checking nginx process..."
ps aux | grep nginx

# Test if nginx is responding
echo "Testing nginx on port 80..."
sleep 3
curl -f http://localhost:80/ || echo "Nginx not responding on port 80"

# Start Flask backend
echo "Starting Flask backend on port 5001..."
cd /app/backend

# Set production environment
export FLASK_ENV=production
export PYTHONUNBUFFERED=1

# Run Flask app in background
python app.py &
FLASK_PID=$!

# Wait for Flask to start
sleep 5

# Test if Flask is responding
echo "Testing Flask on port 5001..."
curl -f http://localhost:5001/ || echo "Flask not responding on port 5001"

# Keep the container running
echo "All services started. Waiting..."
wait $FLASK_PID
