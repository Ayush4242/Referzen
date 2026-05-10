const router = require("express").Router();

// ─── SMART TEMPLATE ENGINE (LOCAL AI) ──────────────────────────────────────────
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

    // Default Professional
    return `Subject: Referral Request: ${role} at ${company}\n\nDear [Referrer Name],\n\nI am writing to express my strong interest in the ${role} position at ${company}. Having researched the company's culture and current projects, I am eager to contribute my skills to the team. Given your experience at ${company}, I would be honored if you would consider referring me for this role. Thank you for your time and help.\n\nBest regards,\n[Your Name]`;
  }

  // Career Advice
  if (p.includes("advice") || p.includes("tips") || p.includes("help") || p.includes("how")) {
    return "The secret to a great referral request is personalization. Always mention a specific project or value of the company that resonates with you. Also, keep it short—referrers are busy! Would you like me to draft a message for a specific company?";
  }

  // Default fallback
  return "That's a great point! To give you the best help, could you tell me which company or role you're targeting? For example: 'Help me get a referral for a Frontend role at Google.'";
};

router.post("/generate", async (req, res) => {
  const { prompt, tone } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required." });
  }

  try {
    // Simulate a bit of "AI thinking" time
    const text = generateResponse(prompt, tone);
    
    // Add a slight delay to make it feel more "interactive"
    setTimeout(() => {
      res.json({ text });
    }, 800);
  } catch (err) {
    console.error("Local AI Error:", err);
    res.status(500).json({ message: "AI Assistant is resting. Try again in a second!" });
  }
});

module.exports = router;
