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

// ===== ENV VARIABLES =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const TESTER_ROLE_ID = process.env.TESTER_ROLE_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

const ALLOWED_ROLE_ID = process.env.ALLOWED_ROLE_ID;

// ===== KEEP ALIVE SERVER =====
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('ok');
}).listen(process.env.PORT || 3000);

// ===== SLASH COMMAND =====
const commands = [
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Message to send')
        .setRequired(true)
    )
    .toJSON()
];

// ===== REGISTER COMMAND =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Commands registered');
  } catch (err) {
    console.error('Command register error:', err);
  }
}

// ===== READY =====
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await registerCommands();
});

// ===== ROLE DETECTION =====
client.on('guildMemberUpdate', (oldMember, newMember) => {
  const hadRole = oldMember.roles.cache.has(TESTER_ROLE_ID);
  const hasRole = newMember.roles.cache.has(TESTER_ROLE_ID);

  if (!hadRole && hasRole) {
    const channel = newMember.guild.channels.cache.get(CHANNEL_ID);
    if (channel) {
      channel.send(`${newMember.user.username} is now a Tester`);
    }
  }
});

// ===== SLASH COMMAND HANDLER =====
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'say') {

    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: 'Not allowed',
        ephemeral: true
      });
    }

    const text = interaction.options.getString('text');

    await interaction.reply({ content: 'Sent', ephemeral: true });
    await interaction.channel.send(text);
  }
});

client.login(TOKEN);
