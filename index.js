const { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  REST, 
  Routes 
} = require('discord.js');

const http = require('http');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// config (use Railway variables)
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // bot application id
const GUILD_ID = process.env.GUILD_ID;   // your server id
const ALLOWED_ROLE_ID = process.env.ALLOWED_ROLE_ID;

// keep alive server
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('ok');
}).listen(process.env.PORT || 3000);

// slash command
const commands = [
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('What the bot should say')
        .setRequired(true)
    )
    .toJSON()
];

// register command
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Slash command registered');
  } catch (err) {
    console.error(err);
  }
})();

client.once('ready', () => {
  console.log(client.user.tag);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'say') {
    // check role
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: 'You are not allowed to use this command',
        ephemeral: true
      });
    }

    const text = interaction.options.getString('text');

    await interaction.reply({ content: 'Sent', ephemeral: true });
    await interaction.channel.send(text);
  }
});

client.login(TOKEN);
