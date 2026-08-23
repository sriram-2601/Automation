import express from 'express';
import * as executionController from '../controllers/executionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all execution routes
router.use(protect);

router.get('/', executionController.listExecutions);
router.get('/:id', executionController.getById);
router.get('/:id/timeline', executionController.getTimeline);

router.post('/:id/pause', executionController.pause);
router.post('/:id/resume', executionController.resume);
router.post('/:id/cancel', executionController.cancel);

export default router;
