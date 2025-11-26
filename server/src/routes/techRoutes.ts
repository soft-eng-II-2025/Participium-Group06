import { Router, Response } from 'express';
import express from 'express';
import { requireTechAgent } from '../middlewares/authMiddleware';
import * as adminController from "../controllers/adminController";
import { UserResponseDTO } from '../models/DTOs/UserResponseDTO';

export const router = Router();

router.get('/reports/list',requireTechAgent, async (req, res: Response) => {
    const techUsername = (req.user as UserResponseDTO)?.username;

    const reports = await adminController.getTechReports(techUsername);
    res.status(200).json(reports);
});
