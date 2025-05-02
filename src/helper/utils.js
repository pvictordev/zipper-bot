import { access } from "fs/promises";

// Message Validator
export function validateMessage(body) {
  if (!body.message) {
    throw new Error("No message in request body");
  }
  return body.message;
}

// Utility to check file existence
export async function filterExistingFiles(files) {
  const existing = [];
  for (const file of files) {
    try {
      await access(file.path);
      existing.push(file.path);
    } catch {
      console.log(`Missing file: ${file.path}`);
    }
  }
  return existing;
}
