import express from 'express';
import chalk from 'chalk';

import studentsRoutes from './routes/studentsRoutes.js';
import coursesRoutes from './routes/courseRoutes.js';
import enrollmentsRoutes from './routes/enrollmentsRoutes.js';

import { verifyAuthKey } from './middlewares/verifyMiddleware.js';
import { BadRequestError } from './utils/HttpError.js';

// ============================================================
//  app — בניית ה-Express app (בלי הפעלת שרת)
// ============================================================
// index.js מייבא את app ומפעיל אותו עם listen().
// ההפרדה הזו מאפשרת לאפליקציה להיות מיובאת בלי להפעיל פורט.

const app = express();
app.use(express.json());

// גוף בקשה שאינו JSON תקין (למשל "{" חסר) היה מגיע כ-500,
// כי express.json זורק SyntaxError שקוראים לו status 400.
// כאן אם השגיאה מגיעה ממפרסר ה-JSON — עוברים ל-400 עם הודעה ברורה.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return next(new BadRequestError('Request body is not valid JSON'));
  }
  next(err);
});

app.use('/students', verifyAuthKey, studentsRoutes);
app.use('/courses', verifyAuthKey, coursesRoutes);
app.use('/enrollments', verifyAuthKey, enrollmentsRoutes);

// =========================================================
// נתיב הבית הכללי (GET)
// =========================================================
app.get('/', (req, res) => {
  console.log(chalk.blue('\n🏠 Notice: User requested the root path (/)'));
  res.json({
    status: "success",
    message: "Server is up and running successfully",
    description: "This API server provides detailed management data for school courses, students, and enrollments.",
    version: "1.0.0"
  });
});

// =========================================================
//  טיפול בנתיבים לא קיימים (404)
// =========================================================
app.use((req, res) => {
  console.log(chalk.yellow(`\n⚠️ Warning: Someone tried to visit a broken path: ${req.url}`));
  res.status(404).json({
    error: "Not Found",
    message: `The requested path '${req.url}' does not exist on this server.`
  });
});

// =========================================================
// רשת ביטחון גלובלית לשגיאות שרת פנימיות (500)
// =========================================================
app.use((err, req, res, next) => {
  // כל שגיאה "עסקית" (NotFoundError / BadRequestError / ConflictError)
  // נושאת status משלה. כל דבר אחר = תקלת שרת אמיתית → 500.
  const status = err.status ?? 500;

  if (status >= 500) {
    // err.code הוא קוד השגיאה של Node (ENOENT/EACCES/EBUSY/...) —
    // הוא נדפס ללוג בלבד, ולעולם לא נשלח ללקוח.
    const code = err.code ? chalk.gray(` [${err.code}]`) : '';
    console.error(chalk.red(`💥 Internal Server Error${code}: ${err.message}`));
    console.error(chalk.gray(`   ↳ ${req.method} ${req.originalUrl}`));
  }

  // השדה error מכיל את שם סוג השגיאה (NotFoundError וכו') לתאימות לאחור.
  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : err.name,
    message: status === 500 ? "Something went wrong on the server." : err.message
  });
});

export default app;
