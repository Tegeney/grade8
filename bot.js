require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');

// Create the Express app
const app = express();

// Set the webhook URL
const webhookUrl = '/webhook';

// Initialize your bot with the Telegram API token
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

// Set up body parser middleware to handle JSON data
app.use(bodyParser.json());

// Define the URL for fetching student results
const baseUrl = 'https://sw.ministry.et/student-result/';

// Function to fetch student result based on registration number and first name
async function getStudentResult(registrationNumber, firstName) {
    const url = `${baseUrl}${registrationNumber}?first_name=${firstName}&qr=`;

    try {
        const response = await fetch(url);

        // Check for valid response status
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching student data:', error);
        return null;
    }
}

// Handle incoming webhook requests
app.post(webhookUrl, async (req, res) => {
    const msg = req.body;
    const chatId = msg.chat.id;
    const text = msg.text || '';

    // Check for /start command
    if (text === '/start') {
        const welcomeMessage = 'Welcome! Send me a registration number and a first name to fetch the student result.';
        bot.sendMessage(chatId, welcomeMessage);
        return res.send('ok');
    }

    // Check for /result command
    const resultRegex = /\/result (\d{7}) (\w+)/;
    const match = text.match(resultRegex);

    if (match) {
        const registrationNumber = match[1];
        const firstName = match[2];

        // Fetch student result
        const studentData = await getStudentResult(registrationNumber, firstName);

        if (studentData) {
            const { student, courses } = studentData;
            const studentInfo = `
                *Student Name:* ${student.name}
                *Age:* ${student.age}
                *School:* ${student.school}
                *Woreda:* ${student.woreda}
                *Zone:* ${student.zone}
                *Language:* ${student.language}
                *Gender:* ${student.gender}
                *Nationality:* ${student.nationality}
            `;
            
            // Prepare the courses list
            const coursesList = courses.map(course => course.name).join('\n');

            const message = `
                ${studentInfo}
                \n*Courses:*\n${coursesList}
            `;

            bot.sendPhoto(chatId, student.photo, {
                caption: message,
                parse_mode: 'Markdown'
            });

        } else {
            bot.sendMessage(chatId, 'Sorry, I couldn\'t fetch the student information. Please try again later.');
        }
    } else {
        bot.sendMessage(chatId, 'Please send a valid command. Use /result <registration_number> <first_name> to get results.');
    }

    return res.send('ok');
});

// Set the webhook with Telegram API
async function setWebhook() {
    const url = `https://api.telegram.org/bot${token}/setWebhook`;
    const webhookUrl = `https://yourdomain.com${webhookUrl}`;  // Replace 'yourdomain.com' with your server URL

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                url: webhookUrl
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        console.log('Webhook set:', data);
    } catch (error) {
        console.error('Error setting webhook:', error);
    }
}

// Start the server and set the webhook
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    setWebhook(); // Call the function to set the webhook when the server starts
});
