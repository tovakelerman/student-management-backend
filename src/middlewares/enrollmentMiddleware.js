import chalk from 'chalk';
import * as enrollmentsService from '../services/enrollmentsService.js';
import { requirePositiveInt } from '../utils/validate.js';

// ============================================================
//  Enrollment Middleware — אימות קלט לפני ה-Controller
// ============================================================
// שני המילדוורים בשרשרת .then() / .catch(next) →
// המטפל הגלובלי → { error, message }.

// בודקת את גוף הבקשה: studentId ו-courseId חייבים להיות
// מספרים שלמים חיוביים. המזהה מנורמל ל-number, כך שה-Controller
// לא צריך כרגע parseInt נוסף.
export const validateEnrollmentIdBody = (req, res, next) => {
  Promise.resolve()
    .then(() => {
      const studentId = requirePositiveInt(req.body?.studentId, 'studentId');
      const courseId = requirePositiveInt(req.body?.courseId, 'courseId');
      req.body = { studentId, courseId };
    })
    .then(() => next())
    .catch((err) => {
      console.log(chalk.yellow(`⚠️ [Invalid input] Enrollment at ${req.originalUrl}: ${err.message}`));
      next(err);
    });
};

// בודקת שה-ID בנתיב הוא מספר שלם חיובי ושהרישום קיים.
export const validateEnrollmentsExists = (req, res, next) => {
  let enrollmentId;

  Promise.resolve()
    .then(() => {
      enrollmentId = requirePositiveInt(req.params.id, 'Enrollment ID');
    })
    .then(() => enrollmentsService.fetchEnrollmentById(enrollmentId))
    .then((enrollment) => {
      req.enrollment = enrollment;
      console.log(chalk.green(`📝 ✅ [Enrollment Found] ID ${enrollment.id} (Student: ${enrollment.studentId}, Course: ${enrollment.courseId})`));
      next();
    })
    .catch((err) => {
      if (err.status === 400) {
        console.log(chalk.red(`❌ [Invalid ID] ${req.originalUrl}`));
      } else if (err.status === 404) {
        console.log(chalk.red(`📝 ❌ [Not Found] Enrollment with ID ${enrollmentId} does not exist in the system`));
      }
      next(err);
    });
};
