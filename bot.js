const puppeteer = require('puppeteer');
const TelegramBot = require('node-telegram-bot-api');

// Replace with your bot token from BotFather
const token = '1217681880:AAHCLorCihA2oyDjIrKzY_QgdBcyxpJtTJI';
const bot = new TelegramBot(token, { polling: true });

// Function to fetch student result by registration number and first name
async function getStudentResult(registrationNumber, firstName) {
    const url = `https://sw.ministry.et/student-result/${registrationNumber}?first_name=${firstName}&qr=`;

    try {
        // Launch Puppeteer browser instance
        const browser = await puppeteer.launch({
            headless: true, // You can set it to false for debugging to see the browser window
        });
        const page = await browser.newPage();

        // Navigate to the result URL
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Wait for the page to load fully (adjust this selector to match the result container)
        await page.waitForSelector('.student-result'); // Update this with the correct selector if necessary

        // Extract student details from the page
        const studentData = await page.evaluate(() => {
            const studentName = document.querySelector('.student-name') ? document.querySelector('.student-name').innerText.trim() : 'N/A';
            const studentAge = document.querySelector('.student-age') ? document.querySelector('.student-age').innerText.trim() : 'N/A';
            const studentSchool = document.querySelector('.student-school') ? document.querySelector('.student-school').innerText.trim() : 'N/A';
            const studentCourses = Array.from(document.querySelectorAll('.courses-list li')).map(course => course.innerText.trim()).join('\n');

            return {
                name: studentName,
                age: studentAge,
                school: studentSchool,
                courses: studentCourses
            };
        });

        // Close the browser
        await browser.close();

        if (!studentData.name || !studentData.age || !studentData.school) {
            return 'No student data found for this registration number and first name.';
        }

        // Format the result message
        const resultMessage = `
            *Student Name:* ${studentData.name}
            *Age:* ${studentData.age}
            *School:* ${studentData.school}
            *Courses:*\n${studentData.courses}
        `;

        return resultMessage;
    } catch (error) {
        console.error('Error fetching student data:', error);
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
