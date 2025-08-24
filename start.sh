#!/bin/bash
set -e

echo "Starting Railway deployment - Flask only..."

# Start Flask backend directly
echo "Starting Flask backend on port 80..."
cd /app/backend

# Set production environment
export FLASK_ENV=production
export PYTHONUNBUFFERED=1

echo "Starting Flask application on port 80..."
# Run Flask app directly
exec python app.py
