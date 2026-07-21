import express from 'express';
import { 
  getAllCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse
} from '../controllers/courseController.js';


import { validateCourseExists,validateCourseBody } from '../middlewares/courseMiddleware.js';

const router = express.Router();

router.get('/', getAllCourses);
router.post('/', validateCourseBody, createCourse);

router.get('/:id', validateCourseExists, getCourseById);
router.put('/:id', validateCourseExists, validateCourseBody, updateCourse);
router.delete('/:id', validateCourseExists, deleteCourse);

export default router;