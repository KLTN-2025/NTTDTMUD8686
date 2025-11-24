// server/routes/reportRoutes.js
import express from "express";
import { submitReport } from "../controller/reportController.js";

const router = express.Router();

// User gửi báo cáo
router.post("/", submitReport);

export default router;
