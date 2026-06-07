import User from "../../models/User.js";
import bcrypt from "bcryptjs";

const pendingEmployeeCreates = new Set();

export const createEmployee = async (req, res) => {
  let requestDedupeKey;

  try {
    const { name, phone, baseSalary } = req.body;
    const normalizedName = name?.trim();
    const normalizedPhone = phone?.toString().trim();
    const parsedBaseSalary = baseSalary ? Number(baseSalary) : 0;

    if (!normalizedName || !normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number",
      });
    }

    requestDedupeKey = `${req.user._id}:${normalizedPhone}`;

    if (pendingEmployeeCreates.has(requestDedupeKey)) {
      return res.status(409).json({
        success: false,
        message: "Employee creation is already in progress. Please wait.",
      });
    }

    pendingEmployeeCreates.add(requestDedupeKey);

    // Check existing user
    const existingUser = await User.findOne({ phone: normalizedPhone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(normalizedPhone, 10);

    // Create employee
    const employee = await User.create({
      name: normalizedName,
      phone: normalizedPhone,
      password: hashedPassword,
      role: "employee",
      baseSalary: parsedBaseSalary,

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
        baseSalary: employee.baseSalary,
        createdBy: employee.createdBy,
      },
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    if (requestDedupeKey) {
      pendingEmployeeCreates.delete(requestDedupeKey);
    }
  }
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee", createdBy: req.user._id, isActive: true }).select("-password");
    res.status(200).json({ success: true, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { name, phone, baseSalary } = req.body;
    const normalizedName = name?.trim();
    const normalizedPhone = phone?.toString().trim();
    const parsedBaseSalary = baseSalary ? Number(baseSalary) : 0;

    if (!normalizedName || !normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number",
      });
    }

    const employee = await User.findOne({
      _id: req.params.id,
      role: "employee",
      createdBy: req.user._id,
      isActive: true,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const existingUser = await User.findOne({
      phone: normalizedPhone,
      _id: { $ne: employee._id },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    employee.name = normalizedName;
    employee.phone = normalizedPhone;
    employee.baseSalary = parsedBaseSalary;
    employee.password = await bcrypt.hash(normalizedPhone, 10);
    await employee.save();

    res.status(200).json({
      success: true,
      message: "Employee updated successfully. Password reset to mobile number.",
      employee: {
        _id: employee._id,
        name: employee.name,
        phone: employee.phone,
        role: employee.role,
        baseSalary: employee.baseSalary,
        createdBy: employee.createdBy,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findOne({
      _id: req.params.id,
      role: "employee",
      createdBy: req.user._id,
      isActive: true,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    employee.isActive = false;
    await employee.save();

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
