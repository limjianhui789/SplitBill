/**
 * GitHub Webhook Deployment Server for SplitBill
 *
 * This script creates a simple server that listens for GitHub webhook events
 * and automatically pulls the latest code when a push event is received.
 *
 * Usage:
 * 1. Set environment variables (or create .env file):
 *    - WEBHOOK_SECRET: The secret configured in GitHub webhook
 *    - PORT: The port to run the server on (default: 9000)
 *    - PROJECT_DIR: The directory of the SplitBill project
 * 2. Run: node deploy-server.js
 *
 * For production use, this should be run as a systemd service.
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
const PROJECT_DIR = process.env.PROJECT_DIR || '/www/wwwroot/SplitBillv2/SplitBill';

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

// Ensure logs directory exists with proper permissions
try {
  if (!fs.existsSync(logsDir)) {
    console.log(`Creating logs directory at ${logsDir}`);
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (error) {
  console.error(`Failed to create logs directory: ${error.message}`);
}

// Log function that writes to file and console
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);

  // Try to write to log file, but continue if it fails
  try {
    // Ensure logs directory exists before writing
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = path.join(logsDir, `deploy-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logMessage + '\n');
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
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
    try {
      // Verify the working directory exists
      if (!fs.existsSync(workDir)) {
        const errorMsg = `Working directory does not exist: ${workDir}`;
        log(errorMsg);
        return reject(new Error(errorMsg));
      }

      log(`Executing: ${command} in ${workDir}`);
      exec(command, { cwd: workDir, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
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
    } catch (execError) {
      const errorMsg = `Failed to execute command: ${execError.message}`;
      log(errorMsg);
      reject(execError);
    }
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

    // Execute deployment steps in the project directory
    await executeCommand('git fetch --all', PROJECT_DIR);
    await executeCommand(`git reset --hard origin/${BRANCH}`, PROJECT_DIR);

    // Create logs directory if it was removed by git clean
    try {
      if (!fs.existsSync(logsDir)) {
        log('Recreating logs directory that may have been removed by git operations');
        fs.mkdirSync(logsDir, { recursive: true });
      }
    } catch (error) {
      console.error(`Failed to recreate logs directory: ${error.message}`);
    }

    // Run git clean with caution
    await executeCommand('git clean -f -d', PROJECT_DIR);

    // Only run npm commands if package.json exists
    if (fs.existsSync(path.join(PROJECT_DIR, 'package.json'))) {
      await executeCommand('npm install --no-fund --no-audit --legacy-peer-deps', PROJECT_DIR);
      await executeCommand('npm run build', PROJECT_DIR);
    }

    log('Deployment completed successfully');
  } catch (error) {
    log(`Deployment failed: ${error.message}`);
  }
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).send('Webhook server is running');
});

// Start the server
app.listen(PORT, () => {
  log(`Webhook server listening on port ${PORT}`);
  log(`Webhook URL: http://your-server-ip:${PORT}/webhook`);
  log(`Project directory: ${PROJECT_DIR}`);
});
