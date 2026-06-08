import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from "../services/notifications.js";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(req.user!.userId),
      getUnreadCount(req.user!.userId),
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.patch("/:id/read", authenticate, async (req: AuthRequest, res) => {
  await markRead(String(req.params.id), req.user!.userId);
  res.json({ message: "Marked as read" });
});

router.patch("/read-all", authenticate, async (req: AuthRequest, res) => {
  await markAllRead(req.user!.userId);
  res.json({ message: "All marked as read" });
});

export default router;
