const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const dotenv = require('dotenv');
const {walletInit} = require("./lib/users");

dotenv.config();

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS]});

// Loading commands
client.commands = new Collection();
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  if (command.name !== undefined) client.commands.set(command.name, command);
}

client.on("ready", (client) => {
  walletInit(process.env.KASPAD_ADDRESS, process.env.CUSTODIAL);
});
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  let commandName = interaction.commandName === "kwallet"? interaction.options.getSubcommand() : interaction.commandName.substring(1);

  const command = client.commands.get(commandName);

  if (!command) return;

  if (process.env.OFFLINE === "yes" || (process.env.OFFLINE === "admin" && process.env.ADMIN !== interaction.user.id)) {
    await interaction.reply({
      content: ':thunder_cloud_rain: *Bot is down for node maintenance. Please try again later*',
      ephemeral: true
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: ':ambulance: *There was an error while executing this command!*', ephemeral: true });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);