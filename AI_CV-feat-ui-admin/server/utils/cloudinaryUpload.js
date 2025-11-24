import { v2 as cloudinary } from "cloudinary";

export const uploadBufferToCloudinary = (buffer, folder = "companies") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
