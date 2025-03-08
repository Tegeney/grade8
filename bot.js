const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { exec } = require('child_process');

// Load environment variables
require('dotenv').config();

// Telegram bot token
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Command to start the bot
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Welcome! Please provide the student's registration number and first name in the format:\n\n/result <registration_number> <first_name>");
});

// Command to fetch student data
bot.onText(/\/result (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const registrationNumber = match[1];
    const firstName = match[2];

    try {
        // Call the Python script
        exec(`python3 fetch_student_data.py ${registrationNumber} ${firstName}`, async (error, stdout, stderr) => {
            if (error) {
                bot.sendMessage(chatId, "An error occurred while fetching the data.");
                return;
            }

            // Send the photo
            const photoUrl = `https://assets.sw.ministry.et/2017/student-photo/1739542829-44705-29217/6002047-${registrationNumber}.jpeg`;
            await bot.sendPhoto(chatId, photoUrl);

            // Send the student details
            bot.sendMessage(chatId, stdout);
        });
    } catch (error) {
        bot.sendMessage(chatId, "An error occurred. Please try again.");
    }
});
