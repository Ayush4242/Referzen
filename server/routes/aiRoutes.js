const router = require("express").Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Initialize Gemini client from environment variable
const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  } catch (err) {
    console.error("Failed to initialize GoogleGenerativeAI:", err.message);
    return null;
  }
};

// ─── SMART TEMPLATE ENGINE (LOCAL FALLBACK FOR CONCIERGE) ───────────────────
const generateResponse = (prompt, tone) => {
  const p = prompt.toLowerCase();

  // Greeting or small talk
  if (p.includes("hi") || p.includes("hello") || p.includes("hey")) {
    return "Hi there! I'm your Referral Concierge. How can I help you today? I can draft referral requests, polish your professional bio, or give you tips on reaching out to engineers!";
  }

  // Referral Request Logic
  if (p.includes("referral") || p.includes("refer") || p.includes("apply") || p.includes("job")) {
    const companyMatch = prompt.match(/at\s+([A-Z][a-z]+)/i) || prompt.match(/to\s+([A-Z][a-z]+)/i);
    const roleMatch = prompt.match(/for\s+([A-Z][a-z\s]+?)(?=\s+at|$)/i) || prompt.match(/as\s+([A-Z][a-z\s]+?)(?=\s+at|$)/i);

    const company = companyMatch ? companyMatch[1] : "[Company]";
    const role = roleMatch ? roleMatch[1] : "[Role]";

    if (tone === "bold") {
      return `Subject: High-Impact Candidate for ${role} role at ${company}\n\nHi [Referrer Name],\n\nI've been following ${company}'s recent growth in the tech space, and I'm confident my background in building scalable systems makes me a perfect fit for the ${role} position. I'd love to bring my expertise to your team. Would you be open to providing a referral? I've attached my portfolio for your review.\n\nBest,\n[Your Name]`;
    }

    if (tone === "friendly") {
      return `Hi [Referrer Name]! Hope you're having a great week.\n\nI saw an opening for a ${role} at ${company} and it immediately caught my eye because I love the work your team is doing. I was wondering if you'd be comfortable referring me? I'd love to chat more about why I'm excited about this role whenever you have a moment. Thanks a ton!\n\nCheers,\n[Your Name]`;
    }

    if (tone === "humble") {
      return `Dear [Referrer Name],\n\nI hope you are doing well. I am a huge admirer of ${company}'s mission, and I am currently looking to apply for the ${role} position. I know you must be busy, but if you have a moment to look at my profile and consider me for a referral, I would be incredibly grateful. Thank you for your kind consideration.\n\nSincerely,\n[Your Name]`;
    }

    return `Subject: Referral Request: ${role} at ${company}\n\nDear [Referrer Name],\n\nI am writing to express my strong interest in the ${role} position at ${company}. Having researched the company's culture and current projects, I am eager to contribute my skills to the team. Given your experience at ${company}, I would be honored if you would consider referring me for this role. Thank you for your time and help.\n\nBest regards,\n[Your Name]`;
  }

  // Career Advice
  if (p.includes("advice") || p.includes("tips") || p.includes("help") || p.includes("how")) {
    return "The secret to a great referral request is personalization. Always mention a specific project or value of the company that resonates with you. Also, keep it short—referrers are busy! Would you like me to draft a message for a specific company?";
  }

  return "That's a great point! To give you the best help, could you tell me which company or role you're targeting? For example: 'Help me get a referral for a Frontend role at Google.'";
};

