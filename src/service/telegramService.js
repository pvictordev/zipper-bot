import { sendMessage } from "../helper/telegramHelper.js";
import { loadQueue } from "../helper/queuesHelper.js";
import { validateMessage } from "../helper/utils.js";
import {
  handleZipCommand,
  handleCancelCommand,
  sendHelpMessage,
  handleFileUpload,
} from "../helper/commandHelper.js";

async function handleCommand(message, queue, queueId) {
  const chatId = message.chat.id;
  switch (message.text) {
    case "/zip":
      return await handleZipCommand(queue, chatId, queueId);
    case "/cancel":
      return await handleCancelCommand(queue, chatId, queueId);
    case "/help":
      return await sendHelpMessage(chatId);
    default:
      return await sendMessage(
        chatId,
        "To see the list of available commands, type /help."
      );
  }
}

export async function processMessage(body) {
  const message = validateMessage(body);
  const chatId = message.chat.id;
  const userId = message.from?.id || "unknown";
  const queueId = `${chatId}_${userId}`;

  const queue = await loadQueue(queueId);

  if (message.text) return await handleCommand(message, queue, queueId);
  if (message.document || message.photo)
    return await handleFileUpload(message, queue, queueId);

  return await sendMessage(chatId, "Please send a document or photo.");
}
