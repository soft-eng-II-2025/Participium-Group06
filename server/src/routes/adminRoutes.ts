// src/routes/adminRoutes.ts
import { Router, Response } from 'express';
import { validateDto } from "../middlewares/validationMiddleware";
import { MunicipalityOfficerDTO } from "../models/DTOs/MunicipalityOfficerDTO";
import * as adminController from "../controllers/adminController";

export const router = Router();

router.post('/accounts/register', validateDto(MunicipalityOfficerDTO), async (req, res: Response) => {
    const newMunicipalityOfficer = await adminController.addMunicipalityOfficer(req.body);
    res.status(201).json(newMunicipalityOfficer);
});

router.get("/accounts/list", async (req, res) => {
    const allMunicipalityOfficer = await adminController.getAllMunicipalityOfficer();
    res.status(200).json(allMunicipalityOfficer);
});

router.put("/accounts/assign", validateDto(MunicipalityOfficerDTO), async (req, res: Response) => {
    const updatedOfficer = await adminController.updateMunicipalityOfficer(req.body);
    res.status(200).json(updatedOfficer);
});

// NEW: lista ruoli
router.get("/roles/list", async (req, res) => {
    const roles = await adminController.getAllRoles();
    res.status(200).json(roles);
});
