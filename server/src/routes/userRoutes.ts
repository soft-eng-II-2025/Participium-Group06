// src/routes/userRoutes.ts

import { Router, Response } from 'express';
import { validateDto } from "../middlewares/validationMiddleware";
import { CreateReportRequestDTO } from "../models/DTOs/CreateReportRequestDTO";
import * as userController from "../controllers/userController";
import * as reportController from "../controllers/reportController";
import multer from 'multer';
import path from 'path'; // Importa path
import { Request } from 'express';
import express from 'express';
import { requireAuth, requireUser } from '../middlewares/authMiddleware';
import { UpdateUserRequestDTO } from "../models/DTOs/UpdateUserRequestDTO";

export const router = Router();


// --- CONFIGURAZIONE MULTER PER UPLOAD IN LOCALE ---
// Crea la cartella 'uploads' se non esiste
import fs from 'fs';
import { StatusType } from '../models/StatusType';
import { MunicipalityOfficerResponseDTO } from '../models/DTOs/MunicipalityOfficerResponseDTO';
const uploadDir = path.join(__dirname, '../uploads'); // Cartella dove salvare le immagini
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurazione di Multer per salvare i file su disco
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Specifica la directory di destinazione
    },
    filename: (req, file, cb) => {
        // Genera un nome di file unico usando il timestamp e il nome originale
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });
// --- FINE CONFIGURAZIONE MULTER ---

// Adapter: accetta anche il vecchio formato { user: { userId }, category: { id } } (rimane invariato)
async function adaptCreateReportBody(body: any): Promise<CreateReportRequestDTO> {
    const userId = await userController.getUserIdByUsername(body.user?.username);
    const categoryId = body?.categoryId ?? body?.category?.id;
    return {
        longitude: Number(body.longitude),
        latitude: Number(body.latitude),
        title: String(body.title),
        description: String(body.description),
        userId: Number(userId),
        categoryId: Number(categoryId),
        officer: body.officer,
        photos: Array.isArray(body.photos) ? body.photos.map(String) : [],
    };
}

// Rotta per la creazione di un report (invariata)
router.post('/reports', requireUser, async (req: Request, res: Response) => {

    const requestBodyWithUserId = { ...req.body };
    console.log('Body:', req.body);


    const adapted = await adaptCreateReportBody(requestBodyWithUserId);
    console.log('Adapted Body:', adapted);
    adapted.officer = {
    username: 'temp',
    email: 'temp@x.com',
    first_name: 'Temp',
    last_name: 'User',
    role: 'TempRole'
    } as MunicipalityOfficerResponseDTO;

    req.body = adapted;
    console.log('adapted with officer:', req.body);
    return validateDto(CreateReportRequestDTO)(req, res, async () => {
        console.log('Validated Body:', req.body);
        const newReport = await reportController.addReport(req.body);
        console.log('New Report:', newReport);
        res.status(201).json(newReport);
    });
});

// Endpoint per l'upload delle immagini dei report
router.post('/reports/images/upload', requireUser, upload.array('images', 3), async (req: Request, res: Response) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
    }

    try {
        // Quando si usa diskStorage, i file vengono già salvati sul disco.
        // req.files contiene ora un array di Multer.File con il path locale.
        const files = req.files as Express.Multer.File[];

        // Passiamo i percorsi relativi o i nomi dei file al controller per salvarli nel DB.
        const imageUrls = files.map(file => `/uploads/${path.basename(file.path!)}`); // Esempio: /uploads/1678888888888-image.jpg

        // Non è necessario chiamare userController.uploadReportImages qui in questo scenario.
        // La logica di salvare gli URL nel DB avverrà in userController.addReport.
        // Questo endpoint risponde semplicemente con gli URL che il frontend userà.
        res.status(200).json({ urls: imageUrls });

    } catch (error: any) {
        console.error("Error during image upload:", error);
        res.status(error.status || 500).json({ message: error.message || 'Failed to upload images.' });
    }
});

// Rotta per servire i file statici (immagini caricate)
// Questo è FONDAMENTALE per rendere le immagini accessibili via URL
router.use('/uploads', express.static(uploadDir));


// Rotta per le categorie (invariata)
router.get('/reports/categories', requireAuth, async (req, res: Response) => {
    const categories = await userController.getAllCategories();
    res.status(200).json(categories);
});



// Update profilo utente
router.put(
    "/users/:id",
    requireUser,
    validateDto(UpdateUserRequestDTO),
    async (req: Request, res: Response) => {
        try {
            const userId = Number(req.params.id);

            // opzionale: se vuoi impedire a un utente di aggiornare profili altrui,
            // confronta userId con quello nel token/sessione qui.

            const updatedUser = await userController.updateUserProfile(
                userId,
                req.body as UpdateUserRequestDTO
            );

            res.status(200).json(updatedUser);
        } catch (error: any) {
            console.error("Error updating user profile:", error);
            res
                .status(error.status || 500)
                .json({ message: error.message || "Failed to update user profile." });
        }
    }
);
