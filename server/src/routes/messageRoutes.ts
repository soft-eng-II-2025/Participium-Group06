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

export const router = Router();

// Send a new message
router.post("/:reportId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reportId = Number(req.params.reportId);
        const dto = req.body; // CreateMessageDTO

        const result = await messageController.sendMessage(reportId, dto);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
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
