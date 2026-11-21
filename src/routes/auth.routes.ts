import { Router } from 'express';
import { register, login, getUserData } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', authenticateToken, getUserData);

export default router;
