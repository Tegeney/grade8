const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

// Create an Express app
const app = express();
const port = process.env.PORT || 3000;

// Telegram Bot Token from BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

// Telegram Webhook URL
const webhookUrl = `https://grade8-8ip9.onrender.com/webhook`; // Your provided webhook URL

// Use body-parser middleware to parse incoming JSON data from the Telegram webhook
app.use(bodyParser.json());

// Set webhook with Telegram Bot API
async function setWebhook() {
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`);
  const data = await response.json();
  console.log(data);
}

// Function to fetch student result based on registration number and first name
async function getStudentResult(registrationNumber, firstName) {
  const url = `https://sw.ministry.et/student-result/${registrationNumber}?first_name=${firstName}&qr=`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching student data:', error);
    return null;
  }
}

// Handle incoming webhook requests (updates)
app.post('/webhook', (req, res) => {
  const update = req.body;
  
  // Process the update from Telegram Bot
  bot.processUpdate(update);
  
  // Respond with 200 OK to Telegram server
  res.sendStatus(200);
});

// Handle incoming /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const text = 'Welcome! Send me a registration number and a first name to fetch the student result.';
  bot.sendMessage(chatId, text);
});

// Handle /result command with registration number and first name
bot.onText(/\/result (\d+) (\w+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const registrationNumber = match[1]; // 7 digit registration number
  const firstName = match[2]; // First name
  
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

    // Build the message with photo
    const message = `
      ${studentInfo}
      \n*Courses:*\n${coursesList}
    `;

    // Send photo with student info
    bot.sendPhoto(chatId, student.photo, {
      caption: message,
      parse_mode: 'Markdown'
    });
  } else {
    bot.sendMessage(chatId, 'Sorry, I couldn\'t fetch the student information. Please try again later.');
  }
});

// Start the Express server
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  
  // Set the webhook once the server is running
  await setWebhook();
});
