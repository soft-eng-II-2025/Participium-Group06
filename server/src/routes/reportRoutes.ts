import { Router, Response, Request } from "express";
import * as reportController from "../controllers/reportController";
import { StatusType } from "../models/StatusType";
import { validateDto } from "../middlewares/validationMiddleware";
import { UpdateStatusReportDTO } from "../models/DTOs/UpdateStatusReportDTO";
// eventualmente: import { requireAdmin } from "../middlewares/authMiddleware";

export const router = Router();

/*  PUT /:id/status
    Update the status of a report */

router.put("/:id/status",
    validateDto(UpdateStatusReportDTO),
    async (req, res, next) => {
        const reportId = Number(req.params.id);
        if (Number.isNaN(reportId)) {
            return res.status(400).json({ error: "INVALID_REPORT_ID" });
        }

        const { newStatus, explanation } = req.body as UpdateStatusReportDTO;
        const updatedReport = await reportController.updateReportStatus(
            reportId,
            newStatus as StatusType,
            explanation || ""
        );
        res.status(200).json(updatedReport);
    }
);

/* GET allReports /list
   Get a list of all reports */

router.get("/list", async (req, res, next) => {
    const reports = await reportController.getAllReports();
    res.status(200).json(reports);
});


router.get('/list/accepted', async (req, res) => {
    try {
        const reports = await reportController.getAllAcceptedReports();
        return res.status(200).json(reports);
    } catch (error: any) {
        console.error('Error fetching all reports:', error);
        const statusCode = error.status || 500;
        return res.status(statusCode).json({ error: error.message || 'INTERNAL_SERVER_ERROR' });
    }
});

