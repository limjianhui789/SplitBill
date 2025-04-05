# Troubleshooting the Deployment Server

If you're experiencing issues with the deployment server, follow these steps to diagnose and fix the problems.

## Service Failing to Start

If the systemd service is failing to start with errors like:

```
Active: failed (Result: exit-code)
```

Follow these troubleshooting steps:

### Step 1: Check if the directory structure is correct

```bash
# Verify the deployment server directory exists
ls -la /www/wwwroot/SplitBillv2/deploy-server/

# Verify the project directory exists
ls -la /www/wwwroot/SplitBillv2/SplitBill/
```

### Step 2: Run the test script to diagnose issues

```bash
cd /www/wwwroot/SplitBillv2/deploy-server/
node test-deploy-server.js
```

This will check:
- If all required modules are available
- If environment variables are accessible
- If the project directory exists and is a git repository
- If the logs directory can be created and written to
- If an Express server can be started

### Step 3: Try running the simplified server manually

```bash
cd /www/wwwroot/SplitBillv2/deploy-server/
node deploy-server-simple.js
```

This simplified version has fewer features but should be more reliable. If it works, you can use it as a starting point.

### Step 4: Check the systemd journal for detailed error logs

```bash
sudo journalctl -u splitbill-deploy.service -n 50
```

Look for specific error messages that might indicate what's going wrong.

### Step 5: Check for dependency issues

```bash
cd /www/wwwroot/SplitBillv2/deploy-server/
npm list
```

Make sure all required dependencies are installed correctly.

## Common Issues and Solutions

### Logs Directory Being Removed

If you see an error like this:

```
Error: ENOENT: no such file or directory, open '/www/wwwroot/SplitBillv2/SplitBill/logs/deploy-YYYY-MM-DD.log'
```

This happens because the `git clean -f -d` command removes the logs directory. The updated scripts now handle this by recreating the logs directory after the git clean command. If you're still seeing this issue, make sure you're using the latest version of the deployment scripts.

### Missing Dependencies

If you see errors about missing modules:

```bash
cd /www/wwwroot/SplitBillv2/deploy-server/
npm install express dotenv crypto --no-fund --no-audit --legacy-peer-deps
```

### Permission Issues

If there are permission problems:

```bash
# Make sure the deploy-server directory is owned by the correct user
sudo chown -R root:root /www/wwwroot/SplitBillv2/deploy-server/

# Make sure the scripts are executable
sudo chmod +x /www/wwwroot/SplitBillv2/deploy-server/*.js
```

### Node.js Version Issues

Check your Node.js version:

```bash
node --version
```

Make sure you're using a recent version (14.x or higher).

### Environment Variables

If the .env file is missing or has incorrect values:

```bash
cd /www/wwwroot/SplitBillv2/deploy-server/
cat .env
```

Make sure it contains:
```
PORT=9000
WEBHOOK_SECRET=your-secret-here
BRANCH=main
PROJECT_DIR=/www/wwwroot/SplitBillv2/SplitBill
```

### Systemd Service Configuration

If the service configuration is incorrect:

```bash
# Edit the service file
sudo nano /etc/systemd/system/splitbill-deploy.service

# After making changes, reload systemd
sudo systemctl daemon-reload

# Try starting the service again
sudo systemctl start splitbill-deploy.service
```

## Manual Deployment

If the automatic deployment server isn't working, you can still manually deploy:

```bash
cd /www/wwwroot/SplitBillv2/SplitBill
git fetch --all
git reset --hard origin/main
git clean -f -d
npm install --no-fund --no-audit --legacy-peer-deps
npm run build
```

## Getting More Help

If you're still having issues, check:
- The Node.js logs
- The systemd journal
- The deployment server logs in `/www/wwwroot/SplitBillv2/deploy-server/logs/`
