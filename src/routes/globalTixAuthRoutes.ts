import { AuthController } from '../controllers/authController';
import express from 'express';

const router = express.Router();

router.post('/login', AuthController.login);
router.post("/update-password", AuthController.updateUserPassword);

export default router;