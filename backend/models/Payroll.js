import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    month: {
      type: String, // e.g., "May 2026"
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "pending"],
      default: "paid",
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payroll", payrollSchema);
