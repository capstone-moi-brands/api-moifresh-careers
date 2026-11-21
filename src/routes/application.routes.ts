import { Router } from 'express';
import {
    applyJob,
    getAllApplications,
    getMyApplications,
    getApplicationsByJob,
    getApplicationById,
    updateApplicationStatus,
} from '../controllers/application.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { uploadCV } from '../middlewares/upload.middleware';

const router = Router();

router.get('/', authenticateToken, authorizeRoles('HR'), getAllApplications);
router.post('/', authenticateToken, authorizeRoles('APPLICANT'), uploadCV.single('cv'), applyJob);
router.get('/my', authenticateToken, authorizeRoles('APPLICANT'), getMyApplications);
router.get('/me', authenticateToken, authorizeRoles('APPLICANT'), getMyApplications);
router.get('/job/:jobId', authenticateToken, authorizeRoles('HR'), getApplicationsByJob);
router.get('/:id', authenticateToken, getApplicationById);
router.patch('/:id/status', authenticateToken, authorizeRoles('HR'), updateApplicationStatus);

export default router;
