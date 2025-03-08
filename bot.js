require("dotenv").config();
const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json()); // Parse JSON requests

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // Your public URL (from Ngrok, Vercel, or a VPS)

const bot = new TelegramBot(TOKEN);
bot.setWebHook(`${WEBHOOK_URL}/bot${TOKEN}`);

// Function to fetch results
async function getResult(registrationId, firstName) {
    try {
        const url = `https://sw.ministry.et/student-result/${registrationId}?first_name=${firstName}&qr=`;
        const headers = { "User-Agent": "Mozilla/5.0", "Accept": "application/json" };

        const response = await axios.get(url, { headers });

        if (response.status === 200) {
            const data = response.data;
            const resultText = data?.result || "❌ No result found.";
            const imageUrl = data?.photo_url; // Ensure this key is correct
            return { resultText, imageUrl };
        }
    } catch (error) {
        return { resultText: "❌ Error fetching results.", imageUrl: null };
    }
}

// Webhook endpoint
app.post(`/bot${TOKEN}`, async (req, res) => {
    const { message } = req.body;

    if (message && message.text) {
        const chatId = message.chat.id;
        const userInput = message.text.trim();

        // Expect input in "ID FirstName" format
        const parts = userInput.split(" ");
        if (parts.length !== 2) {
            bot.sendMessage(chatId, "⚠️ Please send: Registration Number and First Name (e.g., '0099617 John').");
            return res.send();
        }

        const [registrationId, firstName] = parts;
        const { resultText, imageUrl } = await getResult(registrationId, firstName);

        // Send result text
        await bot.sendMessage(chatId, `📄 Result: ${resultText}`);

        // Send student photo if available
        if (imageUrl) {
            await bot.sendPhoto(chatId, imageUrl);
        }

        return res.send();
    }
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
