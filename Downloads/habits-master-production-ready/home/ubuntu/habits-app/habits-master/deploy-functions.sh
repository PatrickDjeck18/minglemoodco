#!/bin/bash

# AI Devotion Functions Deployment Script
echo "🚀 Deploying AI Devotion Functions..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Please login to Firebase first:"
    echo "firebase login"
    exit 1
fi

# Navigate to functions directory
cd functions

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Go back to root
cd ..

# Deploy functions
echo "🚀 Deploying Cloud Functions..."
firebase deploy --only functions

# Deploy Firestore rules
echo "📋 Deploying Firestore rules..."
firebase deploy --only firestore:rules

# Deploy Firestore indexes
echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Set your Google AI API key:"
echo "   firebase functions:config:set googleai.api_key=\"YOUR_API_KEY\""
echo ""
echo "2. Test the functions:"
echo "   firebase functions:shell"
echo "   generateDevotionManually()"
echo ""
echo "3. Check the logs:"
echo "   firebase functions:log"
