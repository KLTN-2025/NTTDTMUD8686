import express from "express";
import multer from "multer";
import {
  applyForJob,
  getUserData,
  getUserJobApplications,
  updateUserResume,
} from "../controller/userController.js";
import { uploadResume } from "../config/multer.js";
import {
  getAIScreeningResult,
  screenApplication,
} from "../controller/aiScreeningController.js";
import { logActivity } from "../utils/activity.js";

const router = express.Router();

// Client gọi ngay sau khi login để ghi log
router.post("/after-login", async (req, res) => {
  try {
    const userId = req.auth?.userId || req.body.userId; // nếu route này đứng sau clerkMiddleware thì lấy req.auth
    const name = req.body?.name || "";
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: "Missing userId" });

    logActivity({
      action: "user.login",
      message: `User login ${name || userId}`,
      actorType: "user",
      actorId: userId,
      actorName: name,
      targetType: "user",
      targetId: userId,
      targetName: name,
      req,
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});
// Get User Data

router.get("/user", getUserData);

// Apply for a Job

router.post("/apply", applyForJob);

// Get applied jobs data
router.get("/applications", getUserJobApplications);

// Update the resume
router.post(
  "/update-resume",
  uploadResume.single("resume"),
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.json({
          success: false,
          message: "File too large. Maximum size is 5MB.",
        });
      }
    } else if (err) {
      return res.json({ success: false, message: err.message });
    }
    next();
  },
  updateUserResume
);

// AI Screening routes
router.post("/applications/screen", screenApplication);
router.get("/applications/:applicationId/ai-result", getAIScreeningResult);

export default router;
