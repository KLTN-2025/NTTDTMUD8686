import express from "express";
import multer from "multer";
import { applyForJob, getUserData, getUserJobApplications, updateUserResume } from "../controller/userController.js";
import upload from "../config/multer.js";
import { getAIScreeningResult, screenApplication } from "../controller/aiScreeningController.js";

const router = express.Router();

// Get User Data

router.get("/user", getUserData)

// Apply for a Job

router.post("/apply", applyForJob)

// Get applied jobs data
router.get("/applications", getUserJobApplications)

// Update the resume
router.post('/update-resume', upload.single("resume"), (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.json({ success: false, message: 'File too large. Maximum size is 5MB.' });
    }
  } else if (err) {
    return res.json({ success: false, message: err.message });
  }
  next();
}, updateUserResume)

// AI Screening routes
router.post('/applications/screen', screenApplication);
router.get('/applications/:applicationId/ai-result', getAIScreeningResult);


export default router;