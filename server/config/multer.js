// config/multer.js
import multer from "multer";

const storage = multer.memoryStorage();

/** Upload CV: chỉ cho phép PDF/DOC/DOCX (tối đa 5MB) */
export const uploadResume = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const extOK = /\.(pdf|doc|docx)$/i.test(file.originalname);
    const mimeOK = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(file.mimetype);

    if (extOK && mimeOK) return cb(null, true);
    cb(new Error("Only PDF, DOC and DOCX files are allowed!"));
  },
});

/** Upload ảnh/logo: cho phép JPG/JPEG/PNG/WEBP/SVG (tối đa 3MB) */
export const uploadImage = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const extOK = /\.(jpg|jpeg|png|webp|svg)$/i.test(file.originalname);
    const mimeOK = file.mimetype.startsWith("image/");

    if (extOK && mimeOK) return cb(null, true);
    cb(new Error("Only image files (JPG, JPEG, PNG, WEBP, SVG) are allowed!"));
  },
});

/** (Tuỳ chọn) Upload hỗn hợp theo field name */
export const uploadMixed = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "resume") {
      const extOK = /\.(pdf|doc|docx)$/i.test(file.originalname);
      const mimeOK =
        file.mimetype === "application/pdf" ||
        file.mimetype === "application/msword" ||
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      return extOK && mimeOK
        ? cb(null, true)
        : cb(new Error("Resume must be PDF/DOC/DOCX"));
    }
    if (file.fieldname === "image") {
      const extOK = /\.(jpg|jpeg|png|webp|svg)$/i.test(file.originalname);
      const mimeOK = file.mimetype.startsWith("image/");
      return extOK && mimeOK
        ? cb(null, true)
        : cb(new Error("Image must be JPG/JPEG/PNG/WEBP/SVG"));
    }
    return cb(new Error("Unexpected field"));
  },
});
