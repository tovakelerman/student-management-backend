import chalk from 'chalk';
import * as enrollmentsService from '../services/enrollmentsService.js';

// מילדוור לבדיקת תקינות השדות בגוף הבקשה
export const validateEnrollmentIdBody = (req, res, next) => {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
        console.log(chalk.yellow(`⚠️ [missing input] Attempted enrollmention without studentId or courseId`));
        return res.status(400).json({ message: "Student ID and Course ID are required" });
    }

    next();
};

// מילדוור לבדיקת קיום הרישום לפי ID
export const validateEnrollmentsExists = (req, res, next) => {
    const enrollmentId = parseInt(req.params.id);

    if (isNaN(enrollmentId)) {
        console.log(chalk.red(`❌ [Invalid ID] Received a non-numeric enrollmention ID: ${req.originalUrl}`));
        return res.status(400).json({ message: "Invalid enrollmention ID format" });
    }

    const foundEnrollment = enrollmentsService.fetchEnrollmentById(enrollmentId);

    if (!foundEnrollment) {
        console.log(chalk.red(`📝 ❌ [Not Found] enrollmention with ID ${enrollmentId} does not exist in the system`));
        return res.status(404).json({ message: `enrollmention ID ${enrollmentId} not found` });
    }

    console.log(chalk.green(`📝 ✅ [enrollmention Found] ID ${foundEnrollment.id} (Student: ${foundEnrollment.studentId}, Course: ${foundEnrollment.courseId})`));

    req.enrollment = foundEnrollment;
    next();
};