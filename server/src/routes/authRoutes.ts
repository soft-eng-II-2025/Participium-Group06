import { Router, Request, Response, NextFunction } from 'express';
import { validateDto } from "../middlewares/validationMiddleware";
import { CreateUserRequestDTO } from "../models/DTOs/CreateUserRequestDTO";
import { LoginRequestDTO } from "../models/DTOs/LoginRequestDTO";
import { UserResponseDTO } from "../models/DTOs/UserResponseDTO";
import { MunicipalityOfficerResponseDTO } from "../models/DTOs/MunicipalityOfficerResponseDTO";
import * as userController from "../controllers/userController";
import passport from 'passport';
import { requireAuth } from "../middlewares/authMiddleware";
import { VerificationService } from '../services/verificationService';
import { AppDataSource } from '../data-source';
import { VerificationCodeDTO } from '../models/DTOs/VerificationCodeDTO';
//import * as authController from "../controllers/authController";

export const router = Router();

const verificationService = new VerificationService(AppDataSource);

// POST /register
router.post('/register', validateDto(CreateUserRequestDTO), async (req, res, next) => {
    try {
        const newUser = await userController.createUser(req.body);
        console.log(newUser);
        await verificationService.generateAndSend(newUser);

        req.logIn(newUser, (err) => {
            if (err) return next(err);
            return res.status(201).json({
                ...newUser,
                verification_sent: true
            });
        });

    } catch (err) {
        next(err);
    }
});

// POST /verify
router.post('/verify', validateDto(VerificationCodeDTO), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = req.body;

        if (!dto.username || !dto.code) {
            return res.status(400).json({ error: "MISSING_FIELDS" });
        }

        await verificationService.verifyCode(dto.username, dto.code);
        return res.status(200).json({ verified: true });

    } catch (err: any) {
        const status = err.status ?? 400;
        return res.status(status).json({ error: err.message });
    }
});

router.post('/login', validateDto(LoginRequestDTO), (req: Request, res: Response, next: NextFunction) => {
    // passport.ts sets up the 'local' strategy and the login logic
    passport.authenticate('local', (err: any, user: UserResponseDTO | MunicipalityOfficerResponseDTO | false, info: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info?.message ?? 'Invalid credentials' });
        (req as any).logIn(user, (loginErr: any) => {
            if (loginErr) return next(loginErr);
            // user is serialized into the session; return safe user dto
            return res.status(200).json(user);
        });
    })(req, res, next);
});

router.post('/logout', requireAuth, (req, res) => {
    req.logout(() => {
        req.session?.destroy(() => {
            res.clearCookie('connect.sid');
            res.json({ ok: true });
        });
    });
});

router.get('/session', requireAuth,(req, res) => {
    try {
        // req.user is populated by passport.deserializeUser when authenticated
        return res.status(200).json(req.user ?? null);
    } catch (err) {
        return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }
});
