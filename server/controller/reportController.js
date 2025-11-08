// server/controller/reportController.js
import Report from "../models/Report.js";
import Job from "../models/Job.js";
import mongoose from "mongoose";
import { logActivity } from "../utils/activity.js";

export const submitReport = async (req, res) => {
  try {
    const { jobId, reason, description, userName, userEmail } = req.body;

    // bắt buộc đăng nhập
    if (!req.auth?.userId) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để gửi báo cáo.",
      });
    }
    const userId = req.auth.userId || req.body.userId;

    // validate input
    if (!jobId) {
      return res.status(400).json({ success: false, message: "Thiếu Job ID." });
    }
    if (!reason || !reason.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng chọn lý do báo cáo." });
    }
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res
        .status(400)
        .json({ success: false, message: "Job ID không hợp lệ." });
    }

    // kiểm tra job
    const job = await Job.findById(jobId).select("title companyId");
    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tin tuyển dụng." });
    }

    // tạo report (có unique index jobId+userId -> có thể ném lỗi 11000)
    const newReport = await Report.create({
      jobId,
      companyId: job.companyId,
      userId,
      userName: userName?.trim() || "Ẩn danh",
      userEmail: userEmail?.trim() || "Không cung cấp",
      reason: reason.trim(),
      description: description.trim(),
      status: "pending",
    });

    // log hoạt động
    logActivity({
      action: "report.submitted",
      message: `User ${userName} báo cáo job "${job.title}": ${reason}`,
      actorType: "user",
      actorName: userName,
      actorId: userId,
      targetType: "job",
      targetId: job._id.toString(),
      targetName: job.title,
      req,
      meta: { userName, userEmail, reason, description },
    });

    return res.json({
      success: true,
      message: "✅ Báo cáo vi phạm đã được gửi thành công.",
      report: newReport,
    });
  } catch (err) {
    console.error("Submit report error:", err);

    if (err?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "⚠️ Bạn đã gửi báo cáo cho bài viết này rồi.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống: " + err.message,
    });
  }
};

// 👀 Admin xem danh sách báo cáo
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate({ path: "jobId", select: "title companyId" })
      .populate({ path: "companyId", select: "name" })
      .sort({ createdAt: -1 });

    const data = reports.map((r) => ({
      _id: r._id,
      jobId: r.jobId,
      company: r.companyId?.name || "",
      reason: r.reason,
      description: r.description || "",
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Admin đánh dấu đã xử lý
export const markReportReviewed = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findByIdAndUpdate(
      id,
      { status: "reviewed" },
      { new: true }
    );

    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy báo cáo" });

    res.json({ success: true, message: "Đã đánh dấu đã xử lý", report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
