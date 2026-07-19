import * as enrollmentsService from '../services/enrollmentsService.js';
import chalk from 'chalk';

// 🛠️ פונקצייה לטיפול בשגיאות
const sendError = (res, status, message) => {
    console.log(chalk.red(`❌ Error: ${message}`));
    return res.status(status).json({ message });
};

//  קבלת כל הרישומים הגולמיים
export const getAllEnrollments = (req, res, next) => {
    try {
        console.log(chalk.blue('\n📋 Fetching all enrollments...'));
        const data = enrollmentsService.fetchAllEnrollments();
        res.json(data);
    } catch (err) {
        next(err);
    }
};

//  קבלת רישום בודד לפי מזהה
export const getEnrollmentById = (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const enrollment = enrollmentsService.fetchEnrollmentById(id);
        
        if (!enrollment) {
            return sendError(res, 404, `Enrollment ID ${id} not found`);
        }
        
        res.json(enrollment);
    } catch (err) {
        next(err);
    }
};

//  קבלת כל הקורסים של סטודנט מסוים עם פרטי הקורס המלאים
export const getEnrollmentsByStudent = (req, res, next) => {
    try {
        const studentId = parseInt(req.params.studentId);
        console.log(chalk.magenta(`\n🔍 Fetching full course list for Student ID: ${studentId}`));
        
        const result = enrollmentsService.fetchCoursesByStudentId(studentId);
        
        if (result.error) {
            return sendError(res, result.status, result.message);
        }
        
        res.json(result.data);
    } catch (err) {
        next(err);
    }
};

//  קבלת כל הסטודנטים הרשומים לקורס מסוים עם פרטיהם המלאים
export const getEnrollmentsByCourse = (req, res, next) => {
    try {
        const courseId = parseInt(req.params.courseId);
        console.log(chalk.magenta(`\n🔍 Fetching student roster for Course ID: ${courseId}`));
        
        const result = enrollmentsService.fetchStudentsByCourseId(courseId);
        
        if (result.error) {
            return sendError(res, result.status, result.message);
        }
        
        res.json(result.data);
    } catch (err) {
        next(err);
    }
};

//  יצירת רישום חדש
export const createEnrollment = (req, res, next) => {
    try {
        const { studentId, courseId } = req.body;

        if (!studentId || !courseId) {
            return sendError(res, 400, "studentId and courseId are required");
        }

        const result = enrollmentsService.addEnrollment(parseInt(studentId), parseInt(courseId));

        if (result.error) {
            return sendError(res, result.status, result.message);
        }

        console.log(chalk.green(`🔗 Successfully Created Enrollment ID: ${result.data.id}`));
        res.status(201).json(result.data);
    } catch (err) {
        next(err);
    }
};

// עדכון רישום קיים
export const updateEnrollment = (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const { studentId, courseId } = req.body;

        if (!studentId || !courseId) {
            return sendError(res, 400, "studentId and courseId are required for update");
        }

        const result = enrollmentsService.editEnrollment(id, parseInt(studentId), parseInt(courseId));

        if (result.error) {
            return sendError(res, result.status, result.message);
        }

        console.log(chalk.cyan(`✏️ Enrollment ID ${id} Updated Successfully`));
        res.json(result.data);
    } catch (err) {
        next(err);
    }
};

// מחיקת רישום
export const deleteEnrollment = (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const isDeleted = enrollmentsService.removeEnrollment(id);

        if (!isDeleted) {
            return sendError(res, 404, `Enrollment ID ${id} not found for deletion`);
        }

        console.log(chalk.red(`🗑️ Enrollment ID ${id} was canceled/deleted`));
        res.json({ message: "Enrollment deleted successfully" });
    } catch (err) {
        next(err);
    }
};