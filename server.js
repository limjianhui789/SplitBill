// Load environment variables from .env file
require('dotenv').config();

// Get the port from environment variables or use 3000 as default
const PORT = process.env.PORT || 3000;

// Execute serve command with the specified port
const { execSync } = require('child_process');
const command = `npx serve . -l ${PORT}`;

console.log(`Starting server on port ${PORT}...`);
try {
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
