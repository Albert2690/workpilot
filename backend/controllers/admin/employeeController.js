import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";


export const createEmployee = async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const temporaryPassword = crypto.randomBytes(6).toString("base64url");
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create employee
    const employee = await User.create({
      name,
      phone,
      password: hashedPassword,
      role: "employee",

      // Logged-in admin id
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",

      employee: {
        _id: employee._id,
        name: employee.name,
        phone: employee.phone,
        role: employee.role,
        createdBy: employee.createdBy,
      },
      temporaryPassword,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee",createdBy: req.user._id }).select("-password");
    res.status(200).json({ success: true, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
