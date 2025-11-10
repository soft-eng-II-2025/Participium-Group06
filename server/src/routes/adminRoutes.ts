import { Router, Response } from 'express';
import { validateDto } from "../middlewares/validationMiddleware";
import { AssignRoleRequestDTO } from "../models/DTOs/AssignRoleRequestDTO";
import { MunicipalityOfficerResponseDTO } from "../models/DTOs/MunicipalityOfficerResponseDTO"; // solo tipo di output, non usato in validate
import * as adminController from "../controllers/adminController";

export const router = Router();

// NB: Se hai un CreateMunicipalityOfficerRequest, usa quello qui.
// Per ora lasciamo così: valida lato service.
router.post('/accounts/register', async (req, res: Response) => {
    const newMunicipalityOfficer = await adminController.addMunicipalityOfficer(req.body);
    res.status(201).json(newMunicipalityOfficer as MunicipalityOfficerResponseDTO);
});

router.get("/accounts/list", async (_req, res) => {
    const allMunicipalityOfficer = await adminController.getAllMunicipalityOfficer();
    res.status(200).json(allMunicipalityOfficer as MunicipalityOfficerResponseDTO[]);
});

// Adapter: accetta sia { username, roleTitle } che { username, role: { title } }
function adaptAssignRoleBody(body: any): AssignRoleRequestDTO {
    if (body?.role?.title && body?.username) {
        return { username: String(body.username), roleTitle: String(body.role.title) };
    }
    return { username: String(body.username), roleTitle: String(body.roleTitle) };
}

router.put("/accounts/assign", async (req, res: Response, next) => {
    const adapted = adaptAssignRoleBody(req.body);
    req.body = adapted;

    return validateDto(AssignRoleRequestDTO)(req, res, async () => {
        // Usiamo SEMPRE la funzione esistente nel controller
        const updatedOfficer = await adminController.updateMunicipalityOfficer({
            username: adapted.username,
            role: { title: adapted.roleTitle },
        } as any);

        res.status(200).json(updatedOfficer);
    });
});
