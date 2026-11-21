import { Router } from 'express';
import {
    getAllJobs,
    getJobById,
    createJob,
    updateJob,
    updateJobStatus,
    deleteJob,
} from '../controllers/job.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getAllJobs);
router.get('/:id', getJobById);

router.post('/', authenticateToken, authorizeRoles('HR'), createJob);
router.put('/:id', authenticateToken, authorizeRoles('HR'), updateJob);
router.patch('/:id/status', authenticateToken, authorizeRoles('HR'), updateJobStatus);
router.delete('/:id', authenticateToken, authorizeRoles('HR'), deleteJob);

export default router;
