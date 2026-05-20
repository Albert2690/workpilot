import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; 
import { connecDb } from "./config/Db.js";

// Routes
import commonRoutes from "./routes/common/routes.js";
import adminRoutes from "./routes/admin/routes.js";
import userRoutes from "./routes/user/routes.js";

const app = express();
const port = 7007;

// Connect to database
connecDb();

// Middleware
app.use(
  cors({
    origin: ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:19000'],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Route Mounting
app.use("/api/common", commonRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// Root test route
app.get("/", (req, res) => {
  res.send("WorkPilot API is running...");
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});