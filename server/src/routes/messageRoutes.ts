// /server/src/routes/messageRoutes.ts
import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import * as messageController from "../controllers/messagingController";
import * as adminController from "../controllers/adminController";
import { UserResponseDTO } from "../models/DTOs/UserResponseDTO";
import { DataSource } from "typeorm";
import { MunicipalityOfficerResponseDTO } from "../models/DTOs/MunicipalityOfficerResponseDTO";
import { mapCreateReportRequestToDAO, mapMunicipalityOfficerDAOToDTO } from "../services/mapperService";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { Chat } from "../models/Chat";
import { ChatType } from "../models/ChatType";

export const router = Router();

// Send a new message
router.post("/:chatId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const chatId = Number(req.params.chatId);
        const dto = req.body; // CreateMessageDTO

        const result = await messageController.sendMessage(chatId, dto);
        res.json(result);
    } catch (err: any) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});


// Get all messages for a specific report
router.get("/:reportId/officer-user", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reportId = +req.params.reportId;
        if (isNaN(reportId)) return res.status(400).json({ error: "Invalid report ID" });
        const chatType = ChatType.OFFICER_USER;
        const messages = await messageController.getMessagesByReport(reportId, chatType);
        res.status(200).json(messages);
    } catch (err) {
        next(err);
    }
});

router.get("/:reportId/lead-external", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reportId = +req.params.reportId;
        if (isNaN(reportId)) return res.status(400).json({ error: "Invalid report ID" });
        const chatType = ChatType.LEAD_EXTERNAL;
        const messages = await messageController.getMessagesByReport(reportId, chatType);
        res.status(200).json(messages);
    } catch (err) {
        next(err);
    }
});
