import { Router } from 'express';
import { screenApplication, getScreeningResult } from '../controllers/screening.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/:applicationId', authenticateToken, authorizeRoles('HR'), screenApplication);
router.get('/:applicationId', authenticateToken, getScreeningResult);

export default router;
