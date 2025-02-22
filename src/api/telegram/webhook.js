import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram Webhook Endpoint");
  }

  try {
    const { message } = req.body;

    if (!message) {
      console.log("No message found in request body.");
      return res.status(400).json({ error: "No message data" });
    }

    const chatId = message.chat.id;
    const text = message.text || "I can only handle text messages.";

    console.log(`Received message from ${chatId}: ${text}`);

    await axios.post(
      `https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: text,
      }
    );

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Error handling message:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
}