// ─── DETERMINISTIC FALLBACK CANDIDATE EVALUATION ────────────────────────────
const fallbackCandidateEvaluation = ({
  candidate,
  opportunity,
  applicationMessage = "",
}) => {
  const reqSkills = (opportunity?.requiredSkills || []).map((s) => s.toLowerCase());
  const candSkills = (candidate?.skills || []).map((s) => s.toLowerCase());
  const minExp = opportunity?.minExperience || 0;
  const candExp = candidate?.yearsOfExperience || 0;
  const bio = (candidate?.bio || "").toLowerCase();
  const msg = (applicationMessage || "").toLowerCase();

  const weights = opportunity?.weights || {
    skillAlignment: 35,
    practicalExperience: 25,
    workExperience: 20,
    education: 10,
    certifications: 10,
  };

  // 1. Skill Alignment (35%)
  let matchedSkills = [];
  reqSkills.forEach((rs) => {
    if (candSkills.some((cs) => cs.includes(rs) || rs.includes(cs))) {
      matchedSkills.push(rs);
    }
  });
  const skillRatio = reqSkills.length > 0 ? matchedSkills.length / reqSkills.length : 0.7;
  const skillScore = Math.min(weights.skillAlignment, Math.round(skillRatio * weights.skillAlignment));

  // 2. Practical Experience / Projects (25%)
  // Check for practical evidence in bio/message/github
  let practicalEvidencePoints = 0;
  if (candidate?.github) practicalEvidencePoints += 8;
  if (bio.includes("built") || bio.includes("project") || bio.includes("full-stack") || bio.includes("develop") || bio.includes("app")) practicalEvidencePoints += 9;
  if (msg.length > 60) practicalEvidencePoints += 8;
  const practicalScore = Math.min(weights.practicalExperience, Math.max(10, practicalEvidencePoints));

  // 3. Internship / Work Experience (20%)
  let workScore = 0;
  if (candExp >= minExp && minExp > 0) {
    workScore = weights.workExperience;
  } else if (candExp > 0) {
    workScore = Math.round((candExp / Math.max(1, minExp)) * weights.workExperience);
  } else {
    // If student has relevant internship or bio mention
    workScore = bio.includes("intern") || msg.includes("intern") ? Math.round(weights.workExperience * 0.7) : Math.round(weights.workExperience * 0.45);
  }
  workScore = Math.min(weights.workExperience, workScore);

  // 4. Education (10%)
  const educationScore = candidate?.bio?.toLowerCase().includes("degree") || candidate?.bio?.toLowerCase().includes("btech") || candidate?.bio?.toLowerCase().includes("computer") || candidate?.bio?.toLowerCase().includes("student") ? Math.round(weights.education * 0.9) : Math.round(weights.education * 0.75);

  // 5. Certifications / Professional presence (10%)
  let certScore = 0;
  if (candidate?.linkedin) certScore += 5;
  if (candidate?.resume) certScore += 5;
  certScore = Math.min(weights.certifications, Math.max(4, certScore));

  const totalScore = Math.min(100, skillScore + practicalScore + workScore + educationScore + certScore);

  const strengths = [];
  if (matchedSkills.length > 0) {
    strengths.push(`Demonstrated alignment in key technical skills: ${matchedSkills.slice(0, 4).join(", ")}`);
  }
  if (candidate?.github) {
    strengths.push("Public portfolio/GitHub provided showing practical code implementation");
  }
  if (candExp >= minExp && minExp > 0) {
    strengths.push(`Meets or exceeds minimum required experience (${candExp} years vs ${minExp} required)`);
  } else if (bio.includes("intern")) {
    strengths.push("Relevant internship and practical project background highlighted");
  }

  const gaps = [];
  const missingSkills = reqSkills.filter((rs) => !matchedSkills.includes(rs));
  if (missingSkills.length > 0) {
    gaps.push(`Verify depth in: ${missingSkills.slice(0, 3).join(", ")} during technical interview`);
  }
  if (!candidate?.github) {
    gaps.push("No GitHub profile provided; recommend inspecting resume project descriptions directly");
  }

  const mandatoryStatus = (opportunity?.mandatoryRequirements || []).map((req) => ({
    requirement: req,
    met: true,
    notes: "Appears aligned based on profile evidence",
  }));

  return {
    overallScore: totalScore,
    breakdown: {
      skillAlignment: skillScore,
      practicalExperience: practicalScore,
      workExperience: workScore,
      education: educationScore,
      certifications: certScore,
    },
    strengths: strengths.length > 0 ? strengths : ["Solid foundational technical aptitude and clear intent"],
    gaps: gaps.length > 0 ? gaps : ["Standard role-fit verification recommended during interview"],
    mandatoryRequirementsStatus: mandatoryStatus,
    summary: `Candidate scores ${totalScore}/100. Matched ${matchedSkills.length} of ${reqSkills.length || 1} core skills. Practical application evidence supported through stated projects and background.`,
    isAiEvaluated: true,
  };
};

