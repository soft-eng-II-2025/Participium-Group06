import { Router, Response } from 'express';
import { validateDto } from "../middlewares/validationMiddleware";
import { CreateUserRequestDTO } from "../models/DTOs/CreateUserRequestDTO";
import { LoginRequestDTO } from "../models/DTOs/LoginRequestDTO";
import * as userController from "../controllers/userController";
import * as adminController from "../controllers/adminController";

export const router = Router();



// POST /api/register
router.post('/register', validateDto(CreateUserRequestDTO), async (req, res: Response, next) => {
    const newUser = await userController.createUser(req.body); // CreateUserRequest -> UserResponse
    res.status(201).json(newUser);
});




router.post('/login', validateDto(LoginRequestDTO), async (req, res: Response, next) => {
    try {
        const user = await userController.loginUser(req.body);
        return res.status(200).json(user);
    } catch {
        try {
            const officer = await adminController.loginOfficer(req.body);
            return res.status(200).json(officer);
        } catch {
            // errore unico per evitare enumeration
            return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        }
    }
});
