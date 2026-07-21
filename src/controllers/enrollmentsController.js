import * as enrollmentsService from '../services/enrollmentsService.js';
import chalk from 'chalk';

// קבלת כל הרישומים הגולמיים
export const getAllEnrollments = (req, res, next) => {
    try {
        console.log(chalk.blue('\n📋 Fetching all enrollments...'));
        const data = enrollmentsService.fetchAllEnrollments();
        res.json(data);
    } catch (err) {
        next(err);
    }
};

// קבלת רישום בודד לפי מזהה
export const getEnrollmentById = (req, res, next) => {
    try {
        // המילדוור כבר מצא את הרישום ושמר אותו ב-req.enrollment
        console.log(chalk.green(`🔍 Enrollment ID ${req.enrollment.id} found`));
        res.json(req.enrollment);
    } catch (err) {
        next(err);
    }
};

// קבלת כל הקורסים של סטודנט מסוים עם פרטי הקורס המלאים
export const getEnrollmentsByStudent = (req, res, next) => {
    try {
        const studentId = parseInt(req.params.studentId);
        console.log(chalk.magenta(`\n🔍 Fetching full course list for Student ID: ${studentId}`));
        
        const result = enrollmentsService.fetchCoursesByStudentId(studentId);
        
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }
        
        res.json(result.data);
    } catch (err) {
        next(err);
    }
};

// קבלת כל הסטודנטים הרשומים לקורס מסוים עם פרטיהם המלאים
export const getEnrollmentsByCourse = (req, res, next) => {
    try {
        const courseId = parseInt(req.params.courseId);
        console.log(chalk.magenta(`\n🔍 Fetching student roster for Course ID: ${courseId}`));
        
        const result = enrollmentsService.fetchStudentsByCourseId(courseId);
        
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }
        
        res.json(result.data);
    } catch (err) {
        next(err);
    }
};

// יצירת רישום חדש
export const createEnrollment = (req, res, next) => {
    try {
        const { studentId, courseId } = req.body;

        const result = enrollmentsService.addEnrollment(parseInt(studentId), parseInt(courseId));

        if (result.error) {
            return res.status(result.status).json({ message: result.message });
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
        const { studentId, courseId } = req.body;

        // המילדוורים וידאו שהרישום קיים ושהשדות החדשים בגוף הבקשה תקינים
        const result = enrollmentsService.editEnrollment(req.enrollment.id, parseInt(studentId), parseInt(courseId));

        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        console.log(chalk.cyan(`✏️ Enrollment ID ${req.enrollment.id} Updated Successfully`));
        res.json(result.data);
    } catch (err) {
        next(err);
    }
};

// מחיקת רישום
export const deleteEnrollment = (req, res, next) => {
    try {
        // המילדוור וידא שהרישום קיים בטרם הגעתו לבקר
        enrollmentsService.removeEnrollment(req.enrollment.id);

        console.log(chalk.red(`🗑️ Enrollment ID ${req.enrollment.id} was canceled/deleted`));
        res.json({ message: "Enrollment deleted successfully" });
    } catch (err) {
        next(err);
    }
};