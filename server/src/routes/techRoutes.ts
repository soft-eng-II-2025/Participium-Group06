import { Router, Response } from 'express';
import express from 'express';
import { requireTechAgent } from '../middlewares/authMiddleware';
import * as adminController from "../controllers/adminController";

export const router = Router();

router.get('/:id/reports/list',requireTechAgent, async (req, res: Response) => {
    const techAgentId = Number(req.params.id);
    const reports = await adminController.getTechReports(techAgentId);
    res.status(200).json(reports);
});
