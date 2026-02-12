# PowerShell deployment script for AI Avatar Platform
$SERVER_IP = "185.127.17.184"
$SERVER_USER = "root"
$PASSWORD = "sevenseas098Q!"
$APP_DIR = "/root/ai-avatar-project"

Write-Host "🚀 Starting deployment to $SERVER_IP..." -ForegroundColor Green

# Install Posh-SSH if not installed
if (!(Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Host "📦 Installing Posh-SSH module..." -ForegroundColor Yellow
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser
}

Import-Module Posh-SSH

# Create secure password
$securePassword = ConvertTo-SecureString $PASSWORD -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($SERVER_USER, $securePassword)

# Step 1: Create SSH session
Write-Host "🔗 Connecting to server..." -ForegroundColor Yellow
$session = New-SSHSession -ComputerName $SERVER_IP -Credential $credential -AcceptKey

# Step 2: Create directory
Write-Host "📁 Creating application directory..." -ForegroundColor Yellow
Invoke-SSHCommand -SessionId $session.SessionId -Command "mkdir -p $APP_DIR"

# Step 3: Install Docker
Write-Host "🐳 Installing Docker..." -ForegroundColor Yellow
$dockerScript = @"
if ! command -v docker &> /dev/null; then
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl start docker
    systemctl enable docker
    echo 'Docker installed'
else
    echo 'Docker already installed'
fi
"@
Invoke-SSHCommand -SessionId $session.SessionId -Command $dockerScript -TimeOut 300

# Step 4: Create SFTP session and upload files
Write-Host "📤 Transferring files..." -ForegroundColor Yellow
$sftp = New-SFTPSession -ComputerName $SERVER_IP -Credential $credential -AcceptKey

# Upload each directory
Write-Host "  ├─ Uploading frontend..." -ForegroundColor Cyan
Set-SFTPItem -SessionId $sftp.SessionId -Path "E:\Uni-research\ai-avatar-project\frontend" -Destination "$APP_DIR/" -Force

Write-Host "  ├─ Uploading backend..." -ForegroundColor Cyan
Set-SFTPItem -SessionId $sftp.SessionId -Path "E:\Uni-research\ai-avatar-project\backend" -Destination "$APP_DIR/" -Force

Write-Host "  ├─ Uploading ai-service..." -ForegroundColor Cyan
Set-SFTPItem -SessionId $sftp.SessionId -Path "E:\Uni-research\ai-avatar-project\ai-service" -Destination "$APP_DIR/" -Force

Write-Host "  └─ Uploading docker-compose.yml..." -ForegroundColor Cyan
Set-SFTPItem -SessionId $sftp.SessionId -Path "E:\Uni-research\ai-avatar-project\docker-compose.yml" -Destination "$APP_DIR/" -Force

# Step 5: Create .env file
Write-Host "🔐 Setting up environment variables..." -ForegroundColor Yellow
$envContent = @"
SUPABASE_URL=https://enomgubgaipyujbufzlq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVub21ndWJnYWlweXVqYnVmemxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMzY0NzgsImV4cCI6MjA1MjYxMjQ3OH0.YbNEJjcUVOCPKFpL5A9bDEvx6wH1cNHgKH6tWYKfnk4
JWT_SECRET=your-super-secret-key-change-this-ai-avatar-2024
GEMINI_API_KEY=AIzaSyDC3timm-1PeM356GT9dCqCA257BgzN5F0
PORT=5000
"@
Invoke-SSHCommand -SessionId $session.SessionId -Command "cat > $APP_DIR/.env << 'ENVEOF'`n$envContent`nENVEOF"

# Step 6: Build and start containers
Write-Host "🏗️  Building and starting Docker containers..." -ForegroundColor Yellow
Invoke-SSHCommand -SessionId $session.SessionId -Command "cd $APP_DIR && docker compose down && docker compose up -d --build" -TimeOut 600

# Step 7: Check status
Write-Host "✅ Checking container status..." -ForegroundColor Yellow
$status = Invoke-SSHCommand -SessionId $session.SessionId -Command "docker ps"
Write-Host $status.Output

# Cleanup
Remove-SSHSession -SessionId $session.SessionId
Remove-SFTPSession -SessionId $sftp.SessionId

Write-Host ""
Write-Host "✨ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Your app is accessible at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$SERVER_IP" -ForegroundColor White
Write-Host "   Backend:  http://${SERVER_IP}:5000" -ForegroundColor White
Write-Host "   AI Service: http://${SERVER_IP}:8000" -ForegroundColor White
