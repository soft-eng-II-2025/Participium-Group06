import { Router, Response } from 'express';
import express from 'express';
import * as reportController from '../controllers/reportController';
import { StatusType } from '../models/StatusType';


export const router = Router();

router.post('/:id/status', async (req: express.Request, res: Response) => {
    try {
        const reportId = Number(req.params.id);
        const { status, explanation } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'STATUS_REQUIRED' });
        }
        if (status != StatusType.Rejected && status != StatusType.Resolved && status != StatusType.InProgress && status != StatusType.Suspended && status != StatusType.Assigned && status != StatusType.PendingApproval) {
            return res.status(400).json({ error: 'INVALID_STATUS_VALUE' });
        }
        if (status == StatusType.Rejected && (explanation == null || explanation == "" || explanation == undefined)) {
            return res.status(400).json({ error: 'EXPLANATION_REQUIRED_FOR_REJECTION' });
        }

        const updatedReport = await reportController.updateReportStatus(reportId, status, explanation || "");

        return res.status(200).json(updatedReport);
    } catch (error: any) {
        console.error('Error updating report status:', error);
        const statusCode = error.status || 500;
        return res.status(statusCode).json({ error: error.message || 'INTERNAL_SERVER_ERROR' });
    }
});

router.get('/', async (req: express.Request, res: Response) => {
    try {
        const reports = await reportController.getAllReports();
        return res.status(200).json(reports);
    } catch (error: any) {
        console.error('Error fetching all reports:', error);
        const statusCode = error.status || 500;
        return res.status(statusCode).json({ error: error.message || 'INTERNAL_SERVER_ERROR' });
    }
});
