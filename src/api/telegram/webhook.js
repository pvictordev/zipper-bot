import { processMessage } from "../../service/telegramService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram Webhook Endpoint");
  }

  try {
    await processMessage(req.body);
    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
