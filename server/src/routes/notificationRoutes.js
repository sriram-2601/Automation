import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', notificationController.listNotifications);
router.put('/:id', notificationController.markRead);
router.post('/read-all', notificationController.markAllRead);

export default router;
