import { Schema, model, Types } from "mongoose";

const violationSchema = new Schema(
    {
        vehicleNumber: { type: String, required: true, uppercase: true },
        // ownerInfo is NOT stored — fetched dynamically from vehicleNumber via govt API
        violation: {
            key: { type: String, required: true },   // e.g. "no_helmet", "overspeeding"
            id: { type: Number, required: true },     // e.g. 1001, 1050
        },
        source: {
            type: String,
            enum: ["citizen_report", "hardware", "admin"],
            required: true,
        },
        reportId: { type: Types.ObjectId, ref: "Report" },
        hardwareId: { type: String },
        evidence: [{ type: String }], // photo URL
        fine: { type: Number }, // ₹ amount
        points: { type: Number }, // deducted from safety score
        status: {
            type: String,
            enum: ["pending", "confirmed", "rejected", "paid", "appealed"],
            default: "pending",
        },
        reviewedBy: { type: Types.ObjectId, ref: "Moderator" },
    },
    { timestamps: true }
);

export default model("Violation", violationSchema);