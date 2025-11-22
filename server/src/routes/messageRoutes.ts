// src/routes/messageRoutes.ts
import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import * as messageController from "../controllers/messagingController";
import * as adminController from "../controllers/adminController";
import { UserResponseDTO } from "../models/DTOs/UserResponseDTO";
import { DataSource } from "typeorm";
import { MunicipalityOfficerResponseDTO } from "../models/DTOs/MunicipalityOfficerResponseDTO";
import { mapCreateReportRequestToDAO, mapMunicipalityOfficerDAOToDTO } from "../services/mapperService";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";

export const router = Router();

// Send a new message
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { content, reportId, senderType, recipientId } = req.body;

        if (!content || !reportId || !senderType) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Cast req.user to the expected type
        if (senderType == "USER"){
            const user = req.user as UserResponseDTO;
        if (!user) return res.status(401).json({ error: "Not authenticated" });

        const message = await messageController.sendMessage(
            content,
            reportId,
            senderType,
            user.userId,
            recipientId
        );
        res.status(201).json(message);}
        else{

            const officerId: number = await adminController.getOfficerIdByEmail((req.user as MunicipalityOfficerResponseDTO).email);

            const message = await messageController.sendMessage(
            content,
            reportId,
            senderType,
            officerId,
            recipientId
        );
        if (!officerId) return res.status(401).json({ error: "Not authenticated" });
        res.status(201).json(message);}
    } catch (err) {
        next(err);
    }
});

// Get all messages for a specific report
router.get("/:reportId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reportId = +req.params.reportId;
        if (isNaN(reportId)) return res.status(400).json({ error: "Invalid report ID" });

        const messages = await messageController.getMessagesByReport(reportId);
        res.status(200).json(messages);
    } catch (err) {
        next(err);
    }
});
