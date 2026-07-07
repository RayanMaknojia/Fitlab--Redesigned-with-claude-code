import express from 'express'
import { registerUser} from '../controllers/authController'

export const authRouter = express.Router();

authRouter.post('/register', registerUser)