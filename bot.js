require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Check if the bot token is available in the environment
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Error: No bot token found in .env file!');
  process.exit(1); // Exit if token is missing
}

// Initialize the bot with polling
const bot = new TelegramBot(token, { polling: true });

// Log that the bot is up and running
console.log('Bot is now polling...');

// Handle messages
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log(`Received message from ${msg.chat.username}: ${msg.text}`);
    bot.sendMessage(chatId, 'I received your message!');
});

// Handle polling errors
bot.on('polling_error', (error) => {
    console.error('Polling Error:', error);
});

// You can add more handlers here to customize bot functionality
// For example, handling specific commands or texts

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hello, I am your bot!');
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'I am here to help you!');
});
