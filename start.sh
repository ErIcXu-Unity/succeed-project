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
# Run Flask app directly on port 80
exec python -c "
import os
from app import create_app

app = create_app()
from models import db

with app.app_context():
    db.create_all()
    from seed_data import seed_all_data
    seed_all_data()
    print('Database initialized successfully')
    
print('Starting Flask on port 80')
app.run(host='0.0.0.0', port=80, debug=False)
"
