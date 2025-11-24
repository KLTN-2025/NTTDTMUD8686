import OpenAI from "openai";
import User from "../models/User.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import { extractTextFromCloudinary } from "../utils/cvExtract.js";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "CV Screening Project",
  },
});

function buildPrompt({ jd, cvText }) {
  return `
Bạn là HR AI chuyên nghiệp. Phân tích CV và Job Description, trả về CHÍNH XÁC JSON theo format sau (KHÔNG có markdown, KHÔNG có \`\`\`json):

{
  "extract": {
    "name": "tên ứng viên",
    "years_experience": "số_năm_kinh_nghiệm",
    "skills": ["kỹ năng 1", "kỹ năng 2"],
    "education": "học vấn",
    "certifications": ["chứng chỉ 1"],
    "languages": ["ngôn ngữ 1"],
    "notable_projects": ["dự án 1"]
  },
  "score": "điểm_số_từ_0_đến_100",
  "reasons": {
    "must_have_skills": "đánh giá kỹ năng bắt buộc",
    "experience": "đánh giá kinh nghiệm",
    "domain_fit": "đánh giá phù hợp ngành",
    "certs_others": "đánh giá chứng chỉ và yếu tố khác"
  }
}

JOB DESCRIPTION:
${jd}

CV CONTENT:
${cvText}`;
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

    // Lấy thông tin user và CV URL
    const user = await User.findById(application.userId);
    if (!user || !user.resume) {
      return res.status(400).json({ message: "User has no resume uploaded" });
    }

    // Trích xuất text từ CV
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
    // Lấy Job Description
    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const jd = [job.title, job.description, (job.requirements || []).join("\n")]
      .filter(Boolean)
      .join("\n");

    // Tạo prompt và gọi OpenAI
    const prompt = buildPrompt({ jd, cvText });

    // ... existing code ...

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";

    // Debug: Log raw response từ AI
    console.log("=== AI RAW RESPONSE ===");
    console.log(raw);
    console.log("=== END AI RESPONSE ===");

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(raw);
      console.log("✅ Successfully parsed JSON:", parsed);
    } catch (parseError) {
      console.log("❌ JSON Parse Error:", parseError.message);

      // Fallback 1: Tìm JSON trong markdown code block
      const markdownMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        try {
          parsed = JSON.parse(markdownMatch[1]);
          console.log("✅ Markdown JSON parse success:", parsed);
        } catch (markdownError) {
          console.log("❌ Markdown parse failed:", markdownError.message);
        }
      }

      // Fallback 2: Tìm JSON object trong text
      if (!parsed) {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
            console.log("✅ Fallback JSON parse success:", parsed);
          } catch (fallbackError) {
            console.log(
              "❌ Fallback parse also failed:",
              fallbackError.message
            );
          }
        }
      }

      // Fallback 3: Tạo response lỗi
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

    // ... rest of the code ...

    // Cập nhật JobApplication với kết quả AI
    await JobApplication.findByIdAndUpdate(applicationId, {
      aiScore: parsed.score ?? null,
      aiReasons: JSON.stringify(parsed.reasons ?? {}),
      aiExtract: parsed.extract ?? null,
      aiVersion: "gpt-4o-mini@v1",
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
      message: "http://localhost:5000/api/users/applications/screen",
      error: error.message,
    });
  }
}

// Endpoint để lấy kết quả AI screening
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
