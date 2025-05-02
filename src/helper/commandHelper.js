import path from "path";
import os from "os";
import { mkdtemp } from "fs/promises";
import {
  downloadFile,
  createZipArchive,
  sendDocument,
  sendMessage,
  cleanupTempDirs,
} from "./telegramHelper.js";
import { saveQueue, deleteQueue } from "./queuesHelper.js";
import { filterExistingFiles } from "./utils.js";

export async function sendHelpMessage(chatId) {
  return sendMessage(
    chatId,
    "Send me multiple files and I'll zip them together.\n\n" +
      "Commands:\n" +
      "/zip - Create a zip with all queued files\n" +
      "/cancel - Clear the file queue\n" +
      "/help - Show this help message"
  );
}

export async function handleFileUpload(message, queue, queueId) {
  const chatId = message.chat.id;
  await sendMessage(chatId, "Adding file to queue...");

  let filePath, tempDir, fileName;

  if (message.document) {
    const result = await downloadFile(message.document.file_id);
    filePath = result.filePath;
    tempDir = result.tempDir;
    fileName = message.document.file_name || path.basename(filePath);
  } else if (message.photo) {
    const largestPhoto = message.photo[message.photo.length - 1];
    const result = await downloadFile(largestPhoto.file_id);
    filePath = result.filePath;
    tempDir = result.tempDir;
    fileName = `photo_${Date.now()}.jpg`;
  }

  queue.files.push({ path: filePath, name: fileName });
  queue.tempDirs.push(tempDir);

  await saveQueue(queueId, queue);

  await sendMessage(
    chatId,
    `File added to queue (${queue.files.length} files total). Send more files or use /zip to create the archive.`
  );
}

export async function handleCancelCommand(queue, chatId, queueId) {
  if (queue && queue.files.length > 0) {
    await cleanupTempDirs(queue.tempDirs);
    await deleteQueue(queueId);
    await sendMessage(chatId, "File queue cleared.");
  } else {
    await sendMessage(chatId, "No files in queue.");
  }
}

export async function handleZipCommand(queue, chatId, queueId) {
  if (!queue || queue.files.length === 0) {
    await sendMessage(chatId, "No files in queue to process.");
    return;
  }

  await sendMessage(chatId, `Creating zip with ${queue.files.length} files...`);

  const zipDir = await mkdtemp(path.join(os.tmpdir(), "telegram-zip-"));
  queue.tempDirs.push(zipDir);

  const zipPath = path.join(zipDir, "compressed_files.zip");

  const existingFiles = await filterExistingFiles(queue.files);
  if (existingFiles.length === 0) {
    await sendMessage(
      chatId,
      "The temporary files have expired. Please upload them again."
    );
    await deleteQueue(queueId);
    return;
  }

  await createZipArchive(existingFiles, zipPath);
  await sendDocument(
    chatId,
    zipPath,
    `Here are your ${existingFiles.length} compressed files!`
  );

  await cleanupTempDirs(queue.tempDirs);
  await deleteQueue(queueId);
}
