import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { checkDbConnection } from "./db.js";
import authRoutes from "./routes/auth.js";
import subscriptionRoutes from "./routes/subscription.js";
import paymentRoutes from "./routes/payments.js";
import notificationRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/admin.js";
import contactRoutes from "./routes/contact.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        config.frontendUrl,
        config.frontendUrl.replace("https://", "https://www."),
        config.frontendUrl.replace("https://www.", "https://"),
        "http://localhost:5173",
        "http://localhost:3000",
      ].filter(Boolean);
      // Allow same-origin requests (origin === undefined) and listed origins
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", async (_req, res) => {
  const dbOk = await checkDbConnection();
  res.json({
    status: "ok",
    database: dbOk ? "connected" : "disconnected",
    env: config.nodeEnv,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`GannPro9 API running on http://localhost:${config.port}`);
});
