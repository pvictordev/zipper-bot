require("dotenv").config();
const express = require("express");
const axios = require("axios");

const PORT = process.env.PORT || 4040;
const app = express();

const { TOKEN, TUNNEL } = process.env;

const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = TUNNEL + URI;

const init = async () => {
	const res = await axios.get(
		`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`
	);
	console.log(res.data);
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post(URI, async (req, res) => {
	console.log("Request received");

	try {
		const chatId = req.body.message.chat.id;

		if (req.body.message.text) {
			const message = req.body.message.text;

			await axios.post(`${TELEGRAM_API}/sendMessage`, {
				chat_id: chatId,
				text: message,
			});
		} else {
			await axios.post(`${TELEGRAM_API}/sendMessage`, {
				chat_id: chatId,
				text: "I can only handle text messages for now.",
			});
		}

		return res.send();
	} catch (error) {
		console.error("Error handling request", error.message);
		res.status(500).send("Internal Server Error");
	}
});

app.get("*", (req, res) => {
	res.send("Hello World");
});

app.listen(PORT, async (err) => {
	if (err) console.error(err);
	console.log("🚀 Server is running on PORT", PORT);
	await init();
});
