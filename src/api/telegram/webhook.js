import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { mkdtemp } from "fs/promises";
import os from "os";

import {
  downloadFile,
  createZipArchive,
  sendDocument,
} from "../../core/utils/telegram.js";

dotenv.config();

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TOKEN}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram Webhook Endpoint");
  }

  let tempDirs = [];
  try {
    const { message } = req.body;

    if (!message) {
      console.log("No message found in request body.");
      return res.status(400).json({ error: "No message data" });
    }

    const chatId = message.chat.id;
    const photo = message.photo;
    const document = message.document;

    if (!document && !photo) {
      await axios.post(
        `https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text: "Please send a document or a photo",
        }
      );
    }

    const downloadedFiles = [];
    if (document) {
      await axios.post(
        `https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text: "Processing...",
        }
      );
      const { filePath, tempDir } = await downloadFile(document.file_id);
      downloadedFiles.push(filePath);
      tempDirs.push(tempDir);
    }
    //
    else if (photo) {
      await axios.post(
        `https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text: "Processing...",
        }
      );
      const { filePath, tempDir } = await downloadFile(
        photo[photo.length - 1].file_id
      );
      downloadedFiles.push(filePath);
      tempDirs.push(tempDir);
    }

    if (document || photo) {
      const zipDir = await mkdtemp(path.join(os.tmpdir(), "telegram-zip-"));
      tempDirs.push(zipDir);
      const zipPath = path.join(zipDir, "compressed_files.zip");
      await createZipArchive(downloadedFiles, zipPath);

      await sendDocument(chatId, zipPath, "Here are your compressed files!");
    }

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Error handling message:", err);

    try {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "Sorry, there was an error processing your files.",
      });
    } catch (notifyErr) {
      console.error("Error sending error notification:", notifyErr);
    }

    res.status(500).json({ error: "Something went wrong." });
  }
}
