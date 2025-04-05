# SplitBill Automatic Deployment Server

This directory contains scripts to set up an automatic deployment server for SplitBill using GitHub webhooks. When properly configured, your server will automatically pull the latest code from GitHub whenever changes are pushed to the repository.

## How It Works

1. A Node.js server listens for webhook events from GitHub
2. When a push event is received, the server verifies the webhook signature
3. If the signature is valid and the push is to the configured branch, the server:
   - Pulls the latest code from GitHub
   - Installs dependencies
   - Builds the application
   - Logs the deployment process

## Setup Instructions

### Prerequisites

- A server with Node.js installed
- Git installed on the server
- Your SplitBill repository already cloned on the server
- Sudo/root access on the server

### Automatic Setup

1. Navigate to your SplitBill repository directory on the server
2. Make the setup script executable:
   ```bash
   chmod +x setup-deploy-server.sh
   ```
3. Run the setup script with sudo:
   ```bash
   sudo ./setup-deploy-server.sh
   ```
4. The script will:
   - Install required dependencies
   - Create a .env file with a randomly generated webhook secret
   - Set up a systemd service to keep the webhook server running
   - Start the webhook server

### Manual Setup

If you prefer to set things up manually:

1. Install required npm packages:
   ```bash
   npm install express crypto dotenv
   ```

2. Create a `.env` file with the following content:
   ```
   PORT=9000
   WEBHOOK_SECRET=your-secret-here
   BRANCH=main
   ```
   Replace `your-secret-here` with a randomly generated string.

3. Start the server:
   ```bash
   node deploy-server.js
   ```

4. For production use, set up the systemd service:
   ```bash
   # Edit the service file to update the WorkingDirectory
   sudo cp splitbill-deploy.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable splitbill-deploy.service
   sudo systemctl start splitbill-deploy.service
   ```

## Configuring GitHub Webhook

1. Go to your GitHub repository
2. Click on "Settings" > "Webhooks" > "Add webhook"
3. Configure the webhook:
   - Payload URL: `http://your-server-ip:9000/webhook`
   - Content type: `application/json`
   - Secret: Use the same secret you configured in the `.env` file
   - Events: Select "Just the push event"
   - Active: Check this box

4. Click "Add webhook"

## Testing the Webhook

1. Make a small change to your repository and push it to GitHub
2. Check the logs on your server:
   ```bash
   sudo journalctl -u splitbill-deploy.service -f
   ```
   or
   ```bash
   cat logs/deploy-YYYY-MM-DD.log
   ```

3. You should see logs indicating that the webhook was received and the deployment process was executed

## Troubleshooting

### Webhook Not Triggering

- Check if the webhook server is running: `systemctl status splitbill-deploy.service`
- Verify your server is accessible from the internet
- Check GitHub webhook delivery logs in the repository settings
- Ensure the webhook secret matches between GitHub and your `.env` file

### Deployment Failing

- Check the logs: `cat logs/deploy-YYYY-MM-DD.log`
- Ensure the server has proper permissions to the repository directory
- Verify that Git is properly configured on the server

## Security Considerations

- The webhook server should ideally be behind a reverse proxy with HTTPS
- Consider restricting access to the webhook server using a firewall
- Regularly rotate the webhook secret
- Run the server with minimal permissions necessary

## Customizing the Deployment Process

You can customize the deployment process by editing the `deploy-server.js` file. Look for the section where the deployment commands are executed to add or modify steps as needed for your specific deployment requirements.
