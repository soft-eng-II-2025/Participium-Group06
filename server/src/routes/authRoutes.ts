import { Router, Request, Response, NextFunction } from 'express';
import { validateDto } from "../middlewares/validationMiddleware";
import { CreateUserRequestDTO } from "../models/DTOs/CreateUserRequestDTO";
import { LoginRequestDTO } from "../models/DTOs/LoginRequestDTO";
import { UserResponseDTO } from "../models/DTOs/UserResponseDTO";
import { MunicipalityOfficerResponseDTO } from "../models/DTOs/MunicipalityOfficerResponseDTO";
import * as userController from "../controllers/userController";
import passport from 'passport';
import { requireAuth } from "../middlewares/authMiddleware";
//import * as authController from "../controllers/authController";

export const router = Router();

// POST /api/register
router.post('/register', validateDto(CreateUserRequestDTO), async (req, res: Response, next) => {

    /*const newUser = await userController.createUser(req.body);
    req.logIn(newUser, (err) => {
        if (err) return next(err);
        return res.status(201).json(newUser);
    });
    res.status(201).json(newUser);

     */
    try {
        const newUser = await userController.createUser(req.body);

        req.logIn(newUser, (err) => {
            if (err) return next(err);
            return res.status(201).json(newUser);
        });

    } catch (err) {
        next(err);
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
