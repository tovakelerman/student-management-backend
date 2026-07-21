import express from 'express';
import { 
  getAllStudents, 
  getStudentById, 
  createStudent, 
  updateStudent, 
  deleteStudent 
} from '../controllers/studentsController.js';

// 🛡️ שלב 1: מייבאים את המילדוור החדש שיושב בתיקיית המילדוורים
import { validateStudentExists,validateStudentBody } from '../middlewares/studentMiddleware.js';

const router = express.Router();

// נתיבים כלליים - נשארים בדיוק אותו הדבר (הם לא מקבלים ID ולכן לא צריכים בדיקה)
router.get('/', getAllStudents);          
router.post('/', validateStudentBody, createStudent);       

// 🛡️ שלב 2: משבצים את המילדוור בנתיבים הספציפיים שדורשים בדיקת קיום
router.get('/:id', validateStudentExists, getStudentById);     
router.put('/:id', validateStudentExists, validateStudentBody, updateStudent);
router.delete('/:id', validateStudentExists, deleteStudent);   

export default router;