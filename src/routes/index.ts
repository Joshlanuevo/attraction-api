import express from 'express';
import eventPackagesRoutes from './attractionsRoutes';
import globalTixAuthRoutes from './globalTixAuthRoutes';

const router = express.Router();

router.use('/event_packages', eventPackagesRoutes);
router.use('/auth', globalTixAuthRoutes);

export default router;