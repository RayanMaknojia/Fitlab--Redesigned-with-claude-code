import express from 'express'
import { getAllUsers, registerUser, loginUser, logoutUser, getCurrentUser } from '../controllers/authController'
import { requireAuth } from '../middleware/requireAuth'
import { requireAdmin } from '../middleware/requireAdmin'

export const authRouter = express.Router();

authRouter.get("/users", requireAuth, requireAdmin, getAllUsers);
authRouter.post('/auth/register', registerUser);
authRouter.post('/auth/login', loginUser);
authRouter.post('/auth/logout', logoutUser);
authRouter.get('/auth/me', requireAuth, getCurrentUser);