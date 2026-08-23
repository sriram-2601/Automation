import express from 'express';
import * as integrationController from '../controllers/integrationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public OAuth redirect routes
router.get('/oauth/:provider/start', integrationController.oauthStart);
router.get('/oauth/:provider/callback', integrationController.oauthCallback);
router.get('/oauth/error', (req, res) => {
  res.status(400).json({ message: 'OAuth Authentication sequence failed.' });
});

// Protected routes (require Bearer JWT headers)
router.get('/', protect, integrationController.list);
router.get('/status', protect, integrationController.getStatus);
router.post('/', protect, integrationController.setupManual);
router.delete('/:provider', protect, integrationController.remove);

export default router;