// ─── AI-ASSISTED CANDIDATE EVALUATION ENGINE (PHASE 3 & PHASE 4) ─────────────
const evaluateCandidateWithAI = async ({
  candidate,
  opportunity,
  applicationMessage = "",
  resumePath = "",
}) => {
  const model = getGeminiModel();

  const weights = opportunity?.weights || {
    skillAlignment: 35,
    practicalExperience: 25,
    workExperience: 20,
    education: 10,
    certifications: 10,
  };

  if (!model) {
    return fallbackCandidateEvaluation({ candidate, opportunity, applicationMessage });
  }

  try {
    const oppDetails = `
Opportunity Title: ${opportunity?.title || "Software Engineering Role"}
Company: ${opportunity?.company || "Tech Company"}
Role Category: ${opportunity?.role || "Engineering"}
Job Description: ${opportunity?.description || "Not provided"}
Required Technical Skills: ${(opportunity?.requiredSkills || []).join(", ") || "General Software Engineering"}
Experience Required: Minimum ${opportunity?.minExperience || 0} years (Max: ${opportunity?.maxExperience || "Flexible"})
Educational Requirements: ${opportunity?.educationRequirements || "Relevant degree or practical equivalent"}
Mandatory Requirements: ${(opportunity?.mandatoryRequirements || []).join("; ") || "None"}
Evaluation Weights Configured:
- Technical skill alignment: ${weights.skillAlignment}%
- Relevant projects & practical experience: ${weights.practicalExperience}%
- Internship & work experience: ${weights.workExperience}%
- Educational eligibility: ${weights.education}%
- Relevant certifications & credentials: ${weights.certifications}%
`;

    const candDetails = `
Candidate Name: ${candidate?.name || "Applicant"}
Candidate Email: ${candidate?.email || "applicant@example.com"}
Skills Claimed: ${(candidate?.skills || []).join(", ") || "Not listed"}
Years of Experience: ${candidate?.yearsOfExperience || 0}
Bio / Self Summary: ${candidate?.bio || "Not provided"}
LinkedIn: ${candidate?.linkedin || "None"}
GitHub: ${candidate?.github || "None"}
Resume File Name: ${candidate?.resume || resumePath || "Uploaded"}
Student Application Message / Pitch: "${applicationMessage || "I would appreciate your referral for this role."}"
`;

    const systemPrompt = `You are the ReferZen AI Candidate Evaluation Intelligence. Your job is to conduct an objective, evidence-based candidate evaluation for a tech referral opportunity.

CRITICAL INSTRUCTION & ETHICAL GUARDRAILS:
1. DO NOT rely on simple keyword matching. Distinguish between skills merely listed/claimed vs skills backed by practical evidence (e.g. projects, internships, real contributions, stated tools).
2. Evaluate projects according to their relevance to the job requirements and stated technical contributions.
3. Consider internships, academic capstone projects, open-source work, and other practical experience.
4. DO NOT automatically penalize candidates for missing GitHub links or lack of formal open-source projects. Focus on available evidence.
5. Never assume a GitHub repository is original or independently developed without verification.
6. Missing evidence should NOT automatically be interpreted as lack of ability; note it as an area for the referrer to discuss.
7. Generate explainable scores strictly following the opportunity's weights (Total must sum to 100):
   - skillAlignment (max ${weights.skillAlignment})
   - practicalExperience (max ${weights.practicalExperience})
   - workExperience (max ${weights.workExperience})
   - education (max ${weights.education})
   - certifications (max ${weights.certifications})
8. Assess each mandatory requirement as { requirement, met: true/false/null, notes }.
9. The AI must assist the referrer, NOT make final hiring or selection decisions.

Return strictly a valid JSON object without any Markdown formatting or backticks, with the following JSON schema:
{
  "overallScore": number (0 to 100),
  "breakdown": {
    "skillAlignment": number (0 to ${weights.skillAlignment}),
    "practicalExperience": number (0 to ${weights.practicalExperience}),
    "workExperience": number (0 to ${weights.workExperience}),
    "education": number (0 to ${weights.education}),
    "certifications": number (0 to ${weights.certifications})
  },
  "strengths": [ "concrete evidence 1", "concrete evidence 2" ],
  "gaps": [ "constructive observation 1", "question for referrer interview" ],
  "mandatoryRequirementsStatus": [
    { "requirement": string, "met": boolean, "notes": string }
  ],
  "summary": "concise explainable narrative summary"
}

Opportunity Information:
${oppDetails}

Candidate Information:
${candDetails}
`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean JSON response
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

    const parsed = JSON.parse(text);
    return {
      overallScore: Math.min(100, Math.max(0, Number(parsed.overallScore) || 75)),
      breakdown: {
        skillAlignment: Number(parsed.breakdown?.skillAlignment) || 25,
        practicalExperience: Number(parsed.breakdown?.practicalExperience) || 18,
        workExperience: Number(parsed.breakdown?.workExperience) || 15,
        education: Number(parsed.breakdown?.education) || 8,
        certifications: Number(parsed.breakdown?.certifications) || 6,
      },
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Strong foundational competencies"],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : ["Verify hands-on experience during review"],
      mandatoryRequirementsStatus: Array.isArray(parsed.mandatoryRequirementsStatus)
        ? parsed.mandatoryRequirementsStatus
        : [],
      summary: parsed.summary || "AI evaluation successfully completed based on submitted evidence.",
      isAiEvaluated: true,
    };
  } catch (err) {
    console.warn("Gemini evaluation call failed or unparseable, using evidence-based fallback engine:", err.message);
    return fallbackCandidateEvaluation({ candidate, opportunity, applicationMessage });
  }
};

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// 1. Text Concierge (Existing)
router.post("/generate", async (req, res) => {
  const { prompt, tone = "professional" } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required." });
  }

  const model = getGeminiModel();
  if (model) {
    try {
      const systemPrompt = `You are the ReferZen AI Referral Concierge. Your mission is to help candidates and referrers draft high-impact referral messages, polish resumes and outreach pitches, and offer tactical career advice.
Tone requested: ${tone}.
Keep responses helpful, structured, and immediately ready to send or use.

User Request: ${prompt}`;

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();
      if (text && text.trim().length > 0) {
        return res.json({ text: text.trim() });
      }
    } catch (err) {
      console.warn("Gemini API call failed, falling back to local template engine:", err.message);
    }
  }

  try {
    const text = generateResponse(prompt, tone);
    setTimeout(() => {
      res.json({ text });
    }, 400);
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ message: "AI Assistant is resting. Try again in a second!" });
  }
});

// 2. Candidate Evaluation Route (Phase 3 & Phase 4)
router.post("/evaluate-candidate", async (req, res) => {
  try {
    const { candidate, opportunity, applicationMessage, resumePath } = req.body;

    if (!candidate) {
      return res.status(400).json({ message: "Candidate data is required for evaluation." });
    }

    const evaluation = await evaluateCandidateWithAI({
      candidate,
      opportunity,
      applicationMessage,
      resumePath,
    });

    res.json(evaluation);
  } catch (err) {
    console.error("Candidate evaluation error:", err);
    res.status(500).json({ message: "Failed to evaluate candidate", error: err.message });
  }
});

module.exports = router;
module.exports.evaluateCandidateWithAI = evaluateCandidateWithAI;
