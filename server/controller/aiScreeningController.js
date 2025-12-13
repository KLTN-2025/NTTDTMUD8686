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
Bạn là "HR AI" chuyên nghiệp. Nhiệm vụ: phân tích **CHÍNH XÁC** một Job Description (JD) và một CV (text) rồi trả về một object JSON duy nhất (KHÔNG markdown, không text khác). Dùng quy trình và luật rõ ràng bên dưới — output phải chính xác JSON hợp lệ.

=== LUẬT CHUNG (deterministic) ===
1. Start score = 100. Sau khi tính toán, cap score vào [0,100] và làm tròn thành integer.
2. Nếu JD quá ít thông tin (<= 3 từ, hoặc không có section mô tả responsibilities/skills/years) → set jd_quality="poor", score=15, trả về JSON sớm (xem cấu trúc output ở cuối).
3. Phân loại yêu cầu trong JD thành:
   - mandatory_requirements (bắt buộc)
   - desired_skills (mong muốn)
   - years_required (số năm tối thiểu nếu có)
   - certs_required (chứng chỉ bắt buộc nếu JD nói rõ)
   - domain/industry keywords
   (Nhận diện "bắt buộc" nếu JD có từ như: must, required, bắt buộc, essential, required experience, “ứng viên phải”.)
4. Matching rules (case-insensitive):
   - Exact substring token match → count là present.
   - Nếu không exact nhưng có lemma/synonym (ví dụ Python = python), treat as present.
   - Nếu chỉ partial (ví dụ JD: "React + Node", CV chỉ có "React") → treat phần thiếu là missing.
   - Use a small synonym map: {"devops":"site reliability","pm":"project manager","ba":"business analyst"}.
5. Deduction rules:
   - Missing mandatory requirement: −40 per missing item.
   - Missing desired skill: −15 per missing item.
   - If years_experience < years_required: −20 plus −5 for each additional full year missing beyond the first year gap, tối đa −40 cho kinh nghiệm.
     (Ví dụ: yêu cầu 5 năm, ứng viên 3 năm → gap=2 → trừ 20 + 5*(2-1)=25 total)
   - If JD explicitly requires a specific cert and CV lacks: −40 per required cert.
   - If JD asks "relevant certificates" but CV has none: −10.
   - Domain mismatch (CV industry không liên quan với JD domain và JD chỉ tuyển domain cụ thể): −15.
6. Nếu CV không nêu số năm rõ ràng: cố gắng infer từ khoảng thời gian từng job (2018-2021 → 3 năm). Nếu không thể infer → treat years_experience = 0 và lưu ý trong 'reasons'.
7. 'score_breakdown:' bắt buộc liệt kê mỗi khoản trừ/thuật toán và tổng.
8. Luôn trả 'confidence' = "high"/"medium"/"low" theo quy tắc:
   - high: trích xuất tên, years_experience, skills, certs rõ ràng (>=4 trường rõ).
   - medium: 2–3 trường rõ.
   - low: <2 trường hoặc nhiều infer.
9. Nếu JD poor (theo 2.), set jd_quality="poor". Ngược lại jd_quality="good".
10. Không in thêm văn bản mô tả, chỉ output JSON.

=== TRÌNH TỰ XỬ LÝ (bắt buộc) ===
1. Tiền xử lý: lowercase cả jd và cvText.
2. Trích xuất từ JD: mandatory_requirements[], desired_skills[], years_required (number or null), certs_required[], domain[].
3. Trích xuất từ CV: name (string or ""), years_experience (number or "0" nếu infer fail), skills[], education (string or ""), certifications[], languages[], notable_projects[].
4. So sánh theo Matching rules và Deduction rules.
5. Tính score theo Deduction rules, cap 0..100, làm tròn integer.
6. Trả JSON theo cấu trúc ngay dưới.

=== OUTPUT JSON (PHẢI CHÍNH XÁC, KHÔNG MARKDOWN) ===
{
  "extract": {
    "name": "tên ứng viên ("" nếu không tìm thấy)",
    "years_experience": số_năm (VD: 3) hoặc 0,
    "skills": ["kỹ năng 1", "kỹ năng 2"],
    "education": "học vấn ("" nếu không có)",
    "certifications": ["chứng chỉ 1"],
    "languages": ["ngôn ngữ 1"],
    "notable_projects": ["dự án 1"]
  },
  "score": số_nguyên_0_đến_100,
  "score_breakdown": {
    "start": 100,
    "missing_mandatory_total": tổng_điểm_bị_trừ,
    "missing_desired_total": tổng_điểm_bị_trừ,
    "experience_penalty": số_điểm_bị_trừ,
    "certs_penalty": số_điểm_bị_trừ,
    "domain_penalty": số_điểm_bị_trừ,
    "other_penalties": số_điểm_bị_trừ,
    "final": giá_trị_cuối
  },
  "reasons": {
    "must_have_skills": "bình luận chi tiết (nếu JD không rõ, ghi: 'JD không có yêu cầu rõ ràng - điểm thấp')",
    "experience": "đánh giá kinh nghiệm so với JD (liệt kê years_required nếu có và years_experience)",
    "domain_fit": "đánh giá phù hợp ngành",
    "certs_others": "đánh giá chứng chỉ và các ghi chú (rõ/nếu infer)"
  },
  "jd_quality": "good" hoặc "poor",
  "confidence": "high" hoặc "medium" hoặc "low"
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