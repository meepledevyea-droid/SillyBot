const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const http = require('http');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TESTER_ROLE_ID = process.env.TESTER_ROLE_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ALLOWED_ROLE_ID = process.env.ALLOWED_ROLE_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

http.createServer((req, res) => { res.writeHead(200); res.end('ok'); }).listen(process.env.PORT || 3000);

const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

const commands = [
  new SlashCommandBuilder().setName('say').setDescription('Make the bot say something')
    .addStringOption(option => option.setName('text').setDescription('Message to send').setRequired(true))
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
  try { await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands }); } 
  catch (err) { console.error(err); }
}

client.once('ready', async () => { console.log(`Logged in as ${client.user.tag}`); await registerCommands(); });

client.on('guildMemberUpdate', (oldMember, newMember) => {
  const hadRole = oldMember.roles.cache.has(TESTER_ROLE_ID);
  const hasRole = newMember.roles.cache.has(TESTER_ROLE_ID);
  if (!hadRole && hasRole) {
    const channel = newMember.guild.channels.cache.get(CHANNEL_ID);
    if (channel) channel.send(`${newMember.user.username} is now a Tester`);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'say') {
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) return interaction.reply({ content: 'Not allowed', ephemeral: true });
    const text = interaction.options.getString('text');
    await interaction.reply({ content: 'Sent', ephemeral: true });
    await interaction.channel.send(text);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user)) return;
  const prompt = message.content.replace(`<@${client.user.id}>`, '').trim();
  if (!prompt) return;
  try {
    const response = await openai.createChatCompletion({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: prompt }], max_tokens: 200 });
    const reply = response.data.choices[0].message.content;
    message.reply(reply);
  } catch (err) { console.error(err); message.reply("I can't respond right now."); }
});

client.login(TOKEN);
