#!/bin/bash

echo "🚀 Starting NASA TEMPO Air Quality Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your API keys."
    echo ""
fi

# Check if database exists
if [ ! -f db/development.sqlite3 ]; then
    echo "📦 Setting up database..."
    bundle exec rake db:create
    bundle exec rake db:migrate
    echo "✅ Database created and migrated"
    echo ""
    
    read -p "Would you like to seed the database with sample data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        bundle exec rake db:seed
        echo "✅ Database seeded with sample data"
    fi
    echo ""
fi

# Start the server
echo "🌐 Starting server on http://localhost:4567"
echo "📊 API documentation: http://localhost:4567"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

bundle exec rerun 'ruby app.rb'
