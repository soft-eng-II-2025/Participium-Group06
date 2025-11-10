import {Router, Response} from 'express';
import {validateDto} from "../middlewares/validationMiddleware";
import {UserDTO} from "../models/DTOs/UserDTO";
import {LoginDTO} from "../models/DTOs/LoginDTO";
import * as userController from "../controllers/userController";
import * as adminController from "../controllers/adminController";
//import * as authController from "../controllers/authController";

export const router = Router();

// POST /api/register
router.post('/register', validateDto(UserDTO), async (req, res: Response, next) => {

    
    const newUser = await userController.createUser(req.body);
    res.status(201).json(newUser);
     

});

router.post('/login', validateDto(LoginDTO), async (req, res: Response, next) => {
    try {
        // First try regular user login
        const loggedUser = await userController.login(req.body);
        return res.status(200).json(loggedUser);
    } catch (errUser: any) {
        // If the user exists but password is wrong -> return immediately with 401
        if (errUser?.name === 'WRONG_PASSWORD') {
            return res.status(401).json({ error: "wrong password" });
        }
        if (errUser?.name === 'PASSWORD_REQUIRED') {
            return res.status(400).json({ error: "Password is required" });
        }

        // If user not found, try municipality officer
        if (errUser?.name === 'USER_NOT_FOUND') {
            try {
                const loggedOfficer = await adminController.login(req.body);
                return res.status(200).json(loggedOfficer);
            } catch (errOfficer: any) {
                if (errOfficer?.name === 'WRONG_PASSWORD') {
                    return res.status(401).json({ error: "wrong password" });
                }
                if (errOfficer?.name === 'PASSWORD_REQUIRED') {
                    return res.status(400).json({ error: "Password is required" });
                }
                if (errOfficer?.name === 'OFFICER_NOT_FOUND') {
                    // Neither user nor officer found
                    return res.status(404).json({ error: "This username do not corresponds to any account" });
                }
                return next(errOfficer);
            }
        }

        return next(errUser);
    }
});