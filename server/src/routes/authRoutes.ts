import {Router, Response} from 'express';
import {validateDto} from "../middlewares/validationMiddleware";
import {UserDTO} from "../models/DTOs/UserDTO";
import {LoginDTO} from "../models/DTOs/LoginDTO";
import * as userController from "../controllers/userController";
import * as authController from "../controllers/authController";

export const router = Router();

// POST /api/register
router.post('/register', validateDto(UserDTO), async (req, res: Response, next) => {

    
    const newUser = await userController.createUser(req.body);
    res.status(201).json(newUser);
     

});

router.post('/login', validateDto(LoginDTO), async (req, res: Response, next) => {

    // TODO: remove comment
    /*
    const loggedUser = await authController.login(req.body); Still needs to be implemented
    res.status(201).json(loggedUser);

     */
})
