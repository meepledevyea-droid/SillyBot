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

const TOKEN = process.env.TOKEN;
const TESTER_ROLE_ID = process.env.TESTER_ROLE_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const ALLOWED_ROLE_ID = process.env.ALLOWED_ROLE_ID;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('ok');
}).listen(process.env.PORT || 3000);


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

\
client.on('guildMemberUpdate', (oldMember, newMember) => {
  const had = oldMember.roles.cache.has(TESTER_ROLE_ID);
  const has = newMember.roles.cache.has(TESTER_ROLE_ID);

  if (!had && has) {
    const ch = newMember.guild.channels.cache.get(CHANNEL_ID);
    if (ch) {
      ch.send(`${newMember.user.username} is now a Tester`);
    }
  }
});

client.on('interactionCreate', async interaction => {
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
