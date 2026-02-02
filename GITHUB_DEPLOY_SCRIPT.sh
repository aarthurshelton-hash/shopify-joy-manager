#!/bin/bash

# GitHub Pages Deployment Script for En Pensent
echo "🚀 Deploying En Pensent to GitHub Pages..."

# Variables
GITHUB_USERNAME="your-username"  # Replace with your GitHub username
REPO_NAME="enpensent"
DIST_PATH="/Users/alecshelts/shopify-joy-manager/dist"

# Step 1: Initialize Git repository
echo "📁 Initializing Git repository..."
cd "$DIST_PATH"
git init
git branch -M main

# Step 2: Add remote (you'll need to create the repo first)
echo "🔗 Adding remote..."
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Step 3: Add all files
echo "📦 Adding files..."
git add .
git commit -m "Deploy En Pensent to GitHub Pages"

# Step 4: Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo "✅ Deployment complete!"
echo "🌐 Your site will be live at: https://$GITHUB_USERNAME.github.io/$REPO_NAME"
