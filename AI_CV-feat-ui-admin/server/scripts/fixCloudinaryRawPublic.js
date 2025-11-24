import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

async function main() {
  let nextCursor = null;
  do {
    const { resources, next_cursor } = await cloudinary.api.resources({
      resource_type: "raw",
      type: "upload",
      prefix: "resumes/", // folder bạn đang dùng
      max_results: 500,
      next_cursor: nextCursor || undefined,
    });

    for (const r of resources) {
      if (r.access_mode !== "public" || r.access_control?.length) {
        console.log("Making public:", r.public_id);
        await cloudinary.uploader.update(r.public_id, {
          resource_type: "raw",
          type: "upload",
          access_mode: "public",
          // Xóa mọi access control nếu có:
          access_control: undefined,
        });
      }
    }

    nextCursor = next_cursor;
  } while (nextCursor);

  console.log("Done.");
}
main().catch(console.error);
