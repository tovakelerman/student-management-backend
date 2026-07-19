import chalk from 'chalk';
import * as studentsService from '../services/studentsService.js';

// 🛠️ פונקציית עזר פנימית לעיצוב ושליחת שגיאות
const sendError = (res, status, message) => {
    console.log(chalk.red(`❌ Error: ${message}`));
    return res.status(status).json({ message });
};

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

//  קבלת סטודנט לפי מזהה
export const getStudentById = (req, res, next) => {
    try {
        const studentId = parseInt(req.params.id);
        const foundStudent = studentsService.fetchStudentById(studentId);

        if (!foundStudent) {
            return sendError(res, 404, `Student ID ${studentId} not found`);
        }

        console.log(chalk.green(`🔍 Student ID ${studentId} found`));
        res.json(foundStudent);
    } catch (err) {
        next(err);
    }
};

//  יצירת סטודנט חדש 
export const createStudent = (req, res, next) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return sendError(res, 400, "Name and email are required");
        }

        const newStudent = studentsService.addStudent(name, email);
        
        console.log(chalk.green(`🎓 Student Registered: ${newStudent.name} (ID: ${newStudent.id})`));
        res.status(201).json(newStudent);
    } catch (err) {
        next(err);
    }
};

//  עדכון סטודנט קיים 
export const updateStudent = (req, res, next) => {
    try {
        const studentId = parseInt(req.params.id);
        const { name, email } = req.body;

        if (!name || !email) {
            return sendError(res, 400, "Name and email are required for update");
        }

        const updatedStudent = studentsService.editStudent(studentId, name, email);

        if (!updatedStudent) {
            return sendError(res, 404, `Student ID ${studentId} not found for update`);
        }

        console.log(chalk.cyan(`📝 Student ID ${studentId} Updated Successfully`));
        res.json(updatedStudent);
    } catch (err) {
        next(err);
    }
};

// מחיקת סטודנט
export const deleteStudent = (req, res, next) => {
    try {
        const studentId = parseInt(req.params.id);
        const isDeleted = studentsService.removeStudent(studentId);

        if (!isDeleted) {
            return sendError(res, 404, `Student ID ${studentId} not found for deletion`);
        }

        console.log(chalk.red(`🗑️ Student ID ${studentId} Removed from system`));
        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        next(err);
    }
};