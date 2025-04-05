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

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
  echo "Node.js not found. Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
fi

# Install required npm packages
echo "Installing required npm packages..."
npm install express crypto dotenv

# Create .env file for configuration
if [ ! -f .env ]; then
  echo "Creating .env file..."
  
  # Generate a random webhook secret
  WEBHOOK_SECRET=$(openssl rand -hex 20)
  
  cat > .env << EOF
PORT=9000
WEBHOOK_SECRET=${WEBHOOK_SECRET}
BRANCH=main
EOF

  echo "Created .env file with a randomly generated webhook secret"
  echo "Your webhook secret is: ${WEBHOOK_SECRET}"
  echo "Make sure to use this secret when setting up the webhook in GitHub"
else
  echo ".env file already exists, skipping creation"
fi

# Set up systemd service
echo "Setting up systemd service..."
SCRIPT_DIR=$(pwd)
SERVICE_FILE="${SCRIPT_DIR}/splitbill-deploy.service"

# Update the service file with the correct path
sed -i "s|WorkingDirectory=/path/to/your/splitbill/directory|WorkingDirectory=${SCRIPT_DIR}|g" "${SERVICE_FILE}"

# Copy service file to systemd directory
cp "${SERVICE_FILE}" /etc/systemd/system/

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
echo "  - Secret: Check your .env file for the WEBHOOK_SECRET value"
echo "  - Events: Just the push event"
echo ""
echo "To view logs: journalctl -u splitbill-deploy.service -f"
