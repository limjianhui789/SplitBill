// generate-config.js - Generates the config.js file with environment variables
// This script should be run before starting the server

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Create the config content with environment variables
const configContent = `// js/config.js - Configuration settings loaded from environment variables
// This file is auto-generated - DO NOT EDIT DIRECTLY

// Configuration values loaded from environment variables
const Config = {
    // API settings
    GEMINI_API_KEY: "${process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY'}",
    GEMINI_API_URL: "${process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'}",
};

// Export the config object
export default Config;`;

// Write the config file
const configPath = path.join(__dirname, 'js', 'config.js');
fs.writeFileSync(configPath, configContent);

console.log(`Config file generated at ${configPath}`);
