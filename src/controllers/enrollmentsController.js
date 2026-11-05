import * as enrollmentsService from '../services/enrollmentsService.js';
import { requirePositiveInt } from '../utils/validate.js';
import chalk from 'chalk';

// ============================================================
//  Enrollments Controller — .then() / .catch() לכל פונקציה
// ============================================================
// השירות זורק שגיאה עם status מתאים (404 / 409); כל שגיאה
// מועברת ב-.catch(next) אל המטפל הגלובלי ב-app.js.

// קבלת כל הרישומים הגולמיים
export const getAllEnrollments = (req, res, next) => {
  console.log(chalk.blue('\n📋 Fetching all enrollments...'));

  enrollmentsService.fetchAllEnrollments()
    .then((data) => res.json(data))
    .catch(next);
};

// קבלת רישום בודד לפי מזהה
export const getEnrollmentById = (req, res, next) => {
  // המילדוור כבר מצא את הרישום ושמר אותו ב-req.enrollment
  console.log(chalk.green(`🔍 Enrollment ID ${req.enrollment.id} found`));

  Promise.resolve(req.enrollment)
    .then((enrollment) => res.json(enrollment))
    .catch(next);
};

// קבלת כל הקורסים של סטודנט מסוים עם פרטי הקורס המלאים
export const getEnrollmentsByStudent = (req, res, next) => {
  // "abc" / "1.5" / "-3" → 400; סטודנט חסר → 404 (השירות זורק)
  Promise.resolve()
    .then(() => requirePositiveInt(req.params.studentId, 'Student ID'))
    .then((studentId) => {
      console.log(chalk.magenta(`\n🔍 Fetching full course list for Student ID: ${studentId}`));
      return enrollmentsService.fetchCoursesByStudentId(studentId);
    })
    .then((data) => res.json(data))
    .catch(next);
};

// קבלת כל הסטודנטים הרשומים לקורס מסוים עם פרטיהם המלאים
export const getEnrollmentsByCourse = (req, res, next) => {
  Promise.resolve()
    .then(() => requirePositiveInt(req.params.courseId, 'Course ID'))
    .then((courseId) => {
      console.log(chalk.magenta(`\n🔍 Fetching student roster for Course ID: ${courseId}`));
      return enrollmentsService.fetchStudentsByCourseId(courseId);
    })
    .then((data) => res.json(data))
    .catch(next);
};

// יצירת רישום חדש
export const createEnrollment = (req, res, next) => {
  // המילדוור כבר אימת והמיר את הערכים למספרים שלמים
  const { studentId, courseId } = req.body;

  enrollmentsService.addEnrollment(studentId, courseId)
    .then((newEnrollment) => {
      console.log(chalk.green(`🔗 Successfully Created Enrollment ID: ${newEnrollment.id}`));
      res.status(201).json(newEnrollment);
    })
    .catch(next);
};

// עדכון רישום קיים
export const updateEnrollment = (req, res, next) => {
  const { studentId, courseId } = req.body;

  // המילדוורים וידאו שהרישום קיים ושהשדות החדשים בגוף הבקשה תקינים
  enrollmentsService.editEnrollment(req.enrollment.id, studentId, courseId)
    .then((updated) => {
      console.log(chalk.cyan(`✏️ Enrollment ID ${req.enrollment.id} Updated Successfully`));
      res.json(updated);
    })
    .catch(next);
};

// מחיקת רישום
export const deleteEnrollment = (req, res, next) => {
  // המילדוור וידא שהרישום קיים בטרם הגעתו לבקר
  enrollmentsService.removeEnrollment(req.enrollment.id)
    .then(() => {
      console.log(chalk.red(`🗑️ Enrollment ID ${req.enrollment.id} was canceled/deleted`));
      res.json({ message: "Enrollment deleted successfully" });
    })
    .catch(next);
};
