require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const PORT = process.env.PORT || 4040;
const app = express();

const { TOKEN, NGROK_URL } = process.env;

const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = NGROK_URL + URI;

// provide the webhook to telegram, so the server can know where it sends the updates

const init = async () => {
	const res = await axios.get(
		`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`
	);
	console.log(res.data);
};

// middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post(URI, async (req, res) => {
	console.log(req.body);

	const chatId = req.body.message.chat.id;
	const message = req.body.message.text;

	// sent a message back
	await axios.post(`${TELEGRAM_API}/sendMessage`, {
		chat_id: chatId,
		text: message,
	});

	return res.send();
});

app.get("*", async (req, res) => {
	res.send("GET request");
});

app.listen(PORT, async (err) => {
	if (err) console.log(err);
	console.log("🚀 Server is running on PORT", PORT);
	await init();
});
