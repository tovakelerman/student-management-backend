import chalk from 'chalk';
import * as studentsService from '../services/studentsService.js';
import { BadRequestError } from '../utils/HttpError.js';
import { requireText, requirePositiveInt } from '../utils/validate.js';

// ============================================================
//  Student Middleware — אימות קלט לפני ה-Controller
// ============================================================
// המבנה זהה ל-courseMiddleware: שרשרת .then() / .catch(next),
// וכל התשובות בפורמט { error, message }.

// בודקת את גוף הבקשה (name + email).
// email חייב להיות מחרוזת עם מבנה בסיסי של כתובת דוא"ל.
export const validateStudentBody = (req, res, next) => {
  Promise.resolve()
    .then(() => {
      const name = requireText(req.body?.name, 'name');
      const email = requireText(req.body?.email, 'email');

      // בדיקה בסיסית בלבד: משהו@משהו.משהו — בלי רווחים.
      // בדיקה מלאה של חוקיות דוא"ל שייכת לאימות מול שרת דואר, לא כאן.
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new BadRequestError('email must be a valid email address');
      }

      req.body = { name, email };
    })
    .then(() => next())
    .catch((err) => {
      console.log(chalk.yellow(`⚠️ [Invalid input] Student at ${req.originalUrl}: ${err.message}`));
      next(err);
    });
};

// בודקת שה-ID בנתיב הוא מספר שלם חיובי ושהסטודנט קיים.
export const validateStudentExists = (req, res, next) => {
  let studentId;

  Promise.resolve()
    .then(() => {
      studentId = requirePositiveInt(req.params.id, 'Student ID');
    })
    .then(() => studentsService.fetchStudentById(studentId))
    .then((student) => {
      req.student = student;
      console.log(chalk.green(`🎓 ✅ [Found Student] ${student.name} (${student.email})`));
      next();
    })
    .catch((err) => {
      if (err.status === 400) {
        console.log(chalk.red(`❌ [Invalid ID] ${req.originalUrl}`));
      } else if (err.status === 404) {
        console.log(chalk.red(`🎓 ❌ [Not Found] Student with ID ${studentId} does not exist in the system`));
      }
      next(err);
    });
};
