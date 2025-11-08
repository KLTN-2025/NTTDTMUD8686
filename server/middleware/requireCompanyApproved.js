import Company from "../models/Company.js";
// middlewares/requireCompanyApproved.js
export const requireCompanyApproved = async (req, res, next) => {
  try {
    const company = await Company.findById(req.user.id).select("status");
    if (!company)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (company.status !== "approved")
      return res
        .status(403)
        .json({ success: false, message: "Tài khoản chưa được duyệt" });
    next();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
