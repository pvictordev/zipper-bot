# Utilities Bot

Telegram bot used for general purposes.

## How it works

`Localy:` The bot receives messages (updates) from Telegram via a webhook. Since the bot runs locally, I used a reverse proxy to tunnel the connection (each session expires after a while).

`Production / Stagging:` The work principle is the same, but instead of reverse proxy I used a public URL from Vercel.
