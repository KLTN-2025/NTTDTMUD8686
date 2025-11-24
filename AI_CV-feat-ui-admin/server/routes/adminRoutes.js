import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";
import { protectAdmin } from "../middleware/adminAuth.js";
import {
  markReportReviewed,
  submitReport,
} from "../controller/reportController.js";
import mongoose from "mongoose";
import Report from "../models/Report.js";
import ActivityLog from "../models/ActivityLog.js";
import { logActivity } from "../utils/activity.js";

const router = express.Router();

/* ---------------------------------------------
   1️⃣  Khởi tạo tài khoản admin (chạy 1 lần)
--------------------------------------------- */
router.post("/setup", async (req, res) => {
  try {
    const existing = await Admin.findOne({ username: "admin" });
    if (existing) return res.json({ message: "⚠️ Admin already exists" });

    const admin = new Admin({ username: "admin", password: "12341234" });
    await admin.save();
    res.json({ success: true, message: "✅ Admin account created!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------
   2️⃣  Đăng nhập admin
--------------------------------------------- */
router.post("/login", async (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username || !password) {
      return res.json({ success: false, message: "Missing credentials" });
    }

    username = String(username).toLowerCase().trim();

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      admin: { id: admin._id, username: admin.username, email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------
   3️⃣  HR MANAGEMENT: list (filter+paginate), approve, reject, delete
   GET /api/admin/hr?status=&page=&limit=&q=
--------------------------------------------- */
router.get("/hr", protectAdmin, async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 10, q = "" } = req.query;

    const filter = {};
    if (status !== "all") filter.status = status;

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Company.find(filter)
        .select("_id name email image status createdAt")
        .sort({ createdAt: -1 }) // mới nhất lên đầu
        .skip(skip)
        .limit(limitNum),
      Company.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------
   Duyệt HR
--------------------------------------------- */
router.post("/hr/:id/approve", protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid company ID" });
    }

    const company = await Company.findById(id);
    if (!company) return res.json({ success: false, message: "HR not found" });

    company.status = "approved";
    await company.save();
    // LOG
    logActivity({
      action: "company.approved",
      message: `Admin duyệt HR ${company.name}`,
      actorType: "admin",
      actorId: req.admin.id,
      actorName: "admin",
      targetType: "company",
      targetId: company._id.toString(),
      targetName: company.name,
      req,
    });
    return res.json({
      success: true,
      message: "✅ HR approved successfully",
      data: { _id: company._id, status: company.status },
    });
  } catch (err) {
    console.error("Error approving HR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------
   Từ chối HR
--------------------------------------------- */
router.post("/hr/:id/reject", protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid company ID" });
    }

    const company = await Company.findById(id);
    if (!company) return res.json({ success: false, message: "HR not found" });

    company.status = "rejected";
    await company.save();
    // LOG
    logActivity({
      action: "company.rejected",
      message: `Admin từ chối HR ${company.name}`,
      actorType: "admin",
      actorId: req.admin.id,
      actorName: "admin",
      targetType: "company",
      targetId: company._id.toString(),
      targetName: company.name,
      req,
    });
    return res.json({
      success: true,
      message: "❌ HR rejected successfully",
      data: { _id: company._id, status: company.status },
    });
  } catch (err) {
    console.error("Error rejecting HR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
/* ---------------------------------------------
   Xoá HR
--------------------------------------------- */
router.delete("/hr/:id", protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid company ID" });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: "HR not found" });
    }

    // Xoá jobs và applications liên quan
    const jobs = await Job.find({ companyId: id }).select("_id");
    const jobIds = jobs.map((j) => j._id);

    await JobApplication.deleteMany({
      $or: [{ companyId: id }, { jobId: { $in: jobIds } }],
    });
    await Job.deleteMany({ companyId: id });
    await Company.findByIdAndDelete(id);
    logActivity({
      action: "company.deleted",
      message: `Admin xoá HR ${company.name}`,
      actorType: "admin",
      actorId: req.admin?.id,
      actorName: "admin",
      targetType: "company",
      targetId: company._id.toString(),
      targetName: company.name,
      req,
      meta: {
        email: company.email,
        status: company.status,
      },
    });
    return res.json({ success: true, message: "HR deleted", deletedId: id });
  } catch (err) {
    console.error("Delete HR error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});
/* ---------------------------------------------
   JOBS MANAGEMENT: list (filter+paginate), detail, approve, reject, delete
   GET /api/admin/jobs?status=&page=&limit=&q=
--------------------------------------------- */
router.get("/jobs", protectAdmin, async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 10, q = "" } = req.query;

    const filter = {};
    if (status !== "all") filter.status = status;
    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ title: regex }, { location: regex }, { category: regex }];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Job.find(filter)
        .populate("companyId", "name email image status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Job.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------
   VIEW one job (content only) 
--------------------------------------------- */
router.get("/jobs/:id", protectAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).select(
      "_id title description location category level salary status createdAt date"
    );
    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, data: job });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});
/* ---------------------------------------------
   Approve job
--------------------------------------------- */
router.post("/jobs/:id/approve", protectAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.json({ success: false, message: "Job not found" });

    job.status = "approved";
    job.visible = true; // tự động hiển thị
    await job.save();
    // LOG
    logActivity({
      action: "job.approved",
      message: `Admin duyệt job ${job.title}`,
      actorType: "admin",
      actorId: req.admin.id,
      actorName: "admin",
      targetType: "job",
      targetId: job._id.toString(),
      targetName: job.title,
      req,
      meta: { companyId: job.companyId?.toString?.() },
    });
    res.json({
      success: true,
      message: "✅ Job approved",
      data: { _id: job._id, status: job.status, visible: job.visible },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------
   Reject job
--------------------------------------------- */
router.post("/jobs/:id/reject", protectAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.json({ success: false, message: "Job not found" });

    job.status = "rejected";
    job.visible = false;
    await job.save();
    // LOG
    logActivity({
      action: "job.rejected",
      message: `Admin từ chối job ${job.title}`,
      actorType: "admin",
      actorId: req.admin.id,
      actorName: "admin",
      targetType: "job",
      targetId: job._id.toString(),
      targetName: job.title,
      req,
      meta: { companyId: job.companyId?.toString?.() },
    });
    res.json({
      success: true,
      message: "❌ Job rejected",
      data: { _id: job._id, status: job.status, visible: job.visible },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
/* ---------------------------------------------
   Xoá bài đăng
--------------------------------------------- */
router.delete("/jobs/:id", protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid job ID" });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    await job.deleteOne();
    logActivity({
      action: "job.deleted",
      message: `Admin xoá job ${job.title}`,
      actorType: "admin",
      actorId: req.admin.id,
      actorName: "admin",
      targetType: "job",
      targetId: job._id.toString(),
      targetName: job.title,
      req,
      meta: { companyId: job.companyId?.toString?.() },
    });
    res.json({
      success: true,
      message: "✅ Job deleted successfully",
      data: { _id: id },
    });
  } catch (err) {
    console.error("Error deleting job:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
/* ---------------------------------------------
  Thống kê hệ thống
--------------------------------------------- */
router.get("/stats", protectAdmin, async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalApplications = await JobApplication.countDocuments();
    const pendingHR = await Company.countDocuments({ isApproved: false });
    const approvedHR = await Company.countDocuments({ isApproved: true });

    res.json({
      success: true,
      data: {
        totalJobs,
        totalUsers,
        totalApplications,
        approvedHR,
        pendingHR,
      },
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});
/* ---------------------------------------------
   THỐNG KÊ & BÁO CÁO MỞ RỘNG
   GET /api/admin/statistics
--------------------------------------------- */
router.get("/statistics", protectAdmin, async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // 1️⃣ Tổng số job và job mới trong 7 ngày
    const totalJobs = await Job.countDocuments();
    const newJobs = await Job.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // 2️⃣ User mới đăng ký trong 7 ngày
    const newUsers = await User.countDocuments({
      _id: { $exists: true },
      createdAt: { $gte: sevenDaysAgo },
    }).catch(() => 0);

    // 3️⃣ Lượt đăng nhập (user.login trong ActivityLog)
    const loginCount = await ActivityLog.countDocuments({
      action: "user.login",
      createdAt: { $gte: sevenDaysAgo },
    });

    // 4️⃣ Job bị báo cáo & bị reject
    const reportedJobs = await Report.distinct("jobId");
    const rejectedJobs = await Job.countDocuments({ status: "rejected" });

    const reportedJobCount = reportedJobs.length;

    // 5️⃣ Tạo dữ liệu thống kê theo ngày (7 ngày gần nhất)
    const jobStatsByDay = await Job.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const loginStatsByDay = await ActivityLog.aggregate([
      { $match: { action: "user.login", createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ✅ Kết quả trả về
    return res.json({
      success: true,
      summary: {
        totalJobs,
        newJobs,
        newUsers,
        loginCount,
        reportedJobCount,
        rejectedJobs,
      },
      trends: {
        jobsPerDay: jobStatsByDay,
        loginsPerDay: loginStatsByDay,
      },
    });
  } catch (err) {
    console.error("GET /admin/statistics error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// User gửi báo cáo
router.post("/", submitReport);
/* ---------------------------------------------
   Báo cáo vi phạm (list)
--------------------------------------------- */
router.get("/reports", protectAdmin, async (req, res) => {
  try {
    // Lấy tất cả report kèm job & company
    const reports = await Report.find({})
      .populate({ path: "jobId", select: "title companyId createdAt" })
      .populate({ path: "companyId", select: "name email" })
      .sort({ createdAt: -1 });

    // Gom nhóm theo (jobId + reason) để có "số báo cáo"
    const grouped = new Map();
    for (const r of reports) {
      const key = `${r.jobId?._id || "unknown"}|${r.reason}`;
      const curr = grouped.get(key) || {
        _id: r._id, // id đầu tiên đại diện nhóm
        jobId: r.jobId?._id,
        title: r.jobId?.title || "(Đã xoá / Không xác định)",
        company: r.companyId?.name || "-",
        reason: r.reason,
        description: r.description || "",
        status: r.status,
        reports: 0,
        createdAt: r.createdAt,
      };
      curr.reports += 1;
      // cập nhật createdAt để luôn là thời điểm mới nhất của nhóm
      if (r.createdAt > curr.createdAt) curr.createdAt = r.createdAt;
      grouped.set(key, curr);
    }

    const data = Array.from(grouped.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );

    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET /admin/reports error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin đánh dấu đã xử lý
router.post("/reports/:id/reviewed", protectAdmin, markReportReviewed);
/* ---------------------------------------------
  Log hệ thống 
--------------------------------------------- */
// GET /api/admin/logs?page=1&limit=20&action=job.approved&actorType=admin
router.get("/logs", protectAdmin, async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const data = logs.map((l) => {
      const actorLabel = l.actorName || l.actorEmail || `#${l.actorId}`;
      // Nếu là report: dựng câu cho dễ đọc (hoặc dùng l.message đã ghi sẵn)
      let displayMessage = l.message;
      if (!displayMessage) {
        // fallback generic
        displayMessage = `${l.action} - by ${actorLabel}`;
      }
      return {
        _id: l._id,
        action: l.action,
        actorType: l.actorType,
        actorId: l.actorId,
        actorName: l.actorName,
        actorEmail: l.actorEmail,
        targetType: l.targetType,
        targetId: l.targetId,
        targetName: l.targetName,
        message: l.message,
        displayMessage,
        createdAt: l.createdAt,
      };
    });

    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
