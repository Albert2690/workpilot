import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user),
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    const normalizedName = name.trim();
    const normalizedPhone = phone.toString().trim();

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingUser = await User.findOne({
      phone: normalizedPhone,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    const phoneChanged = user.phone !== normalizedPhone;
    user.name = normalizedName;
    user.phone = normalizedPhone;

    if (user.role === "employee" && phoneChanged) {
      user.password = await bcrypt.hash(normalizedPhone, 10);
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({
      success: true,
      message: user.role === "employee" && phoneChanged
        ? "Profile updated successfully. Password reset to mobile number."
        : "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Check existing admin/user
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await User.create({
      name,
      phone,
      password: hashedPassword,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      token: generateToken(admin),
      user: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
