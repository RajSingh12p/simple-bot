# Discord Role DM Bot

A simple Discord bot that allows server administrators to send direct messages to all users with a specific role.

## Features

- Send direct messages to users with specific roles using slash commands
- Check bot status and logs right in Discord
- Lightweight and focused on core functionality

## Commands

- `/dm-role [role] [message]` - Send a DM to all users with the specified role
- `/status` - Check the bot's current status
- `/logs` - View recent bot logs (can be filtered by type)

## Setup and Deployment to Render

### Step 1: Prepare Your Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and create your bot
3. Go to the "Bot" tab and click "Add Bot"
4. Under Privileged Gateway Intents, enable:
   - Server Members Intent
   - Message Content Intent
5. Save changes
6. Copy your bot token (you'll need this for Step 4)
7. Go to OAuth2 > URL Generator:
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Send Messages`, `Use Slash Commands`
8. Copy the generated URL and use it to invite the bot to your server

### Step 2: Create a GitHub Repository

1. Create a new repository on GitHub
2. Upload all files from this directory to your repository

### Step 3: Deploy to Render

1. Sign up or log in to [Render](https://render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure your service:
   - Name: `discord-role-dm-bot` (or choose your own)
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free (or any plan you prefer)

### Step 4: Set Environment Variables

1. In Render, navigate to your service
2. Go to the "Environment" tab
3. Add environment variable:
   - Key: `DISCORD_TOKEN`
   - Value: Your Discord bot token from Step 1
4. Click "Save Changes"

### Step 5: Deploy and Monitor

1. Go to the "Manual Deploy" section and select "Deploy latest commit"
2. Wait for the deployment to complete
3. Check the logs to make sure your bot is running properly

## Troubleshooting

- If your bot doesn't come online, check the logs in Render
- Make sure your Discord token is correct and properly set in environment variables
- Verify that you've enabled the necessary intents in the Discord Developer Portal

## Local Development

1. Clone this repository
2. Create a `.env` file from `.env.example` and add your Discord token
3. Install dependencies: `npm install`
4. Start the bot: `npm run dev`