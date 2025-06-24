#!/bin/bash

echo "🤖 Starting Meeting Bot with Gmail Login"
echo "========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Please create .env file from .env.example"
    echo "💡 cp .env.example .env && nano .env"
    exit 1
fi

# Load environment variables
export $(cat .env | xargs)

# Validate required credentials
if [ -z "$GMAIL_EMAIL" ] || [ -z "$GMAIL_PASSWORD" ]; then
    echo "❌ Gmail credentials not found in .env"
    echo "📝 Please set GMAIL_EMAIL and GMAIL_PASSWORD in .env file"
    exit 1
fi

# Check if meeting URL provided
if [ -z "$1" ]; then
    echo "❌ Meeting URL required"
    echo "📖 Usage: ./run-with-gmail.sh 'https://meet.google.com/your-link'"
    echo "📖 Usage: ./run-with-gmail.sh 'https://meet.google.com/your-link' 'Bot Name'"
    exit 1
fi

# Run the bot
echo "🔐