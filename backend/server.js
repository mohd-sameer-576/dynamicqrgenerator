import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import QRCode from "./models/QRCode.js";
import qrRoutes from "./routes/qrRoutes.js";

dotenv.config();

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "10kb" }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again later." }
});

app.post("/api/auth/login", loginLimiter, (req, res) => {
  const { password } = req.body || {};

  if (
    typeof password !== "string" ||
    !process.env.ADMIN_PASSWORD ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ message: "Incorrect password" });
  }

  const token = jwt.sign(
    { role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

app.use("/api/qr", qrRoutes);

// Public dynamic redirect. QR IDs are random and destinations accept HTTPS only.
app.get("/q/:id", async (req, res) => {
  try {
    const qr = await QRCode.findOneAndUpdate(
      { qrId: req.params.id, isActive: true },
      { $inc: { totalScans: 1 } },
      { new: true }
    ).select("destinationUrl");

    if (!qr) return res.status(404).send("QR code not found or disabled");
    return res.redirect(302, qr.destinationUrl);
  } catch (error) {
    console.error("Redirect error:", error);
    return res.status(500).send("Unable to process QR code");
  }
});

app.get("/", (_req, res) => res.send("TapEpo Dynamic QR API is running"));

async function start() {
  const required = ["MONGO_URI", "BASE_URL", "FRONTEND_URL", "ADMIN_PASSWORD", "JWT_SECRET"];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  await connectDB();
  const port = process.env.PORT || 5000;
  app.listen(port, "0.0.0.0", () => console.log(`API running on port ${port}`));
}

start().catch((error) => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
