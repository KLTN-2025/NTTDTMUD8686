// utils/uploadResumeRaw.js
import { v2 as cloudinary } from "cloudinary";

export function uploadResumeRaw(buffer, { userId, mimetype }) {
  return new Promise((resolve, reject) => {
    const isPdf = /pdf/i.test(mimetype);
    const isDocx =
      /vnd\.openxmlformats-officedocument\.wordprocessingml\.document/i.test(
        mimetype
      );
    const isDoc = /msword/i.test(mimetype);
    const format = isPdf ? "pdf" : isDocx ? "docx" : isDoc ? "doc" : undefined;

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        type: "upload", // ⬅️ delivery type
        access_mode: "public", // ⬅️ PUBLIC asset
        folder: "resumes",
        public_id: `resume_${userId}_${Date.now()}`,
        format, // để URL có đuôi .pdf/.docx
      },
      (err, result) => {
        if (err) return reject(err);
        return resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}
