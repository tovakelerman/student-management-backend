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

import { 
  validateEnrollmentIdBody, 
  validateEnrollmentsExists 
} from '../middlewares/enrollmentMiddleware.js';

const router = express.Router();

// נתיבים מיוחדים לפי סטודנט או קורס
router.get('/student/:studentId', getEnrollmentsByStudent); 
router.get('/course/:courseId', getEnrollmentsByCourse);

// נתיבים כלליים
router.get('/', getAllEnrollments);
router.post('/', validateEnrollmentIdBody, createEnrollment);

// נתיבים מבוססים על ID עם שילוב המילדוורים
router.get('/:id', validateEnrollmentsExists, getEnrollmentById);
router.put('/:id', validateEnrollmentsExists, validateEnrollmentIdBody, updateEnrollment);
router.delete('/:id', validateEnrollmentsExists, deleteEnrollment);

export default router;