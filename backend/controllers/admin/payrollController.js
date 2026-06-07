import Payroll from "../../models/Payroll.js";
import User from "../../models/User.js";

// CREATE PAYROLL
export const createPayroll = async (req, res) => {
  try {
    const { employeeId, amountPaid, paymentDate, month, status, notes } = req.body;

    if (!employeeId || !amountPaid || !paymentDate || !month) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
      createdBy: req.user._id,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const payroll = await Payroll.create({
      employee: employeeId,
      admin: req.user._id,
      amountPaid,
      paymentDate,
      month,
      status: status || "paid",
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payroll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET PAYROLLS FOR A SPECIFIC EMPLOYEE
export const getEmployeePayrolls = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const payrolls = await Payroll.find({
      employee: employeeId,
      admin: req.user._id,
    }).sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      payrolls,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE PAYROLL
export const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findOneAndDelete({
      _id: req.params.id,
      admin: req.user._id,
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payroll record deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
