import chalk from 'chalk';
import * as studentsService from '../services/studentsService.js';

// קבלת כל הסטודנטים
export const getAllStudents = (req, res, next) => {
    try {
        console.log(chalk.blue('\n👥 Fetching all students data...'));
        const students = studentsService.fetchAllStudents();
        res.json(students);
    } catch (err) {
        next(err);
    }
};

// קבלת סטודנט לפי מזהה
export const getStudentById = (req, res, next) => {
    try {
        console.log(chalk.green(`🔍 Student ID ${req.student.id} found`));
        res.json(req.student);
    } catch (err) {
        next(err);
    }
};

// יצירת סטודנט חדש 
export const createStudent = (req, res, next) => {
    try {
// 1. קודם מחלצים את השדות מתוך גוף הבקשה
        const { name, email } = req.body; 

        // 2. עכשיו מעבירים אותם לסרוויס
        const newStudent = studentsService.addStudent(name, email);

        console.log(chalk.green(`🎓 Student enrollmented: ${newStudent.name} (ID: ${newStudent.id})`));
        res.status(201).json(newStudent);
    } catch (err) {
        next(err);
    }
};

// עדכון סטודנט קיים 
export const updateStudent = (req, res, next) => {
    try {
          const { name, email } = req.body; 

        // 2. עכשיו מעבירים אותם לסרוויס
        const updatedStudent = studentsService.editStudent(req.student.id, name, email);

        console.log(chalk.cyan(`📝 Student ID ${req.student.id} Updated Successfully`));
        res.json(updatedStudent);
    } catch (err) {
        next(err);
    }
};

// מחיקת סטודנט
export const deleteStudent = (req, res, next) => {
    try {
        studentsService.removeStudent(req.student.id);
        
        console.log(chalk.red(`🗑️ Student ID ${req.student.id} Removed from system`));
        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        next(err);
    }
};