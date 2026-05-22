import User from "../../models/User.js";
import bcrypt from "bcryptjs";


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

    const hashedPassword = await bcrypt.hash(phone.toString(), 10);

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

export const updateEmployee = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    const employee = await User.findOne({
      _id: req.params.id,
      role: "employee",
      createdBy: req.user._id,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const existingUser = await User.findOne({
      phone,
      _id: { $ne: employee._id },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    employee.name = name;
    employee.phone = phone;
    employee.password = await bcrypt.hash(phone.toString(), 10);
    await employee.save();

    res.status(200).json({
      success: true,
      message: "Employee updated successfully. Password reset to mobile number.",
      employee: {
        _id: employee._id,
        name: employee.name,
        phone: employee.phone,
        role: employee.role,
        createdBy: employee.createdBy,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
