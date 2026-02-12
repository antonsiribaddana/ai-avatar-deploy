#!/bin/bash

# Deployment script for AI Avatar Platform
SERVER_IP="185.127.17.184"
SERVER_USER="root"
APP_DIR="/root/ai-avatar-project"

echo "🚀 Starting deployment to $SERVER_IP..."

# Step 1: Create directory on server
echo "📁 Creating application directory..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $APP_DIR"

# Step 2: Copy project files to server
echo "📤 Transferring files to server..."
scp -r ./* $SERVER_USER@$SERVER_IP:$APP_DIR/

# Step 3: Install Docker if not installed
echo "🐳 Checking Docker installation..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    apt-get update
    apt-get install -y ca-certificates curl gnupg lsb-release
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi
EOF

# Step 4: Set up environment variables
echo "🔐 Setting up environment variables..."
ssh $SERVER_USER@$SERVER_IP "cd $APP_DIR && cat > .env << 'ENVEOF'
SUPABASE_URL=https://enomgubgaipyujbufzlq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVub21ndWJnYWlweXVqYnVmemxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMzY0NzgsImV4cCI6MjA1MjYxMjQ3OH0.YbNEJjcUVOCPKFpL5A9bDEvx6wH1cNHgKH6tWYKfnk4
JWT_SECRET=your-super-secret-key-change-this-ai-avatar-2024
GEMINI_API_KEY=AIzaSyDC3timm-1PeM356GT9dCqCA257BgzN5F0
PORT=5000
ENVEOF
"

# Step 5: Build and start Docker containers
echo "🏗️  Building and starting containers..."
ssh $SERVER_USER@$SERVER_IP "cd $APP_DIR && docker compose down && docker compose up -d --build"

# Step 6: Check status
echo "✅ Checking container status..."
ssh $SERVER_USER@$SERVER_IP "docker ps"

echo ""
echo "✨ Deployment completed!"
echo "🌐 Your app should be accessible at:"
echo "   Frontend: http://$SERVER_IP"
echo "   Backend:  http://$SERVER_IP:5000"
echo "   AI Service: http://$SERVER_IP:8000"
echo ""
echo "📊 To check logs, run:"
echo "   ssh $SERVER_USER@$SERVER_IP 'cd $APP_DIR && docker compose logs -f'"
