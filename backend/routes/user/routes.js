import express from "express";

import protect from "../../middleware/authMiddleware.js";
import authorizeRoles from "../../middleware/roleMiddleware.js";

import upload from "../../middleware/uploadMiddleware.js";

import {
  getAssignedBookings,
  startBooking,
  completeBooking,
} from "../../controllers/user/bookingUserController.js";
import { employeeProfileUpdate } from "../../controllers/authController.js";

const router = express.Router();

// EMPLOYEE MIDDLEWARE
router.use(protect);
router.use(authorizeRoles("employee"));

/*
|--------------------------------------------------------------------------
| BOOKINGS
|--------------------------------------------------------------------------
*/

// GET ASSIGNED BOOKINGS
router.get("/bookings", getAssignedBookings);

// START WORK
router.patch("/booking/start/:id", startBooking);

// COMPLETE BOOKING
router.patch(
  "/booking/complete/:id",
  upload.array("afterImages", 2),
  completeBooking
);

// PROFILE
router.put("/profile-update", employeeProfileUpdate);

export default router;
