import express from "express";

import protect from "../../middleware/authMiddleware.js";
import authorizeRoles from "../../middleware/roleMiddleware.js";

import upload from "../../middleware/uploadMiddleware.js";

import {
  createBooking,
  getAllBookings,
  assignEmployee,
  getDashboardStats,
} from "../../controllers/admin/bookingAdminController.js";

import {
  createEmployee,
  getEmployees,
  updateEmployee,
} from "../../controllers/admin/employeeController.js";

import {
  createBrand,
  getBrands,
} from "../../controllers/admin/brandController.js";
import { createAdmin } from "../../controllers/authController.js";

const router = express.Router();

// ADMIN MIDDLEWARE
router.use(protect);
router.use(authorizeRoles("admin"));

router.post("/create-admin", createAdmin);

/*
|--------------------------------------------------------------------------
| BOOKINGS
|--------------------------------------------------------------------------
*/

// CREATE BOOKING
router.post(
  "/booking/create",
  upload.array("beforeImages", 2),
  createBooking
);

// GET ALL BOOKINGS
router.get("/bookings", getAllBookings);

// ASSIGN EMPLOYEE
router.patch("/booking/assign/:id", assignEmployee);

/*
|--------------------------------------------------------------------------
| EMPLOYEES
|--------------------------------------------------------------------------
*/

// CREATE EMPLOYEE


// GET EMPLOYEES
router.get("/employees", getEmployees);
router.post("/employee/create", createEmployee);
router.patch("/employee/:id", updateEmployee);


/*
|--------------------------------------------------------------------------
| BRANDS
|--------------------------------------------------------------------------
*/

// CREATE BRAND
router.post("/brand/create", createBrand);

// GET BRANDS
router.get("/brands", getBrands);

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

router.get("/dashboard", getDashboardStats);
// router.post("/create/admin", createAdmin);

export default router;
