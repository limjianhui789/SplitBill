/**
 * GitHub Webhook Deployment Server for SplitBill
 * 
 * This script creates a simple server that listens for GitHub webhook events
 * and automatically pulls the latest code when a push event is received.
 * 
 * Usage:
 * 1. Install dependencies: npm install express crypto child_process
 * 2. Set environment variables (or create .env file):
 *    - WEBHOOK_SECRET: The secret configured in GitHub webhook
 *    - PORT: The port to run the server on (default: 9000)
 * 3. Run: node deploy-server.js
 * 
 * For production use, consider running this with PM2 or as a systemd service.
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
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Also write to log file
  const logFile = path.join(logsDir, `deploy-${new Date().toISOString().split('T')[0]}.log`);
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
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    log(`Executing: ${command}`);
    exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        log(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        log(`stderr: ${stderr}`);
      }
      log(`stdout: ${stdout}`);
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
      log(`Received non-push event: ${event}`);
      return res.status(200).send('Event acknowledged but no action taken');
    }

    // Check if it's the correct branch
    const payload = req.body;
    const branchRef = payload.ref;
    if (!branchRef.endsWith(BRANCH)) {
      log(`Push to branch ${branchRef} ignored. Only deploying from ${BRANCH}`);
      return res.status(200).send(`Push to ${branchRef} acknowledged but no action taken`);
    }

    // Send immediate response to GitHub
    res.status(200).send('Webhook received, deployment started');

    // Log the deployment
    log(`Deploying from ${branchRef} after push by ${payload.pusher.name}`);

    // Execute deployment steps
    await executeCommand('git fetch --all');
    await executeCommand(`git reset --hard origin/${BRANCH}`);
    await executeCommand('git clean -f -d');
    await executeCommand('npm install');
    await executeCommand('npm run build');

    log('Deployment completed successfully');
  } catch (error) {
    log(`Deployment failed: ${error.message}`);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Webhook server is running');
});

// Start the server
app.listen(PORT, () => {
  log(`Webhook server listening on port ${PORT}`);
  log(`Webhook URL: http://your-server-ip:${PORT}/webhook`);
});
