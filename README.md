# Zipper Bot

Telegram Bot for Zipping Files

## How it works

Express.js serverless api

## Steps to run

1. Clone the app and install dependencies

2. Create a Telegram bot and obtain its token.

3. Store the token in the `.env` file.

4. Start the app and forward your port to a reverse proxy service (e.g., **ngrok**, **pinggy**) to test the app locally.

5. Set the webhook by running:
   ```sh
   node src/core/utils/setWebhook.js
   ```
6. voilà
