import axios from "axios";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import archiver from "archiver";
import { mkdtemp } from "fs/promises";
import os from "os";
import FormData from "form-data";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TOKEN}`;
const TELEGRAM_FILE_API = `https://api.telegram.org/file/bot${process.env.TOKEN}`;

export async function downloadFile(fileId) {
  const {
    data: {
      result: { file_path },
    },
  } = await axios.get(`${TELEGRAM_API}/getFile?file_id=${fileId}`);

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "telegram-"));
  const filePath = path.join(tempDir, path.basename(file_path));

  const response = await axios({
    method: "GET",
    url: `${TELEGRAM_FILE_API}/${file_path}`,
    responseType: "stream",
  });

  await pipeline(response.data, fs.createWriteStream(filePath));
  return { filePath, tempDir };
}

export async function createZipArchive(files, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);

    for (const file of files) {
      archive.file(file, { name: path.basename(file) });
    }

    archive.finalize();
  });
}

export async function sendDocument(chatId, filePath, caption) {
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("document", fs.createReadStream(filePath));
  if (caption) form.append("caption", caption);

  await axios.post(`${TELEGRAM_API}/sendDocument`, form, {
    headers: form.getHeaders(),
  });
}
