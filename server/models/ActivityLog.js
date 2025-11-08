import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g. "company.approved", "job.rejected"
    message: { type: String, default: "" },

    actorType: {
      type: String,
      enum: ["admin", "company", "user", "system"],
      default: "system",
    },
    actorId: { type: String }, // adminId / companyId / userId (string là đủ dùng)
    actorName: { type: String }, // snapshot tên

    targetType: {
      type: String,
      enum: [
        "company",
        "job",
        "report",
        "application",
        "user",
        "system",
        "misc",
      ],
      default: "misc",
    },
    targetId: { type: String },
    targetName: { type: String },

    ip: { type: String },
    userAgent: { type: String },

    meta: { type: mongoose.Schema.Types.Mixed }, // thông tin phụ
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
