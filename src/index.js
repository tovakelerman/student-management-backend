import 'dotenv/config'; // חייב להיות ראשון: טוען .env לפני שמודולים אחרים קוראים ממנו
import chalk from 'chalk';

import app from './app.js';
import { createStore } from './dataStore.js';

const PORT = process.env.PORT || 3000;

// =========================================================
//  בדיקת מוכנות לפני ההאזנה
// =========================================================
// עדיף להיכשל פעם אחת בעלייה, בשקט, על פני שרת שנראה "רץ"
// וכל בקשה שנייה שלו מחזירה 500.
//
// סגנון: שרשרת `.then()/.catch()` — גם כאן. הבדיקה עוברת על שלושת
// הקבצים בזה אחר זה (ברצף, כמו היה קודם) ומחזירה Promise שמסתיים
// רק כשכולם נקראו בהצלחה, או נדחה עם השגיאה הראשונה.
const checkStartup = () => {
  if (!process.env.SECRET_KEY) {
    // Promise.reject ולא throw: הקורא תמיד מקבל Promise, וכל השגיאות
    // מגיעות לאותו `.catch` ב-startup.
    return Promise.reject(new Error('SECRET_KEY is missing in .env'));
  }

  // readAll בלבד — קובץ חסר ייווצר כ-[] (אותה התנהגות של בקשה רגילה),
  // קובץ פגום או קובץ שלא ניתן לקרוא יזרקו שגיאה → עצירת עלייה.
  return ['courses.json', 'students.json', 'enrollments.json'].reduce(
    (chain, fileName) => chain.then(() => createStore(fileName).readAll()),
    Promise.resolve()
  );
};

const startListening = () => app.listen(PORT, () => {
  console.log(chalk.bold.green(`\n=== Express School API Server is Running on http://localhost:${PORT} ===`));
  console.log(chalk.gray('Available Endpoints:'));
  console.log(chalk.yellow(`- Base Info: http://localhost:${PORT}/`));
  console.log(chalk.yellow(`- Courses List: http://localhost:${PORT}/courses`));
  console.log(chalk.yellow(`- Students List: http://localhost:${PORT}/students`));
  console.log(chalk.yellow(`- Enrollments List: http://localhost:${PORT}/enrollments\n`));
});

checkStartup()
  .then(() => startListening())
  .catch((err) => {
    console.error(chalk.bold.red(`\n❌ Startup check failed: ${err.message}`));
    console.error(chalk.gray('   Fix the problem above and start the server again.\n'));
    process.exit(1);
  });
