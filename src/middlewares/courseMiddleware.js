import chalk from 'chalk';
import * as coursesService from '../services/coursesService.js';
import { requireText, requirePositiveInt } from '../utils/validate.js';

// ============================================================
//  Course Middleware — אימות קלט לפני ה-Controller
// ============================================================
// שני המילדוורים בנויים בשרשרת .then() / .catch(next):
//   .then(...)   ← שלב שהצליח
//   .catch(next) ← שגיאה → המטפל הגלובלי ב-app.js
//                  (400 / 404 עם הקוד שלהם, כל השאר → 500)

// בודקת את גוף הבקשה (name + description).
// גם מנרמלת: req.body.name ו-req.body.description מקבלים את
// הערך אחרי trim, כך שנשמר לקובץ בלי רווחים מיותרים בקצוות.
export const validateCourseBody = (req, res, next) => {
  Promise.resolve()
    .then(() => {
      const name = requireText(req.body?.name, 'name');
      const description = requireText(req.body?.description, 'description');
      req.body = { name, description };
    })
    .then(() => next())
    .catch((err) => {
      console.log(chalk.yellow(`⚠️ [Invalid input] Course at ${req.originalUrl}: ${err.message}`));
      next(err);
    });
};

// בודקת שה-ID בנתיב הוא מספר שלם חיובי, ואז שהקורס באמת קיים.
// ID לא תקין ("abc", "1.5", "-3") → 400; קורס חסר → 404.
export const validateCourseExists = (req, res, next) => {
  let courseId;

  Promise.resolve()
    // שלב 1: בדיקת התבנית של ה-ID (סינכרוני — עטוף כדי שהשגיאה תעבור ב-.catch)
    .then(() => {
      courseId = requirePositiveInt(req.params.id, 'Course ID');
    })
    // שלב 2: שליפה אמיתית מהדיסק (await מבפנים, אך מוחזר כ-Promise לשרשרת)
    .then(() => coursesService.fetchCourseById(courseId))
    // שלב 3: הצלחה — שמירת הקורס לבקר והמשך למילדוור/בקר הבא
    .then((course) => {
      req.course = course;
      console.log(chalk.green(`📚 ✅ [Course found] ${course.name}`));
      next();
    })
    // שלב 4: כל שגיאה בשרשרת — לא משנה באיזה שלב — מגיעה לכאן
    .catch((err) => {
      if (err.status === 400) {
        console.log(chalk.red(`❌ [Invalid ID] ${req.originalUrl}`));
      } else if (err.status === 404) {
        console.log(chalk.red(`📚🔍 ❌ [Not Found] Course with ID ${courseId} does not exist in the system`));
      }
      next(err);
    });
};
