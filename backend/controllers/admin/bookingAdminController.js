import Booking from "../../models/Booking.js";
import User from "../../models/User.js";
import { uploadToCloudinary } from "../../services/cloudinaryService.js";

const pendingBookingCreates = new Set();

export const createBooking = async (req, res) => {
  let requestDedupeKey;

  try {
    const {
      customerName, phone, vehicleBrand, vehicleName, 
      vehicleNumber, complaintType, description, estimateAmount,
      assignedTo,
      clientRequestId,
    } = req.body;
    if (!customerName || !phone || !vehicleBrand || !vehicleName || !vehicleNumber || !complaintType || !estimateAmount) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    if (assignedTo) {
      const employee = await User.findOne({
        _id: assignedTo,
        role: "employee",
        createdBy: req.user._id,
      });

      if (!employee) {
        return res.status(400).json({ success: false, message: "Invalid employee for this admin" });
      }
    }

    requestDedupeKey = clientRequestId
      ? `${req.user._id}:request:${clientRequestId}`
      : [
        req.user._id,
        phone,
        vehicleBrand,
        vehicleName,
        vehicleNumber,
        complaintType,
        estimateAmount,
      ].join(":");

    if (pendingBookingCreates.has(requestDedupeKey)) {
      return res.status(409).json({
        success: false,
        message: "Booking creation is already in progress. Please wait.",
      });
    }

    pendingBookingCreates.add(requestDedupeKey);

    if (clientRequestId) {
      const existingRequestBooking = await Booking.findOne({
        createdBy: req.user._id,
        clientRequestId,
      });

      if (existingRequestBooking) {
        return res.status(200).json({
          success: true,
          message: "Booking already created",
          booking: existingRequestBooking,
        });
      }
    }

    const duplicateWindowStart = new Date(Date.now() - 2 * 60 * 1000);
    const duplicateBooking = await Booking.findOne({
      createdBy: req.user._id,
      phone,
      vehicleBrand,
      vehicleName,
      vehicleNumber,
      complaintType,
      estimateAmount: Number(estimateAmount),
      createdAt: { $gte: duplicateWindowStart },
    });

    if (duplicateBooking) {
      return res.status(409).json({
        success: false,
        message: "This booking was already created recently. Please refresh before creating it again.",
      });
    }

    const beforeImages = [];
    // if (!req.files?.length) {
    //   return res.status(400).json({ success: false, message: "Please upload 2 before-work images" });
    // }
    if (req.files?.length > 2) {
      return res.status(400).json({ success: false, message: "Maximum 2 before-work images allowed" });
    }
    // if (req.files.length !== 2) {
    //   return res.status(400).json({ success: false, message: "Exactly 2 before-work images are required" });
    // }

    const uploadResults = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer, "workpilot/before-images"))
    );
    beforeImages.push(...uploadResults);

    const booking = await Booking.create({
      customerName, phone, vehicleBrand, vehicleName, 
      vehicleNumber, complaintType, description, 
      estimateAmount, beforeImages, createdBy: req.user._id,
      clientRequestId: clientRequestId || undefined,
      assignedTo: assignedTo || null,
      status: assignedTo ? "assigned" : "pending",
    });

    res.status(201).json({ success: true, message: "Booking created successfully", booking });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Duplicate booking request ignored" });
    }
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (requestDedupeKey) {
      pendingBookingCreates.delete(requestDedupeKey);
    }
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ createdBy: req.user._id })
      .populate("vehicleBrand")
      .populate("assignedTo", "name phone")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
      createdBy: req.user._id,
    });
    if (!employee || employee.role !== "employee") {
      return res.status(400).json({ success: false, message: "Invalid employee" });
    }

    booking.assignedTo = employeeId;
    booking.status = "assigned"; // Updated status to match assignment
    await booking.save();

    res.status(200).json({ success: true, message: "Employee assigned successfully", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const adminFilter = { createdBy: req.user._id };
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const selectedDate = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const calendarStart = new Date(selectedDate);
    calendarStart.setDate(calendarStart.getDate() - 14);
    calendarStart.setHours(0, 0, 0, 0);

    const calendarEnd = new Date(selectedDate);
    calendarEnd.setDate(calendarEnd.getDate() + 14);
    calendarEnd.setHours(23, 59, 59, 999);

    const [
      totalBookings,
      pendingBookings,
      assignedBookings,
      inProgressBookings,
      completedBookings,
      totalEmployees,
      totalRevenue,
      todayRevenue,
      recentBookings,
      selectedDateBookings,
      todayBookings,
      calendarBookings,
    ] = await Promise.all([
      Booking.countDocuments(adminFilter),
      Booking.countDocuments({ ...adminFilter, status: "pending" }),
      Booking.countDocuments({ ...adminFilter, status: "assigned" }),
      Booking.countDocuments({ ...adminFilter, status: "in_progress" }),
      Booking.countDocuments({ ...adminFilter, status: "completed" }),
      User.countDocuments({ role: "employee", createdBy: req.user._id }),
      Booking.aggregate([
        { $match: { ...adminFilter, status: "completed" } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$finalAmount", "$estimateAmount"] } } } },
      ]),
      Booking.aggregate([
        {
          $match: {
            ...adminFilter,
            status: "completed",
            completedAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$finalAmount", "$estimateAmount"] } } } },
      ]),
      Booking.find(adminFilter)
        .populate("vehicleBrand")
        .populate("assignedTo", "name phone")
        .sort({ createdAt: -1 })
        .limit(5),
      Booking.find({ ...adminFilter, createdAt: { $gte: startOfDay, $lte: endOfDay } })
        .populate("vehicleBrand")
        .populate("assignedTo", "name phone")
        .sort({ createdAt: -1 }),
      Booking.countDocuments({ ...adminFilter, createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Booking.aggregate([
        { $match: { ...adminFilter, createdAt: { $gte: calendarStart, $lte: calendarEnd } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const markedDates = calendarBookings.reduce((acc, item) => {
      acc[item._id] = {
        marked: true,
        dotColor: "#c495ff",
        bookingCount: item.count,
      };
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        assignedBookings,
        inProgressBookings,
        completedBookings,
        totalEmployees,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCollection: totalRevenue[0]?.total || 0,
        totalPending: pendingBookings + assignedBookings + inProgressBookings,
        todayBookings,
        todayCollection: todayRevenue[0]?.total || 0,
      },
      recentBookings,
      selectedDateBookings,
      markedDates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
