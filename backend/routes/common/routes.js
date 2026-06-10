import express from "express";

import { login } from "../../controllers/authController.js";

import protect from "../../middleware/authMiddleware.js";

const router = express.Router();

// AUTH
router.post("/login", login);

// PROFILE
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// router.patch("/profile", protect, updateProfile);

export default router;
