import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import * as notificationController from "../controllers/notificationController";
import { UserResponseDTO } from "../models/DTOs/UserResponseDTO";

export const router = Router();

// GET /notifications → tutte le notifiche dell’utente autenticato
router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as UserResponseDTO;
        const notifications = await notificationController.getMyNotifications(user.username);
        res.status(200).json(notifications);
    } catch (err) {
        next(err);
    }
});

// DELETE /notifications/:id → leggendo una notifica la rimuovi
router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notifId = +req.params.id;
        if (Number.isNaN(notifId)) return res.status(400).json({ error: "Invalid notification ID" });

        const user = req.user as UserResponseDTO;
        const result = await notificationController.deleteNotificationForUser(notifId, user.username);

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});

// PATCH /notifications/:id/read → mark a notification as read for the authenticated user
router.patch('/:id/read', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notifId = +req.params.id;
        if (Number.isNaN(notifId)) return res.status(400).json({ error: 'Invalid notification ID' });

        const user = req.user as UserResponseDTO;
        const dto = await notificationController.markAsReadForUser(notifId, user.username);

        res.status(200).json(dto);
    } catch (err) {
        next(err);
    }
});
