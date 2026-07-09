import express from 'express'
import { getAllUsers, registerUser, loginUser, logoutUser } from '../controllers/authController'

export const authRouter = express.Router();

authRouter.get("/users", getAllUsers);
authRouter.post('/auth/register', registerUser);
authRouter.post('/auth/login', loginUser);
authRouter.post('/auth/logout', logoutUser);