#!/bin/bash
# Setup script for SplitBill deployment server

# Exit on error
set -e

echo "Setting up SplitBill deployment server..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

# Create a separate directory for the deployment server
DEPLOY_DIR="/www/wwwroot/SplitBillv2/deploy-server"
PROJECT_DIR="/www/wwwroot/SplitBillv2/SplitBill"

# Create deploy directory if it doesn't exist
if [ ! -d "$DEPLOY_DIR" ]; then
  echo "Creating deployment server directory at $DEPLOY_DIR..."
  mkdir -p "$DEPLOY_DIR"
fi

# Navigate to the deployment directory
cd "$DEPLOY_DIR"

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
  echo "Node.js not found. Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
fi

# Create a new package.json for the deployment server
echo "Creating package.json for deployment server..."
cat > package.json << EOF
{
  "name": "splitbill-deploy-server",
  "version": "1.0.0",
  "description": "GitHub webhook deployment server for SplitBill",
  "main": "deploy-server.js",
  "scripts": {
    "start": "node deploy-server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": ">=14.0.0"
  },
  "private": true
}
EOF

# Install required npm packages
echo "Installing required npm packages..."
npm install

# Create deployment server script
echo "Creating deployment server script..."
cat > deploy-server.js << EOF
/**
 * GitHub Webhook Deployment Server for SplitBill
 *
 * This script creates a simple server that listens for GitHub webhook events
 * and automatically pulls the latest code when a push event is received.
 */

const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file if present
try {
  if (fs.existsSync('.env')) {
    require('dotenv').config();
  }
} catch (error) {
  console.warn('No .env file found or dotenv not installed. Using environment variables.');
}

// Configuration
const app = express();
const PORT = process.env.PORT || 9000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const BRANCH = process.env.BRANCH || 'main'; // Default branch to deploy
const PROJECT_DIR = process.env.PROJECT_DIR || '${PROJECT_DIR}';

// Ensure webhook secret is set
if (!WEBHOOK_SECRET) {
  console.error('Error: WEBHOOK_SECRET environment variable is not set');
  console.error('Please set this to the secret configured in your GitHub webhook');
  process.exit(1);
}

// Parse JSON request bodies
app.use(express.json());

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log function that writes to file and console
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = \`[\${timestamp}] \${message}\`;
  console.log(logMessage);

  // Also write to log file
  const logFile = path.join(logsDir, \`deploy-\${new Date().toISOString().split('T')[0]}.log\`);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Verify GitHub webhook signature
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return false;
  }

  // Create HMAC
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Execute shell command and return a promise
function executeCommand(command, workDir = __dirname) {
  return new Promise((resolve, reject) => {
    log(\`Executing: \${command} in \${workDir}\`);
    exec(command, { cwd: workDir, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        log(\`Error: \${error.message}\`);
        return reject(error);
      }
      if (stderr) {
        log(\`stderr: \${stderr}\`);
      }
      log(\`stdout: \${stdout}\`);
      resolve(stdout);
    });
  });
}

// GitHub webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifySignature(req)) {
      log('Invalid webhook signature');
      return res.status(401).send('Unauthorized');
    }

    // Check if it's a push event
    const event = req.headers['x-github-event'];
    if (event !== 'push') {
      log(\`Received non-push event: \${event}\`);
      return res.status(200).send('Event acknowledged but no action taken');
    }

    // Check if it's the correct branch
    const payload = req.body;
    const branchRef = payload.ref;
    if (!branchRef.endsWith(BRANCH)) {
      log(\`Push to branch \${branchRef} ignored. Only deploying from \${BRANCH}\`);
      return res.status(200).send(\`Push to \${branchRef} acknowledged but no action taken\`);
    }

    // Send immediate response to GitHub
    res.status(200).send('Webhook received, deployment started');

    // Log the deployment
    log(\`Deploying from \${branchRef} after push by \${payload.pusher.name}\`);

    // Execute deployment steps in the project directory
    await executeCommand('git fetch --all', PROJECT_DIR);
    await executeCommand(\`git reset --hard origin/\${BRANCH}\`, PROJECT_DIR);
    await executeCommand('git clean -f -d', PROJECT_DIR);

    // Only run npm commands if package.json exists
    if (fs.existsSync(path.join(PROJECT_DIR, 'package.json'))) {
      await executeCommand('npm install --no-fund --no-audit --legacy-peer-deps', PROJECT_DIR);
      await executeCommand('npm run build', PROJECT_DIR);
    }

    log('Deployment completed successfully');
  } catch (error) {
    log(\`Deployment failed: \${error.message}\`);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Webhook server is running');
});

// Start the server
app.listen(PORT, () => {
  log(\`Webhook server listening on port \${PORT}\`);
  log(\`Webhook URL: http://your-server-ip:\${PORT}/webhook\`);
  log(\`Project directory: \${PROJECT_DIR}\`);
});
EOF

# Create .env file for configuration
if [ ! -f .env ]; then
  echo "Creating .env file..."

  # Generate a random webhook secret
  WEBHOOK_SECRET=$(openssl rand -hex 20)

  cat > .env << EOF
PORT=9000
WEBHOOK_SECRET=${WEBHOOK_SECRET}
BRANCH=main
PROJECT_DIR=${PROJECT_DIR}
EOF

  echo "Created .env file with a randomly generated webhook secret"
  echo "Your webhook secret is: ${WEBHOOK_SECRET}"
  echo "Make sure to use this secret when setting up the webhook in GitHub"
else
  echo ".env file already exists, skipping creation"
fi

# Create systemd service file
echo "Creating systemd service file..."
cat > splitbill-deploy.service << EOF
[Unit]
Description=SplitBill GitHub Webhook Deployment Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${DEPLOY_DIR}
ExecStart=/usr/bin/node deploy-server.js
Restart=on-failure
Environment=NODE_ENV=production
# Environment variables are loaded from .env file

[Install]
WantedBy=multi-user.target
EOF

# Set up systemd service
echo "Setting up systemd service..."

# Copy service file to systemd directory
cp splitbill-deploy.service /etc/systemd/system/

# Reload systemd, enable and start the service
systemctl daemon-reload
systemctl enable splitbill-deploy.service
systemctl start splitbill-deploy.service

echo "Checking service status..."
systemctl status splitbill-deploy.service

echo ""
echo "Setup complete!"
echo "Your webhook server is running at: http://your-server-ip:9000/webhook"
echo "Make sure to configure your GitHub webhook with the following settings:"
echo "  - Payload URL: http://your-server-ip:9000/webhook"
echo "  - Content type: application/json"
echo "  - Secret: ${WEBHOOK_SECRET}"
echo "  - Events: Just the push event"
echo ""
echo "To view logs: journalctl -u splitbill-deploy.service -f"
echo "Or check the log files in ${DEPLOY_DIR}/logs/"
