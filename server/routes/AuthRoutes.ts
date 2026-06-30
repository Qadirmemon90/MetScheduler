import { Router } from "express";
import { loginUser, registerUser } from "../controller/AuthController.js";


const authRouter = Router();

authRouter.post('/register', registerUser)
authRouter.post('/login', loginUser)

export default authRouter;