import Booking from "../../models/Booking.js";
import { uploadToCloudinary } from "../../services/cloudinaryService.js";

export const getAssignedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ assignedTo: req.user._id })
      .populate("vehicleBrand")
      .populate("assignedTo", "name phone")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, assignedTo: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.status === "completed") {
      return res.status(400).json({ success: false, message: "Completed booking cannot be started again" });
    }

    booking.status = "in_progress";
    booking.startedAt = booking.startedAt || new Date();
    await booking.save();

    res.status(200).json({ success: true, message: "Work started successfully", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeBooking = async (req, res) => {
  try {
    const { finalAmount, paymentMethod } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, assignedTo: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.status === "completed") {
      return res.status(400).json({ success: false, message: "Booking is already completed" });
    }
    if (!finalAmount || Number.isNaN(Number(finalAmount))) {
      return res.status(400).json({ success: false, message: "Valid final amount is required" });
    }
    if (!["cash", "online"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Payment method must be cash or online" });
    }

    const afterImages = [];
    // if (!req.files?.length) {
    //   return res.status(400).json({ success: false, message: "Please upload 2 after-work images" });
    // }
    // if (req.files.length !== 2) {
    //   return res.status(400).json({ success: false, message: "Exactly 2 after-work images are required" });
    // }

    for (const file of req.files) {
      const imageUrl = await uploadToCloudinary(file.buffer, "workpilot/after-images");
      afterImages.push(imageUrl);
    }

    booking.afterImages = afterImages;
    booking.finalAmount = Number(finalAmount);
    booking.paymentMethod = paymentMethod;
    booking.status = "completed";
    booking.startedAt = booking.startedAt || new Date();
    booking.completedAt = new Date();
    await booking.save();

    res.status(200).json({ success: true, message: "Booking completed successfully", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
