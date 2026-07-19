import express from 'express';
import { 
  getAllEnrollments, 
  getEnrollmentById,
  getEnrollmentsByStudent, 
  getEnrollmentsByCourse, 
  createEnrollment, 
  updateEnrollment, 
  deleteEnrollment 
} from '../controllers/enrollmentsController.js';

const router = express.Router();

router.get('/student/:studentId', getEnrollmentsByStudent); 
router.get('/course/:courseId', getEnrollmentsByCourse);

router.get('/', getAllEnrollments);
router.get('/:id', getEnrollmentById);
router.post('/', createEnrollment);
router.put('/:id', updateEnrollment);
router.delete('/:id', deleteEnrollment);

export default router;