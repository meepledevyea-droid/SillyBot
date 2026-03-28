const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = "MTQ4NzU0MDk3MzI1NTkxNzc0OQ.GmeUb6.gPB1l_bsgus-up2cfQahHueJFPAnCEXcNAPWNQ";
const TESTER_ROLE_ID = "1485349566915018973";
const CHANNEL_ID = "1485350027340812448";

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('ok');
}).listen(3000);

client.once('ready', () => {
  console.log(client.user.tag);
});

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

client.login(TOKEN);