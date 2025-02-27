import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { mkdtemp, writeFile, readFile, access } from "fs/promises";
import fs from "fs";
import os from "os";
import {
  downloadFile,
  createZipArchive,
  sendDocument,
  cleanupTempDirs,
} from "../../core/utils/telegram.js";

dotenv.config();

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TOKEN}`;
const QUEUE_DIR = path.join(os.tmpdir(), "telegram-queues");

// ensure queue directory exists
async function ensureQueueDir() {
  try {
    await access(QUEUE_DIR);
  } catch (err) {
    await fs.promises.mkdir(QUEUE_DIR, { recursive: true });
    console.log(`Created queue directory: ${QUEUE_DIR}`);
  }
}

// load queue from file
async function loadQueue(queueId) {
  try {
    await ensureQueueDir();
    const queuePath = path.join(QUEUE_DIR, `${queueId}.json`);
    try {
      await access(queuePath);
      const data = await readFile(queuePath, "utf8");
      return JSON.parse(data);
    } catch (err) {
      // queue doesn't exist yet
      return { files: [], tempDirs: [] };
    }
  } catch (err) {
    console.error("Error loading queue:", err);
    return { files: [], tempDirs: [] };
  }
}

// save queue to file
async function saveQueue(queueId, queue) {
  try {
    await ensureQueueDir();
    const queuePath = path.join(QUEUE_DIR, `${queueId}.json`);
    await writeFile(queuePath, JSON.stringify(queue));
    console.log(`Queue saved to ${queuePath}`);
  } catch (err) {
    console.error("Error saving queue:", err);
  }
}

// delete queue file
async function deleteQueue(queueId) {
  try {
    const queuePath = path.join(QUEUE_DIR, `${queueId}.json`);
    await fs.promises.unlink(queuePath);
    console.log(`Queue deleted: ${queuePath}`);
  } catch (err) {
    console.error("Error deleting queue:", err);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram Webhook Endpoint");
  }

  let tempDirs = [];
  let chatId;
  let queueId;

  try {
    const { message } = req.body;

    if (!message) {
      console.log("No message found in request body.");
      return res.status(400).json({ error: "No message data" });
    }

    chatId = message.chat.id;
    const userId = message.from ? message.from.id : "unknown";
    queueId = `${chatId}_${userId}`;
    const photo = message.photo;
    const document = message.document;

    console.log(`Processing message for group ${queueId}`);

    // load queue from file system
    const queue = await loadQueue(queueId);
    console.log(`Loaded queue for ${queueId}:`, queue);

    if (message.text) {
      if (message.text === "/zip") {
        console.log(`/zip command received for ${queueId}. Queue:`, queue);

        if (!queue || queue.files.length === 0) {
          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: "No files in queue to process.",
          });
          return res.status(200).json({ status: "no files" });
        }

        await axios.post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: chatId,
          text: `Creating zip with ${queue.files.length} files...`,
        });

        const zipDir = await mkdtemp(path.join(os.tmpdir(), "telegram-zip-"));
        queue.tempDirs.push(zipDir);

        const zipPath = path.join(zipDir, "compressed_files.zip");

        // check if the files still exist
        const existingFiles = [];
        for (const file of queue.files) {
          try {
            await access(file.path);
            existingFiles.push(file.path);
          } catch (err) {
            console.log(`File no longer exists: ${file.path}`);
          }
        }

        if (existingFiles.length === 0) {
          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: "Sorry, the temporary files have expired. Please upload them again.",
          });
          await deleteQueue(queueId);
          return res.status(200).json({ status: "files expired" });
        }

        await createZipArchive(existingFiles, zipPath);
        await sendDocument(
          chatId,
          zipPath,
          `Here are your ${existingFiles.length} compressed files!`
        );

        // clean up and clear queue
        await cleanupTempDirs(queue.tempDirs);
        await deleteQueue(queueId);

        return res.status(200).json({ status: "zip created" });
      } else if (message.text === "/cancel") {
        if (queue && queue.files.length > 0) {
          await cleanupTempDirs(queue.tempDirs);
          await deleteQueue(queueId);

          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: "File queue cleared.",
          });
        } else {
          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: "No files in queue.",
          });
        }
        return res.status(200).json({ status: "queue cleared" });
      } else if (message.text === "/help") {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: chatId,
          text:
            "Send me multiple files and I'll zip them together.\n\n" +
            "Commands:\n" +
            "/zip - Create a zip with all queued files\n" +
            "/cancel - Clear the file queue\n" +
            "/help - Show this help message",
        });
        return res.status(200).json({ status: "help shown" });
      }
    }

    if (document || photo) {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "Adding file to queue...",
      });

      let filePath, tempDir, fileName;

      if (document) {
        const result = await downloadFile(document.file_id);
        filePath = result.filePath;
        tempDir = result.tempDir;
        fileName = document.file_name || path.basename(filePath);
      } else if (photo) {
        const result = await downloadFile(photo[photo.length - 1].file_id);
        filePath = result.filePath;
        tempDir = result.tempDir;
        fileName = `photo_${Date.now()}.jpg`;
      }

      // add to queue
      queue.files.push({
        path: filePath,
        name: fileName,
      });
      queue.tempDirs.push(tempDir);

      // save updated queue
      await saveQueue(queueId, queue);

      console.log(
        `File added to queue ${queueId}. Current count: ${queue.files.length}`
      );

      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: `File added to queue (${queue.files.length} files total). Send more files or use /zip to create the archive.`,
      });

      return res.status(200).json({ status: "file added" });
    } else if (!message.text) {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "Please send documents or photos. Send /zip when you're done to create the archive.",
      });
      return res.status(200).json({ status: "instructions sent" });
    }

    return res.status(200).json({ status: "processed" });
  } catch (err) {
    console.error("Error handling message:", err);

    try {
      if (chatId) {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: chatId,
          text: "Sorry, there was an error processing your request.",
        });
      }
    } catch (notifyErr) {
      console.error("Error sending error notification:", notifyErr);
    }

    await cleanupTempDirs(tempDirs);
    if (queueId) {
      try {
        await deleteQueue(queueId);
      } catch (cleanupErr) {
        console.error("Error cleaning up queue:", cleanupErr);
      }
    }

    return res.status(500).json({ error: "Something went wrong." });
  }
}
