import Company from "../models/Company.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";
import jwt from "jsonwebtoken";
import { logActivity } from "../utils/activity.js";
// 🧩 Register a new Company (HR)
export const registerCompany = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate tối thiểu
    if (!name || !email || !password) {
      return res.json({ success: false, message: "Thiếu trường bắt buộc" });
    }

    const exists = await Company.findOne({ email });
    if (exists) {
      return res.json({
        success: false,
        message: "Tài khoản đã tồn tại. Vui lòng đợi admin xét duyệt",
      });
    }

    // BẮT BUỘC có ảnh vì schema required
    if (!req.file || !req.file.buffer) {
      return res.json({
        success: false,
        message: "Vui lòng upload logo công ty (image)",
      });
    }

    // Upload buffer -> Cloudinary
    const imageUrl = await uploadBufferToCloudinary(
      req.file.buffer,
      "companies"
    );

    const hash = await bcrypt.hash(password, 10);

    const company = await Company.create({
      name,
      email,
      password: hash,
      image: imageUrl,
      status: "pending",
    });
    logActivity({
      action: "company.registered",
      message: `Company đăng ký: ${company.name}`,
      actorType: "company",
      actorId: company._id.toString(),
      actorName: company.name,
      targetType: "company",
      targetId: company._id.toString(),
      targetName: company.name,
      req,
      meta: { email: company.email },
    });

    return res.json({
      success: true,
      message: "Tạo tài khoản thành công. Vui lòng chờ admin duyệt.",
      company: {
        id: company._id,
        name: company.name,
        status: company.status,
        image: company.image,
      },
      // KHÔNG trả token khi chưa duyệt
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// 🔐 Company Login
export const loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing credentials (email, password)",
      });
    }

    const company = await Company.findOne({ email }).select("+password");
    // Tránh lộ thông tin: trả về chung 400 khi sai email/password
    if (!company) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Chặn login nếu chưa được duyệt
    if (company.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          company.status === "pending"
            ? "Your account is pending approval by admin"
            : "Your account was rejected by admin",
      });
    }

    const ok = await bcrypt.compare(password, company.password || "");
    if (!ok) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!process.env.JWT_SECRET) {
      // Trả rõ lỗi cấu hình để bạn fix .env
      return res.status(500).json({
        success: false,
        message: "Server misconfigured: missing JWT_SECRET",
      });
    }

    const token = jwt.sign(
      { id: company._id, role: "company" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    logActivity({
      action: "company.login",
      message: `Company đăng nhập: ${company.name}`,
      actorType: "company",
      actorId: company._id.toString(),
      actorName: company.name,
      targetType: "company",
      targetId: company._id.toString(),
      targetName: company.name,
      req,
    });
    return res.json({
      success: true,
      token,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
        status: company.status,
      },
    });
  } catch (err) {
    console.error("Company login error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

// 🧾 Get Company Data
export const getCompanyData = async (req, res) => {
  const company = req.company;
  try {
    res.json({ success: true, company });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 📢 Post a new Job
export const postJob = async (req, res) => {
  const { title, description, location, salary, level, category } = req.body;
  const companyId = req.company._id;

  try {
    const newJob = new Job({
      title,
      description,
      location,
      salary,
      companyId,
      date: Date.now(),
      level,
      category,
      status: "pending", // MỚI
      visible: false, // MỚI
    });
    await newJob.save();

    res.json({
      success: true,
      message: "Job đã gửi để xét duyệt. Vui lòng chờ admin phê duyệt.",
      newJob,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 👥 Get Company Job Applicants
export const getCompanyJobApplicants = async (req, res) => {
  try {
    const companyId = req.company._id;
    const applications = await JobApplication.find({ companyId })
      .populate("userId", "name image email resume")
      .populate("jobId", "title location category level salary")
      .exec();
    return res.json({ success: true, applications });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 📋 Get Company Posted Jobs
export const getCompanyPostedJobs = async (req, res) => {
  try {
    const companyId = req.company._id;
    const jobs = await Job.find({ companyId });
    const jobsData = await Promise.all(
      jobs.map(async (job) => {
        const applicants = await JobApplication.find({ jobId: job._id });
        return { ...job.toObject(), applicants: applicants.length };
      })
    );
    res.json({ success: true, jobsData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 🔄 Change Job Application Status
export const ChangeJobApplicationStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    await JobApplication.findOneAndUpdate({ _id: id }, { status });
    res.json({ success: true, message: "Status changed" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 👁️ Toggle Job Visibility
export const changeVisiblity = async (req, res) => {
  try {
    const { id } = req.body;
    const companyID = req.company._id;
    const job = await Job.findById(id);

    if (!job) return res.json({ success: false, message: "Job not found" });
    if (companyID.toString() !== job.companyId.toString()) {
      return res.json({
        success: false,
        message: "Not authorized to modify this job",
      });
    }

    // Chỉ cho phép đổi visible khi đã approved
    if (job.status !== "approved") {
      return res.json({
        success: false,
        message: "Job chưa được duyệt, không thể thay đổi hiển thị",
      });
    }

    job.visible = !job.visible;
    await job.save();
    res.json({ success: true, job });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
