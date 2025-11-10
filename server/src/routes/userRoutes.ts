import { Router, Response } from 'express';
import { validateDto } from "../middlewares/validationMiddleware";
import { CreateReportRequestDTO } from "../models/DTOs/CreateReportRequestDTO";
import * as userController from "../controllers/userController";

export const router = Router();

// Adapter: accetta anche il vecchio formato { user: { userId }, category: { id } }
function adaptCreateReportBody(body: any): CreateReportRequestDTO {
    const userId = body?.userId ?? body?.user?.userId ?? body?.user?.id;
    const categoryId = body?.categoryId ?? body?.category?.id;
    return {
        longitude: Number(body.longitude),
        latitude: Number(body.latitude),
        title: String(body.title),
        description: String(body.description),
        userId: Number(userId),
        categoryId: Number(categoryId),
        photos: Array.isArray(body.photos) ? body.photos.map(String) : [],
    };
}

router.post('/reports', async (req, res: Response) => {
    const adapted = adaptCreateReportBody(req.body);
    req.body = adapted;
    return validateDto(CreateReportRequestDTO)(req, res, async () => {
        const newReport = await userController.addReport(req.body); // CreateReportRequestDTO -> ReportResponse
        res.status(201).json(newReport);
    });
});
