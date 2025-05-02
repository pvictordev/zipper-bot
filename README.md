# Zipper Bot

A serverless Telegram bot made to archive files.

## How to run

1. **Clone the repo and install dependencies**

   - Clone this repository locally: `git clone <repository-url>`
   - Install Vercel CLI `npm install -g vercel`

2. **Create a Telegram bot and obtain a token**

   - Open Telegram and chat with the **BotFather**.
   - Use the `/newbot` command to create a new bot and follow the instructions.
   - Copy the API token provided by BotFather.

3. **Configure environment variables**

   - Create a `.env` file in the root directory, copy the structure of `.env.example`.

4. **Start the app and set up local testing**

   - Start the application locally: `vercel dev`
   - Use a reverse proxy service (e.g., ngrok or pinggy) to expose your local server.

5. **Set the Webhook**

   - Run the following command to configure the Telegram webhook with your public URL:
     ```sh
     node src/core/setWebhook.js
     ```

6. **Voilà**
