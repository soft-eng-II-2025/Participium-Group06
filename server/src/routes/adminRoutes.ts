import {Router, Response} from 'express';
import {validateDto} from "../middlewares/validationMiddleware";
import {MunicipalityOfficerDTO} from "../models/DTOs/MunicipalityOfficerDTO";


export const router = Router();


router.post('/accounts/register', validateDto(MunicipalityOfficerDTO), async (req, res: Response, next) => {

    // TODO: remove comment
    /*
    const newMunicipalityOfficer = await adminController.addMunicipalityOfficer(req.body);
    res.status(201).json(newMunicipalityOfficer);
     */

})

router.get("/accounts/list", async (req, res, next) => {
    // TODO: remove comment
    /*
    const allMunicipalityOfficer = await adminController.getAllMunicipalityOfficer();
    res.status(200).json(allMunicipalityOfficer);
     */
});

router.put("/accounts/assign", validateDto(MunicipalityOfficerDTO), async (req, res: Response, next) => {
    // TODO: remove comment
    /*
    const updatedOfficer = await adminController.updateMunicipalityOfficer(req.body);
    res.status(200).json(updatedOfficer);
     */
})

