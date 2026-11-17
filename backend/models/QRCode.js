import mongoose from "mongoose";

const qrSchema = new mongoose.Schema(
  {
    qrId: { type: String, required: true, unique: true, index: true },
    destinationUrl: { type: String, required: true },
    totalScans: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("QRCode", qrSchema);
