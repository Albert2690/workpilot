import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
    },

    vehicleBrand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarBrand",
      required: true,
    },

    vehicleName: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
    },

    complaintType: {
      type: String,
      enum: ["Major", "Minor", "Low"],
      required: true,
    },

    description: {
      type: String,
    },

    beforeImages: [
      {
        type: String, // image URLs
      },
    ],

    afterImages: [
      {
        type: String,
      },
    ],

    estimateAmount: {
      type: Number,
      required: true,
    },

    finalAmount: {
      type: Number,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "online"],
    },

    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "completed"],
      default: "pending",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startedAt: Date,

    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
