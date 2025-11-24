import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    // Bài đăng bị báo cáo
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    // Công ty sở hữu bài đăng — dùng để admin xem nhanh
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company", // ✅ thêm ref để populate được
      required: true,
    },

    // Người gửi báo cáo (user)
    userId: {
      type: String, // Clerk userId là string
      ref: "User",
      required: true,
    },
    userName: { type: String },
    userEmail: { type: String },
    // Lý do ngắn gọn
    reason: {
      type: String,
      required: true,
    },

    // Mô tả chi tiết (optional)
    description: {
      type: String,
      default: "",
    },

    // Trạng thái xử lý (pending / reviewed / removed)
    status: {
      type: String,
      enum: ["pending", "reviewed", "removed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Index để tránh trùng lặp quá nhiều report cùng user/job
reportSchema.index({ jobId: 1, userId: 1 }, { unique: true });

const Report = mongoose.model("Report", reportSchema);
export default Report;
