// Simple Discord Bot that sends DMs to users with specific roles
import { Client, Events, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';

// Load environment variables
dotenv.config();

// Check for Discord token
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('ERROR: DISCORD_TOKEN is not set in environment variables');
  process.exit(1);
}

// Create a new client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

// Array to store log entries
const logs = [];

// Log function
function addLog(type, message) {
  const timestamp = new Date().toISOString();
  const entry = { type, message, timestamp };
  logs.push(entry);
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Keep only the last 100 logs
  if (logs.length > 100) {
    logs.shift();
  }
}

// Set up slash commands
const commands = [
  {
    data: new SlashCommandBuilder()
      .setName('dm-role')
      .setDescription('Send a DM to all users with a specific role')
      .addRoleOption(option => 
        option.setName('role')
          .setDescription('The role to send DM to')
          .setRequired(true))
      .addStringOption(option => 
        option.setName('message')
          .setDescription('The message to send')
          .setRequired(true)),
    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });
      
      const role = interaction.options.getRole('role');
      const message = interaction.options.getString('message');
      
      // Get guild members with the role
      const guild = interaction.guild;
      await guild.members.fetch();
      
      const membersWithRole = guild.members.cache.filter(member => 
        member.roles.cache.has(role.id)
      );
      
      if (membersWithRole.size === 0) {
        await interaction.editReply(`No members found with the role ${role.name}`);
        addLog('info', `No members found with role ${role.name}`);
        return;
      }
      
      // Send DMs
      let successCount = 0;
      let failCount = 0;
      
      await interaction.editReply(`Starting to send DMs to ${membersWithRole.size} members with role ${role.name}...`);
      
      for (const [, member] of membersWithRole) {
        try {
          await member.send(`**Message from ${interaction.user.tag}**: ${message}`);
          successCount++;
          addLog('success', `Sent DM to ${member.user.tag}`);
        } catch (error) {
          failCount++;
          addLog('error', `Failed to send DM to ${member.user.tag}: ${error.message}`);
        }
      }
      
      await interaction.editReply(
        `Completed sending DMs to members with role ${role.name}.\n` +
        `✅ Successfully sent: ${successCount}\n` +
        `❌ Failed to send: ${failCount}`
      );
      
      addLog('info', `Completed DM to role ${role.name}. Success: ${successCount}, Failed: ${failCount}`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('status')
      .setDescription('Check the bot status'),
    async execute(interaction) {
      const uptime = getUptime(client.readyAt);
      
      await interaction.reply({
        embeds: [{
          title: '🤖 Bot Status',
          fields: [
            { name: 'Status', value: '🟢 Online', inline: true },
            { name: 'Uptime', value: uptime, inline: true },
            { name: 'Server', value: interaction.guild.name, inline: true },
            { name: 'Latency', value: `${client.ws.ping}ms`, inline: true }
          ],
          color: 0x00FF00,
          timestamp: new Date()
        }],
        ephemeral: true
      });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('logs')
      .setDescription('Check the bot logs')
      .addStringOption(option => 
        option.setName('filter')
          .setDescription('Filter logs by type')
          .setRequired(false)
          .addChoices(
            { name: 'All', value: 'all' },
            { name: 'Success', value: 'success' },
            { name: 'Error', value: 'error' },
            { name: 'Info', value: 'info' }
          )),
    async execute(interaction) {
      const filter = interaction.options.getString('filter') || 'all';
      
      let filteredLogs = logs;
      if (filter !== 'all') {
        filteredLogs = logs.filter(log => log.type === filter);
      }
      
      // Get the last 10 logs
      const lastLogs = filteredLogs.slice(-10).reverse();
      
      if (lastLogs.length === 0) {
        await interaction.reply({
          content: `No logs found with filter: ${filter}`,
          ephemeral: true
        });
        return;
      }
      
      const logMessages = lastLogs.map(log => 
        `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.type.toUpperCase()}] ${log.message}`
      );
      
      await interaction.reply({
        embeds: [{
          title: '📝 Bot Logs',
          description: logMessages.join('\n'),
          color: 0x0099FF,
          timestamp: new Date()
        }],
        ephemeral: true
      });
    }
  }
];

// Format uptime
function getUptime(startTime) {
  if (!startTime) return 'Not available';
  
  const now = new Date();
  const uptimeMs = now - startTime;
  
  const seconds = Math.floor(uptimeMs / 1000) % 60;
  const minutes = Math.floor(uptimeMs / (1000 * 60)) % 60;
  const hours = Math.floor(uptimeMs / (1000 * 60 * 60)) % 24;
  const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// When the client is ready
client.once(Events.ClientReady, () => {
  addLog('info', `Logged in as ${client.user.tag}`);
  
  // Register slash commands
  const commandsData = commands.map(command => command.data.toJSON());
  
  client.application.commands.set(commandsData)
    .then(() => {
      addLog('info', 'Slash commands registered successfully');
    })
    .catch(error => {
      addLog('error', `Failed to register slash commands: ${error.message}`);
    });
});

// Handle interactions
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isCommand()) return;
  
  const command = commands.find(cmd => cmd.data.name === interaction.commandName);
  
  if (!command) return;
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    addLog('error', `Error executing command ${interaction.commandName}: ${error.message}`);
    
    const replyContent = {
      content: 'There was an error executing this command.',
      ephemeral: true
    };
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(replyContent);
    } else {
      await interaction.reply(replyContent);
    }
  }
});

// Handle errors
client.on(Events.Error, error => {
  addLog('error', `Client error: ${error.message}`);
});

// Add a basic web server to keep the bot alive on Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Discord bot is running!');
});

app.listen(PORT, () => {
  console.log(`Simple web server running on port ${PORT}`);
});

// Login to Discord
client.login(token);