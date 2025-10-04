#!/bin/bash

# NASA TEMPO Air Quality Monitor - Git Push Script

echo "🚀 Preparing to commit NASA TEMPO Air Quality Monitor..."
echo ""

# Add all files
echo "📦 Adding all files..."
git add .

# Show status
echo ""
echo "📋 Git status:"
git status --short

# Commit with message
echo ""
echo "💾 Committing changes..."
git commit -F GIT_COMMIT_MESSAGE.txt

# Show commit
echo ""
echo "✅ Commit created:"
git log -1 --oneline

echo ""
echo "🎯 Ready to push!"
echo ""
echo "Run: git push origin main"
echo ""
echo "Or run: git push origin <your-branch-name>"
