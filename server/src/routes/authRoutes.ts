import {Router, Response} from 'express';
import {validateDto} from "../middlewares/validationMiddleware";
import {UserDTO} from "../DTOs/UserDTO";
import {LoginDTO} from "../DTOs/LoginDTO";
// TODO: add import userController
// TODO: authController

export const router = Router();

// POST /api/register
router.post('/register', validateDto(UserDTO), async (req, res: Response, next) => {
    // TODO: remove comment
    /*
    const newUser = await userController.createUser(req.body);
    res.status(201).json(newUser);
     */

});

router.post('/login', validateDto(LoginDTO), async (req, res: Response, next) => {

    // TODO: remove comment
    /*
    const loggedUser = await authController.login(req.body);
    res.status(201).json(loggedUser);

     */
})
