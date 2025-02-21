export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { message } = req.body;
      if (message) {
        const chatId = message.chat.id;
        const text = message.text || "I can only handle text messages.";

        await fetch(
          `https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
          }
        );
      }
      return res.status(200).json({ status: "ok" });
    } catch (err) {
      console.error("Error:", err);
    }
    return res.status(500).json({ error: "Something went wrong." });
  } else {
    res.status(200).send("Telegram Webhook Endpoint");
  }
}
