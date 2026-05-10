const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();

// FORCE PRODUCTION ROUTES (Top Priority)
app.get("/", (req, res) => {
  res.send("REFERZEN API PRODUCTION SERVER IS LIVE 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", version: "1.0.1", uptime: process.uptime() });
});

// Upload folder
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));

// Middleware
app.use(express.json());
app.use(cors({
  origin: "*", // In production, replace with your specific Vercel URL for security
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// DevOps Health Check (Crucial for Render/Monitoring)
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime() 
  });
});

app.get("/", (req, res) => {
  res.send("ReferZen API Server is Running...");
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/referrals", require("./routes/referralRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
const PORT = process.env.PORT || 5000;

// DB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => console.log(err));