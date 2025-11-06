import {Router, Response} from 'express';
import {validateDto} from "../middlewares/validationMiddleware";
import {ReportDTO} from "../models/DTOs/ReportDTO";


export const router = Router();


router.post('/:id/reports', validateDto(ReportDTO), async (req, res: Response, next) => {
    // TODO: remove comment
    /*
    req.body.userId = Number(req.params.id);
    const newReport = await userController.addReport(req.body);
    res.status(201).json(newReport);
     */

})

