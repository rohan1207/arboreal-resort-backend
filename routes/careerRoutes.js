import express from 'express';
import {
  getOpenPositions,
  getAllPositions,
  createPosition,
  updatePosition,
  togglePosition,
  deletePosition,
} from '../controllers/careerController.js';

const router = express.Router();

// Public route
router.get('/open', getOpenPositions);

// Admin routes
router
  .route('/')
  .get(getAllPositions) // list all (admin)
  .post(createPosition); // add new

router
  .route('/:id')
  .put(updatePosition) // update fields
  .delete(deletePosition); // optionally delete

router.put('/:id/toggle', togglePosition); // toggle isOpen

export default router;
