#!/bin/bash

echo "🚀 MingleMood Edge Function - Auto Fix & Deploy"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID="vijinjtpbrfkyjrzilnm"
FUNCTION_NAME="make-server-4bcc747c"
SOURCE_DIR="supabase/functions/server"
TARGET_DIR="supabase/functions/$FUNCTION_NAME"

echo -e "${BLUE}📋 Step 1: Check Prerequisites${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

echo -e "${BLUE}📋 Step 2: Prepare Files${NC}"
echo ""

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

echo "Copying and fixing files..."

# Copy and rename index.tsx to index.ts
if [ -f "$SOURCE_DIR/index.tsx" ]; then
    echo "  📄 Processing index.tsx..."
    # Use sed to change .tsx imports to .ts
    sed 's/\.tsx/\.ts/g' "$SOURCE_DIR/index.tsx" > "$TARGET_DIR/index.ts"
    echo -e "  ${GREEN}✅ index.ts created${NC}"
else
    echo -e "  ${RED}❌ index.tsx not found in $SOURCE_DIR${NC}"
    exit 1
fi

# Copy kv_store.tsx to kv_store.ts
if [ -f "$SOURCE_DIR/kv_store.tsx" ]; then
    echo "  📄 Processing kv_store.tsx..."
    cp "$SOURCE_DIR/kv_store.tsx" "$TARGET_DIR/kv_store.ts"
    echo -e "  ${GREEN}✅ kv_store.ts created${NC}"
else
    echo -e "  ${YELLOW}⚠️  kv_store.tsx not found (may not be needed)${NC}"
fi

# Copy email-service.tsx to email-service.ts
if [ -f "$SOURCE_DIR/email-service.tsx" ]; then
    echo "  📄 Processing email-service.tsx..."
    cp "$SOURCE_DIR/email-service.tsx" "$TARGET_DIR/email-service.ts"
    echo -e "  ${GREEN}✅ email-service.ts created${NC}"
else
    echo -e "  ${YELLOW}⚠️  email-service.tsx not found (may not be needed)${NC}"
fi

# Copy database-setup.tsx to database-setup.ts
if [ -f "$SOURCE_DIR/database-setup.tsx" ]; then
    echo "  📄 Processing database-setup.tsx..."
    cp "$SOURCE_DIR/database-setup.tsx" "$TARGET_DIR/database-setup.ts"
    echo -e "  ${GREEN}✅ database-setup.ts created${NC}"
else
    echo -e "  ${YELLOW}⚠️  database-setup.tsx not found (may not be needed)${NC}"
fi

echo ""
echo -e "${GREEN}✅ All files prepared in: $TARGET_DIR${NC}"
echo ""

echo -e "${BLUE}📋 Step 3: Link Project (if not already linked)${NC}"
echo ""

# Try to link project (will skip if already linked)
supabase link --project-ref $PROJECT_ID 2>/dev/null || echo "Project already linked or link skipped"

echo ""
echo -e "${BLUE}📋 Step 4: Deploy Function${NC}"
echo ""

# Deploy the function
echo "Deploying $FUNCTION_NAME..."
supabase functions deploy $FUNCTION_NAME --project-ref $PROJECT_ID --no-verify-jwt

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 SUCCESS! Edge Function Deployed!${NC}"
    echo ""
    echo "✅ Function: $FUNCTION_NAME"
    echo "✅ Project: $PROJECT_ID"
    echo "✅ URL: https://$PROJECT_ID.supabase.co/functions/v1/$FUNCTION_NAME"
    echo ""
    echo -e "${BLUE}📋 Test the deployment:${NC}"
    echo "1. Health check:"
    echo "   curl https://$PROJECT_ID.supabase.co/functions/v1/$FUNCTION_NAME/health"
    echo ""
    echo "2. Sign in to your app as mutemela72@gmail.com"
    echo "3. Check Admin tab - should work now!"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo ""
    echo "Common issues:"
    echo "1. Not logged in: Run 'supabase login'"
    echo "2. Wrong project: Check project ID"
    echo "3. Missing dependencies: Check import statements"
    echo ""
    echo "View logs:"
    echo "  supabase functions logs $FUNCTION_NAME"
    echo ""
    exit 1
fi
