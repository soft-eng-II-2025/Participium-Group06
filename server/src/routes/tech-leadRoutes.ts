import { Router, Response } from 'express';
import express from 'express';
import { requireTechLead } from '../middlewares/authMiddleware';
import * as adminController from "../controllers/adminController";

export const router = Router();

router.put('/:officerId/report/:reportId', requireTechLead, async (req, res: Response) => {
    const officerId = Number(req.params.officerId);
    const reportId = Number(req.params.reportId);

    const updatedReport = await adminController.assignTechAgent(reportId, officerId);
    res.status(200).json(updatedReport);
});

router.get('/:id/agents', requireTechLead, async (req, res: Response) => {
    const techLeadId = Number(req.params.id);
    const agents = await adminController.getAgentsByTechLeadId(techLeadId);
    res.status(200).json(agents);
});

router.get('/:id/reports/list', requireTechLead, async (req, res: Response) => {
    const techLeadId = Number(req.params.id);
    const reports = await adminController.getTechLeadReports(techLeadId);
    res.status(200).json(reports);
});

