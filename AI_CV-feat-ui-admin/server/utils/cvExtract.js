// utils/cvExtract.js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse"); // ✅ nạp CJS an toàn trong ESM

import mammoth from "mammoth";
import axios from "axios";

export async function extractTextFromCloudinary(url, mimetypeHint = "") {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    const buf = Buffer.from(res.data);

    // PDF
    if (mimetypeHint.includes("pdf") || url.toLowerCase().endsWith(".pdf")) {
      const parsed = await pdfParse(buf); // ✅ dùng biến pdfParse
      return parsed.text || "";
    }

    // DOCX
    if (
      mimetypeHint.includes(
        "vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) ||
      url.toLowerCase().endsWith(".docx")
    ) {
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return value || "";
    }

    // DOC
    if (mimetypeHint.includes("msword") || url.toLowerCase().endsWith(".doc")) {
      throw new Error(
        "DOC format not supported directly. Please convert to PDF or DOCX first."
      );
    }

    throw new Error("Unsupported file type");
  } catch (error) {
    if (error.response) {
      // axios error
      throw new Error(`Fetch CV failed: HTTP ${error.response.status}`);
    }
    throw error;
  }
}
