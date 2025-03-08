const axios = require('axios');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');

// Replace with your bot token from BotFather
const token = '1217681880:AAHCLorCihA2oyDjIrKzY_QgdBcyxpJtTJI';
const bot = new TelegramBot(token, { polling: true });

// Function to fetch student result by registration number and first name
async function getStudentResult(registrationNumber, firstName) {
    const url = `https://sw.ministry.et/student-result/${registrationNumber}?first_name=${firstName}&qr=`;

    try {
        // Fetch the page
        const response = await axios.get(url);

        // Load the HTML into Cheerio for parsing
        const $ = cheerio.load(response.data);

        // Example selectors (you may need to adjust these based on actual HTML structure)
        const studentName = $('.student-name').text().trim();
        const studentAge = $('.student-age').text().trim();
        const studentSchool = $('.student-school').text().trim();
        const studentCourses = $('.courses-list').text().trim();

        // Check if we found the information
        if (!studentName || !studentAge || !studentSchool) {
            return 'No student data found for this registration number and first name.';
        }

        // Format the result
        const resultMessage = `
            *Student Name:* ${studentName}
            *Age:* ${studentAge}
            *School:* ${studentSchool}
            *Courses:*\n${studentCourses}
        `;

        return resultMessage;
    } catch (error) {
        console.error('Error fetching or parsing the result page:', error);
        return 'Sorry, I couldn\'t fetch the student information. Please try again later.';
    }
}

// Handle incoming messages from users
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const text = 'Welcome! Send me a registration number and a first name to fetch the student result.';
    bot.sendMessage(chatId, text);
});

// Handle registration number and first name input
bot.onText(/\/result (\d{7}) (\w+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const registrationNumber = match[1]; // 7 digit registration number
    const firstName = match[2]; // first name

    // Fetch student result
    const studentResult = await getStudentResult(registrationNumber, firstName);

    bot.sendMessage(chatId, studentResult, { parse_mode: 'Markdown' });
});

// Handle other commands and errors
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (!msg.text.startsWith('/result')) {
        bot.sendMessage(chatId, 'Please send a valid command. Use /result <registration_number> <first_name> to get results.');
    }
});
