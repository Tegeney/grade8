const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

// Replace with your bot token from BotFather
const token = '1217681880:AAHCLorCihA2oyDjIrKzY_QgdBcyxpJtTJI';
const bot = new TelegramBot(token, { polling: true });

// Define the URL for fetching student results
const baseUrl = 'https://sw.ministry.et/student-result/';

// Function to fetch student result based on registration number and first name
async function getStudentResult(registrationNumber, firstName) {
    const url = `${baseUrl}${registrationNumber}?first_name=${firstName}&qr=`;
    console.log('Fetching data from:', url);  // Log the URL for debugging

    try {
        const response = await fetch(url);

        // Check if the response status is ok (200)
        if (!response.ok) {
            console.error(`Error: Received status ${response.status} from API.`);
            return null;
        }

        const data = await response.json();

        // Log the raw API response for debugging
        console.log('API Response:', data);

        return data;
    } catch (error) {
        console.error('Error fetching student data:', error);
        return null;
    }
}

// Handle incoming messages from users
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const text = 'Welcome! Send me a registration number and a first name to fetch the student result.';
    bot.sendMessage(chatId, text);
});

// Handle registration number and first name input
bot.onText(/\/result (\d+) (\w+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const registrationNumber = match[1]; // 7 digit registration number
    const firstName = match[2]; // first name

    // Fetch student result
    const studentData = await getStudentResult(registrationNumber, firstName);

    if (studentData) {
        // Build the message to send to the user
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

        // Send the student's info with inline buttons and photo
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
});

// Handle other commands and errors
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (!msg.text.startsWith('/result')) {
        bot.sendMessage(chatId, 'Please send a valid command. Use /result <registration_number> <first_name> to get results.');
    }
});
