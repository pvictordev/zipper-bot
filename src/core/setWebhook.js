import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const { TOKEN, TUNNEL } = process.env;

const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const WEBHOOK_URL = `${TUNNEL}/webhook/${TOKEN}`;

async function setWebhook() {
  try {
    const res = await axios.get(
      `${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`
    );
    console.log("Webhook set response:", res.data);
  } catch (error) {
    console.error("Error setting webhook:", error.message);
  }
}

setWebhook();
