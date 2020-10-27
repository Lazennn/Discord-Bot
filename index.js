/**
 * Module Imports
 */
const Discord = require("discord.js");
const { Client, Collection, MessageEmbed } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { aliases } = require("./commands/help");

let TOKEN, PREFIX;
try {
  const config = require("./config.json");
  TOKEN = config.TOKEN;
  PREFIX = config.PREFIX;
} catch (error) {
  TOKEN = process.env.TOKEN;
  PREFIX = process.env.PREFIX;
}

const UPDATE_TIME = 2500; // in ms
var TICK_N = 0;

const usersMap = new Map();
const LIMIT = 5;
const TIME = 7000;
const DIFF = 3000;

const client = new Client({ disableMentions: "everyone" });

client.login(TOKEN);
client.commands = new Collection();
client.prefix = PREFIX;
client.queue = new Map();
const cooldowns = new Collection();
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


/**
 * Client Events
 */
client.on("ready", () => {
  console.log(`Bot [${client.user.username}] uruchomiony!`);
  client.user.setActivity('Sushiego 🌸',{'url':'https://www.twitch.tv/sussshi777','type':'STREAMING'});
});
client.on("warn", (info) => console.log(info));
client.on("error", console.error);

//client.on('ready', channel => {
//  channel = client.channels.cache.get('769986781231185960');
//  let Embed = new MessageEmbed()
//  .setTitle("🌸 Meta Community Music")
//  .setDescription(`Już jestem aktywny, wpisz m!help w celu pomocy!`)
//  .setColor("#FCBDFE")
//  channel.send(Embed);
//})

client.on('message', (message) => {
  if (message.content.includes('discord.gg/'||'discordapp.com/invite/')) {
    message.delete()
    let Embed = new MessageEmbed()
    .setTitle('🌸 Meta Community')
    .setDescription(`${message.author} niestety ale wysyłanie linków jest zabronione!`)
    .setColor("#22ff00")
    message.channel.send(Embed)
  }
})

client.on('ready', channel => {
  channel = client.channels.cache.get('770640611132964894');
  let Embed = new MessageEmbed()
  .setDescription(`Jestem online!`)
  .setColor("#22ff00")
  channel.send(Embed);
})

//client.on("message", async (message) => {
  //const trescogloszenia = message.content.slice(PREFIX.length).trim().split(' '); //
  //const command = trescogloszenia.shift().toLowerCase();   
  //if (message.member.hasPermission("ADMINISTRATOR"))
   //if (command === 'oglos') {
    //if (!trescogloszenia.length) {
      //return message.channel.send(`Nie podałeś treści, ${message.author}!`);
    //}  
    //let embed = new MessageEmbed()
    //.setAuthor(message.member.nickname ? message.member.nickname : message.author.tag,message.author.displayAvatarURL)
    //.setTitle("🌸 Meta Community | Ogłoszenie")
    //.setDescription(`${trescogloszenia[0]}`)
    //.setColor("#FCBDFE")
    //.setTimestamp(new Date());
    //message.channel.send(embed);
  //}
//});

/**
 * Import all commands
 */
const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", `${file}`));
  client.commands.set(command.name, command);
}

client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const PREFIXRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\\s*`);
  if (!PREFIXRegex.test(message.content)) return;

  const [, matchedPREFIX] = message.content.match(PREFIXRegex);

  const args = message.content.slice(matchedPREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 1) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `Poczkekaj ${timeLeft.toFixed(1)} sekund przed ponownym użyciem\`${command.name}\` komendy.`
      );
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    let Embed = new MessageEmbed()
    .setTitle("🌸 Meta Community Music")
    .addDescription("Niestety ale wystąpił błąd!")
    .setColor("#FCBDFE")
    message.channel.send(Embed).catch(console.error);
  }
});
