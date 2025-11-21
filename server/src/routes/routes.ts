import {Router} from "express";
import {router as userRouter} from "./userRoutes";
import {router as authRouter} from "./authRoutes";
import {router as adminRouter} from "./adminRoutes";
import {router as reportRouter} from "./reportRoutes";
import {router as techLeadRouter} from "./tech-leadRoutes";
import {router as techRouter} from "./techRoutes";

export const router = Router();

router.use("/users", userRouter);
router.use("", authRouter);
router.use("/admin", adminRouter);
router.use("/reports", reportRouter); 
router.use("/tech-lead", techLeadRouter);
router.use("/tech", techRouter);


