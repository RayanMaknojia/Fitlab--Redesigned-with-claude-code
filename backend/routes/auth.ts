import express from 'express'
import { getAllUsers, registerUser, loginUser, logoutUser, getCurrentUser, forgotPassword, resetPassword } from '../controllers/authController'
import { requireAuth } from '../middleware/requireAuth'
import { requireAdmin } from '../middleware/requireAdmin'
import { forgotPasswordRateLimit, resetPasswordRateLimit } from '../middleware/passwordResetRateLimit'

export const authRouter = express.Router();

authRouter.get("/users", requireAuth, requireAdmin, getAllUsers);
authRouter.post('/auth/register', registerUser);
authRouter.post('/auth/login', loginUser);
authRouter.post('/auth/logout', logoutUser);
authRouter.get('/auth/me', requireAuth, getCurrentUser);
authRouter.post('/auth/forgot-password', forgotPasswordRateLimit, forgotPassword);
authRouter.post('/auth/reset-password', resetPasswordRateLimit, resetPassword);