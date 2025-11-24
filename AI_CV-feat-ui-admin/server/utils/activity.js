import ActivityLog from "../models/ActivityLog.js";

export async function logActivity({
  action,
  message = "",
  actorType = "system",
  actorId,
  actorName,
  targetType = "misc",
  targetId,
  targetName,
  req, // để lấy ip/ua nếu có
  meta = {},
}) {
  try {
    await ActivityLog.create({
      action,
      message,
      actorType,
      actorId,
      actorName,
      targetType,
      targetId,
      targetName,
      ip: req?.ip || req?.headers?.["x-forwarded-for"] || "",
      userAgent: req?.headers?.["user-agent"] || "",
      meta,
    });
  } catch (err) {
    // không làm crash luồng chính
    console.error("logActivity error:", err.message);
  }
}
