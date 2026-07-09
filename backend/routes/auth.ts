import express from 'express'
import { getAllUsers, registerUser, loginUser, logoutUser, getCurrentUser } from '../controllers/authController'
import { requireAuth } from '../middleware/requireAuth'

export const authRouter = express.Router();

authRouter.get("/users", getAllUsers);
authRouter.post('/auth/register', registerUser);
authRouter.post('/auth/login', loginUser);
authRouter.post('/auth/logout', logoutUser);
authRouter.get('/auth/me', requireAuth, getCurrentUser);