const { getAxiosInstance } = require("./axios");
const { errorHandler } = require("./helpers");

const TOKEN = "7463376696:AAFBleCFkKuz2H4uDPkLGsKb-UoRmr3KTPI";
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

const axiosInstance = getAxiosInstance(BASE_URL);

function sendMessage(chatId, messageText) {
	return axiosInstance
		.get("sendMessage", {
			chat_id: chatId || GROUP_CHAT_ID,
			text: messageText,
		})
		.catch((ex) => {
			errorHandler(ex, "sendMessage", "axios");
		});
}

async function handleMessage(messageObj) {
	const messageText = messageObj.text || "";
	if (!messageText) {
		errorHandler("No message text", "handleMessage");
		return "";
	}

	try {
		const chatId = messageObj.chat.id;
		if (messageText.charAt(0) === "/") {
			const command = messageText.substr(1);
			switch (command) {
				case "start":
					return sendMessage(
						chatId,
						"Hi!, I am your utilities bot, I can help you to calculate your bills."
					);
				default:
					return sendMessage(
						chatId,
						"Hi!, I do not know that command."
					);
			}
		} else {
			return sendMessage(chatId, messageText);
		}
	} catch (error) {
		errorHandler(error, "handleMessage");
	}
}

module.exports = { sendMessage, handleMessage };
