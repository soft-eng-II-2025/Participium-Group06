import { Router, Response, Request } from "express";
import * as reportController from "../controllers/reportController";
import { StatusType } from "../models/StatusType";
import { validateDto } from "../middlewares/validationMiddleware";
import { UpdateStatusReportDTO } from "../models/DTOs/UpdateStatusReportDTO";
// eventualmente: import { requireAdmin } from "../middlewares/authMiddleware";

export const router = Router();

/*  PUT /reports/:id/status
    Update the status of a report */

router.put("/reports/:id/status",
    validateDto(UpdateStatusReportDTO),
    async (req, res, next) => {
        const reportId = Number(req.params.id);
        if (Number.isNaN(reportId)) {
            return res.status(400).json({ error: "INVALID_REPORT_ID" });
        }

        const { newStatus, explanation } = req.body as UpdateStatusReportDTO;
        const updatedReport = await reportController.UpdateReportStatus(
            reportId,
            newStatus as StatusType,
            explanation || ""
        );
        res.status(200).json(updatedReport);
    }
);

/* GET allReports /reports/list
   Get a list of all reports */

router.get("/reports/list", async (req, res, next) => {
    const reports = await reportController.GetAllReports();
    res.status(200).json(reports);
});
