#!/bin/bash
# Manual Deployment Script for Shopify Joy Manager
# Run this script to deploy the application

echo "🚀 Shopify Joy Manager Deployment Script"
echo ""

# Build the application
echo "Step 1: Building application..."
npm run build

if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed - dist/index.html not found"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Option 1: Deploy to Netlify (requires Netlify CLI setup)
echo "Step 2: Choose deployment method"
echo ""
echo "Option 1: Deploy to Netlify"
echo "   - Install Netlify CLI: npm install -g netlify-cli"
echo "   - Login: netlify login"
echo "   - Deploy: netlify deploy --prod --dir=dist"
echo ""
echo "Option 2: Deploy to Vercel (requires Vercel CLI setup)"
echo "   - Install Vercel CLI: npm install -g vercel"
echo "   - Login: vercel login"
echo "   - Deploy: vercel --prod"
echo ""
echo "Option 3: Deploy to Surge.sh (simplest)"
echo "   - Install Surge: npm install -g surge"
echo "   - Deploy: surge dist shopify-joy-manager.surge.sh"
echo ""
echo "Option 4: Manual ZIP upload"
echo "   - Zip the dist/ folder"
echo "   - Upload to Netlify/Vercel dashboard"
echo ""

# Check if user has any CLI installed
if command -v netlify &> /dev/null; then
    echo "✅ Netlify CLI found"
    read -p "Deploy to Netlify? (y/n): " choice
    if [ "$choice" = "y" ]; then
        netlify deploy --prod --dir=dist
        echo "✅ Deployed to Netlify"
        exit 0
    fi
fi

if command -v vercel &> /dev/null; then
    echo "✅ Vercel CLI found"
    read -p "Deploy to Vercel? (y/n): " choice
    if [ "$choice" = "y" ]; then
        vercel --prod
        echo "✅ Deployed to Vercel"
        exit 0
    fi
fi

if command -v surge &> /dev/null; then
    echo "✅ Surge CLI found"
    read -p "Deploy to Surge.sh? (y/n): " choice
    if [ "$choice" = "y" ]; then
        surge dist shopify-joy-manager.surge.sh
        echo "✅ Deployed to Surge.sh"
        exit 0
    fi
fi

echo ""
echo "📦 Build complete. dist/ folder ready for deployment."
echo "Install one of the CLIs above or manually upload the dist/ folder."
