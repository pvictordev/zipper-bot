import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { message } = req.body;

      if (message) {
        const chatId = message.chat.id;
        const text = message.text || "I can only handle text messages.";

        await axios.post(
          `https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`,
          {
            chat_id: chatId,
            text: text,
          }
        );
      }

      return res.status(200).json({ status: "ok" });
    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({ error: "Something went wrong." });
    }
  } else {
    res.status(200).send("Telegram Webhook Endpoint");
  }
}
