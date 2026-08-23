import express from 'express';
import { body } from 'express-validator';
import * as workflowController from '../controllers/workflowController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all workflow routes
router.use(protect);

// Validation rules
const workflowCreateValidation = [
  body('name').notEmpty().withMessage('Workflow name is required').trim(),
  body('description').optional().trim(),
  body('triggerConfig').optional().isObject().withMessage('triggerConfig must be an object'),
  body('nodes').optional().isArray().withMessage('nodes must be an array'),
  body('edges').optional().isArray().withMessage('edges must be an array'),
  body('tags').optional().isArray().withMessage('tags must be an array')
];

const workflowUpdateValidation = [
  body('name').optional().notEmpty().withMessage('Workflow name cannot be empty').trim(),
  body('description').optional().trim(),
  body('triggerConfig').optional().isObject().withMessage('triggerConfig must be an object'),
  body('nodes').optional().isArray().withMessage('nodes must be an array'),
  body('edges').optional().isArray().withMessage('edges must be an array'),
  body('tags').optional().isArray().withMessage('tags must be an array')
];

router.get('/dashboard', workflowController.getDashboard);
router.get('/', workflowController.listWorkflows);
router.post('/', workflowCreateValidation, workflowController.create);
router.post('/generate', [body('prompt').notEmpty().withMessage('Prompt is required').trim()], workflowController.generate);

router.get('/:id', workflowController.getById);
router.put('/:id', workflowUpdateValidation, workflowController.update);
router.delete('/:id', workflowController.remove);

router.post('/:id/duplicate', workflowController.duplicate);
router.post('/:id/execute', workflowController.execute);

export default router;
