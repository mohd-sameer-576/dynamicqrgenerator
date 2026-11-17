import express from "express";
import crypto from "node:crypto";
import QRCode from "../models/QRCode.js";
import auth from "../middleware/auth.js";

const router = express.Router();

function isValidDestination(value) {
  if (typeof value !== "string" || value.length > 2048) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

// All management routes require admin authentication.
router.use(auth);

// Create a dynamic QR record.
router.post("/", async (req, res) => {
  try {
    const { destinationUrl } = req.body;

    if (!isValidDestination(destinationUrl)) {
      return res.status(400).json({ message: "Enter a valid HTTPS destination URL" });
    }

    const qr = await QRCode.create({
      qrId: crypto.randomBytes(16).toString("hex"),
      destinationUrl
    });

    res.status(201).json({
      message: "QR created",
      qr,
      qrUrl: `${process.env.BASE_URL}/q/${qr.qrId}`
    });
  } catch (error) {
    console.error("Create QR error:", error);
    res.status(500).json({ message: "Unable to create QR" });
  }
});

// List QR codes.
router.get("/", async (_req, res) => {
  try {
    const qrs = await QRCode.find().sort({ createdAt: -1 }).lean();
    res.json(qrs);
  } catch (error) {
    console.error("List QR error:", error);
    res.status(500).json({ message: "Unable to load QR codes" });
  }
});

// Update destination while keeping the same QR ID.
router.put("/:id", async (req, res) => {
  try {
    const { destinationUrl } = req.body;

    if (!isValidDestination(destinationUrl)) {
      return res.status(400).json({ message: "Enter a valid HTTPS destination URL" });
    }

    const qr = await QRCode.findOneAndUpdate(
      { qrId: req.params.id },
      { $set: { destinationUrl } },
      { new: true, runValidators: true }
    );

    if (!qr) return res.status(404).json({ message: "QR not found" });
    res.json({ message: "Destination updated", qr });
  } catch (error) {
    console.error("Update QR error:", error);
    res.status(500).json({ message: "Unable to update QR" });
  }
});

// Enable or disable a QR code.
router.patch("/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }

    const qr = await QRCode.findOneAndUpdate(
      { qrId: req.params.id },
      { $set: { isActive } },
      { new: true }
    );

    if (!qr) return res.status(404).json({ message: "QR not found" });
    res.json(qr);
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ message: "Unable to update QR status" });
  }
});

export default router;
