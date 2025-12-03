import { Router, Response } from 'express';
import { validateDto } from "../middlewares/validationMiddleware";
import { AssignRoleRequestDTO } from "../models/DTOs/AssignRoleRequestDTO";
import { MunicipalityOfficerResponseDTO } from "../models/DTOs/MunicipalityOfficerResponseDTO"; // solo tipo di output, non usato in validate
import * as adminController from "../controllers/adminController";
import {CreateUserRequestDTO} from "../models/DTOs/CreateUserRequestDTO";
import { requireAdmin } from '../middlewares/authMiddleware';
import { CreateOfficerRequestDTO } from '../models/DTOs/CreateOfficerRequestDTO';

export const router = Router();



router.post('/accounts/register', requireAdmin, validateDto(CreateOfficerRequestDTO), async (req, res: Response, next) => {

    const newMunicipalityOfficer = await adminController.addMunicipalityOfficer(req.body);
    res.status(201).json(newMunicipalityOfficer);
})



router.get("/accounts/list", requireAdmin, async (req, res, next) => {

    const allMunicipalityOfficer = await adminController.getAllMunicipalityOfficer();
    res.status(200).json(allMunicipalityOfficer);

});


router.put("/accounts/assign", requireAdmin, validateDto(AssignRoleRequestDTO), async (req, res: Response, next) => {

    const updatedOfficer = await adminController.updateMunicipalityOfficer(req.body);
    res.status(200).json(updatedOfficer);

})



router.get("/roles/list", requireAdmin, async (req, res,next) => {
    const roles = await adminController.getAllRoles();
    res.status(200).json(roles);
});


// Adapter: accetta sia { username, roleTitle } che { username, role: { title } }
/*function adaptAssignRoleBody(body: any): AssignRoleRequestDTO {
    if (body?.role?.title && body?.username) {
        return { username: String(body.username), roleTitle: String(body.role.title) };
    }
    return { username: String(body.username), roleTitle: String(body.roleTitle) };
}*/


/*router.put("/accounts/assign", async (req, res: Response, next) => {
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
});*/
