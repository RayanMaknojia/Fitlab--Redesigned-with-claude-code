import express from 'express'
import { getAllUsers, registerUser} from '../controllers/authController'

export const authRouter = express.Router();

authRouter.get("/users", getAllUsers);
authRouter.post('/auth/register', registerUser);