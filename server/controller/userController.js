import e from "express";
import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";
import { v2 } from "cloudinary";
import { logActivity } from "../utils/activity.js";

// Get user Data
export const getUserData = async (req, res) => {
  const userId = req.auth.userId;

  console.log("User ID from request:", userId); // Log the user ID

  try {
    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found in database"); // Log if user is not found
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.log("Error fetching user:", error.message); // Log any errors
    res.json({ success: false, message: error.message });
  }
};

// Apply For a Job
export const applyForJob = async (req, res) => {
  const { jobId } = req.body;
  const userId = req.auth.userId;

  try {
    const isAlreadyApplied = await JobApplication.findOne({ userId, jobId });

    if (isAlreadyApplied) {
      return res.json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    const jobData = await Job.findById(jobId);

    if (!jobData) {
      return res.json({ success: false, message: "Job not found" });
    }

    await JobApplication.create({
      companyId: jobData.companyId,
      userId,
      jobId,
      date: Date.now(),
    });
    logActivity({
      action: "application.created",
      message: `User ${userId} apply job ${jobData.title}`,
      actorType: "user",
      actorId: userId,
      targetType: "job",
      targetId: jobData._id.toString(),
      targetName: jobData.title,
      req,
      meta: { companyId: jobData.companyId?.toString?.() },
    });
    res.json({ success: true, message: "Applied Successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get User applied applications
export const getUserJobApplications = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const applications = await JobApplication.find({ userId })
      .populate("companyId", "name email image")
      .populate("jobId", "title description location level salary")
      .exec();

    if (!applications) {
      return res.json({
        success: false,
        message: "No applications found for this User",
      });
    }

    return res.json({ success: true, applications });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update User Profile (resume)
export const updateUserResume = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const resumeFile = req.file;
    if (!resumeFile)
      return res.json({ success: false, message: "No resume file provided" });

    const userData = await User.findById(userId);
    if (!userData)
      return res.json({ success: false, message: "User not found" });

    // Upload: để Cloudinary tự nhận dạng PDF. (Có thể đặt 'raw' – xem ghi chú bên dưới)
    const base64 = `data:${
      resumeFile.mimetype
    };base64,${resumeFile.buffer.toString("base64")}`;
    const uploaded = await v2.uploader.upload(base64, {
      resource_type: "auto",
      folder: "resumes",
      public_id: `resume_${userId}_${Date.now()}`,
    });

    userData.resume = uploaded.secure_url; // Lưu thẳng URL public
    await userData.save();

    return res.json({
      success: true,
      message: "Resume Updated Successfully",
      resumeUrl: userData.resume,
    });
  } catch (err) {
    console.error("updateUserResume", err);
    return res.json({ success: false, message: err.message });
  }
};
