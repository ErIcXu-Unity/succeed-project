#!/bin/bash
set -e

echo "Starting Railway deployment..."

# Start nginx
echo "Starting nginx..."
nginx

# Wait a moment for nginx to start
sleep 2

# Start Flask backend
echo "Starting Flask backend on port 5001..."
cd /app/backend

# Set production environment
export FLASK_ENV=production
export PYTHONUNBUFFERED=1

# Run Flask app
python app.py &

# Keep the container running
wait
