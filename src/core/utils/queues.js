import fs from "fs";
import path from "path";
import os from "os";
import { writeFile, readFile, access } from "fs/promises";

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
export async function loadQueue(queueId) {
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
export async function saveQueue(queueId, queue) {
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
export async function deleteQueue(queueId) {
  try {
    const queuePath = path.join(QUEUE_DIR, `${queueId}.json`);
    await fs.promises.unlink(queuePath);
    console.log(`Queue deleted: ${queuePath}`);
  } catch (err) {
    console.error("Error deleting queue:", err);
  }
}
