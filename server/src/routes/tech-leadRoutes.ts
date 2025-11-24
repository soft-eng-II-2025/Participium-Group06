import { Router, Response } from 'express';
import express from 'express';
import { requireTechLead } from '../middlewares/authMiddleware';
import * as adminController from "../controllers/adminController";
import { User } from '../models/User';

export const router = Router();

router.put('/report/:reportId', requireTechLead, async (req, res: Response) => {
    const reportId = Number(req.params.reportId);

    const username = (req.user as User).username;
    const updatedReport = await adminController.assignTechAgent(reportId, username);
    res.status(200).json(updatedReport);
});

router.get('/agents', requireTechLead, async (req, res: Response) => {
    const username = (req.user as User).username;
    const agents = await adminController.getAgentsByTechLeadUsername(username);
    res.status(200).json(agents);
});

router.get('/reports/list', requireTechLead, async (req, res: Response) => {
    const username = (req.user as User).username;
    const reports = await adminController.getTechLeadReports(username);
    res.status(200).json(reports);
});

