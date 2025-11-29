// import OpenAI from "openai";
import { OpenRouter } from "@openrouter/sdk";

import User from "../models/User.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import { extractTextFromCloudinary } from "../utils/cvExtract.js";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL = process.env.AI_MODEL || "tngtech/tng-r1t-chimera:free";

function buildPrompt({ jd, cvText }) {
  return `
Bạn là HR AI chuyên nghiệp. Phân tích CV và Job Description một cách NGHIÊM NGẶT.

**QUY TẮC CHẤM ĐIỂM:**
- Nếu Job Description không rõ ràng, thiếu thông tin hoặc chỉ có văn bản vô nghĩa → điểm tối đa 20
- Nếu CV không match với yêu cầu cụ thể → giảm 15-30 điểm/mỗi yêu cầu thiếu
- Yêu cầu BẮT BUỘC trong JD phải xuất hiện trong CV → nếu thiếu giảm 40 điểm
- Kinh nghiệm < yêu cầu → giảm 20 điểm
- Không có chứng chỉ liên quan → giảm 10 điểm

Trả về CHÍNH XÁC JSON (KHÔNG markdown):

{
  "extract": {
    "name": "tên ứng viên",
    "years_experience": "số năm (VD: 3)",
    "skills": ["kỹ năng 1", "kỹ năng 2"],
    "education": "học vấn",
    "certifications": ["chứng chỉ 1"],
    "languages": ["ngôn ngữ 1"],
    "notable_projects": ["dự án 1"]
  },
  "score": số_từ_0_đến_100,
  "reasons": {
    "must_have_skills": "đánh giá chi tiết (nếu JD không rõ, ghi: 'JD không có yêu cầu rõ ràng - điểm thấp')",
    "experience": "đánh giá kinh nghiệm so với JD",
    "domain_fit": "đánh giá phù hợp ngành",
    "certs_others": "đánh giá chứng chỉ"
  },
  "jd_quality": "good/poor/unclear"
}

JOB DESCRIPTION:
${jd}

CV CONTENT:
${cvText}

**LƯU Ý:** Nếu JD chỉ có 1-2 từ hoặc không rõ ràng, set "jd_quality": "poor" và "score": 10-20.`;
}

export async function screenApplication(req, res) {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    const application = await JobApplication.findById(applicationId).populate(
      "jobId"
    );
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const user = await User.findById(application.userId);
    if (!user || !user.resume) {
      return res.status(400).json({ message: "User has no resume uploaded" });
    }

    const cvText = await extractTextFromCloudinary(
      user.resume,
      "application/pdf"
    );

    if (!cvText?.trim()) {
      return res.status(400).json({
        message:
          "CV text is empty or unreadable. Please re-upload a clearer PDF/DOCX.",
      });
    }

    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const jd = [job.title, job.description, (job.requirements || []).join("\n")]
      .filter(Boolean)
      .join("\n");

    const prompt = buildPrompt({ jd, cvText });

    // G?i OpenRouter (kh�ng streaming)
    const completion = await openrouter.chat.send({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });

    const raw = completion?.choices?.[0]?.message?.content || "{}";

    console.log("=== AI RAW RESPONSE ===");
    console.log(raw);
    console.log("=== END AI RESPONSE ===");

    let parsed;
    try {
      parsed = JSON.parse(raw);
      console.log("? Successfully parsed JSON:", parsed);

      if (parsed.jd_quality === "poor" && parsed.score > 25) {
        console.warn(
          "?? AI cho di?m cao v?i JD k�m ch?t lu?ng, di?u ch?nh xu?ng 15"
        );
        parsed.score = 15;
        parsed.reasons.must_have_skills =
          "JD kh�ng d? th�ng tin d? d�nh gi� - di?m th?p";
      }
    } catch (parseError) {
      const markdownMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        try {
          parsed = JSON.parse(markdownMatch[1]);
          console.log("? Markdown JSON parse success:", parsed);
        } catch (markdownError) {
          console.log("? Markdown parse failed:", markdownError.message);
        }
      }

      if (!parsed) {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
            console.log("? Fallback JSON parse success:", parsed);
          } catch (fallbackError) {
            console.log("? Fallback parse also failed:", fallbackError.message);
          }
        }
      }

      if (!parsed) {
        parsed = {
          extract: null,
          score: null,
          reasons: {
            error: "Failed to parse AI response",
            rawResponse: raw.substring(0, 200),
            parseError: parseError.message,
          },
        };
      }
    }

    await JobApplication.findByIdAndUpdate(applicationId, {
      aiScore: parsed.score ?? null,
      aiReasons: JSON.stringify(parsed.reasons ?? {}),
      aiExtract: parsed.extract ?? null,
      aiVersion: MODEL,
      aiReviewed: false,
    });

    return res.json({
      success: true,
      message: "AI screening completed",
      data: {
        applicationId,
        aiScore: parsed.score,
        aiReasons: parsed.reasons,
        aiExtract: parsed.extract,
      },
    });
  } catch (error) {
    console.error("AI Screening Error:", error);
    return res.status(500).json({
      message: "AI screening failed",
      error: error.message,
    });
  }
}

export async function getAIScreeningResult(req, res) {
  try {
    const { applicationId } = req.params;

    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.json({
      success: true,
      data: {
        aiScore: application.aiScore,
        aiReasons: application.aiReasons
          ? JSON.parse(application.aiReasons)
          : null,
        aiExtract: application.aiExtract,
        aiVersion: application.aiVersion,
        aiReviewed: application.aiReviewed,
      },
    });
  } catch (error) {
    console.error("Get AI Result Error:", error);
    return res.status(500).json({
      message: "Failed to get AI screening result",
      error: error.message,
    });
  }
}