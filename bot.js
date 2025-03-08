import requests
from telegram import Update
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackContext
from io import BytesIO
from PIL import Image

# Function to fetch results
def get_result(registration_id, first_name):
    url = f"https://sw.ministry.et/student-result/{registration_id}?first_name={first_name}&qr="
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        try:
            data = response.json()
            result = data.get("result", "No result found")
            image_url = data.get("photo_url")  # Ensure this key is correct
            return result, image_url
        except ValueError:
            return "Invalid response from server", None
    else:
        return f"Error: {response.status_code}", None

# Function to handle user messages
def handle_message(update: Update, context: CallbackContext):
    user_text = update.message.text.strip()
    
    # Expect input in "ID FirstName" format
    try:
        reg_id, first_name = user_text.split()
    except ValueError:
        update.message.reply_text("Please send your Registration Number and First Name (e.g., '0099617 John').")
        return
    
    # Get result
    result, image_url = get_result(reg_id, first_name)
    
    # Send result text
    update.message.reply_text(f"📄 Result: {result}")
    
    # Send student photo if available
    if image_url:
        response = requests.get(image_url)
        if response.status_code == 200:
            img = BytesIO(response.content)
            update.message.reply_photo(photo=img)
        else:
            update.message.reply_text("❌ Unable to load student photo.")

# Function to start bot
def start(update: Update, context: CallbackContext):
    update.message.reply_text("Welcome! Send your Registration Number and First Name (e.g., '0099617 John') to get your result.")

# Main function to run the bot
def main():
    TOKEN = "YOUR_BOT_TOKEN_HERE"  # Replace with your Telegram bot token
    updater = Updater(TOKEN, use_context=True)
    dp = updater.dispatcher

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(MessageHandler(Filters.text & ~Filters.command, handle_message))

    updater.start_polling()
    updater.idle()

if __name__ == "__main__":
    main()
