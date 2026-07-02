import express from 'express';
import chalk from 'chalk';

// ייבוא מערכי הנתונים מקבצי המקור (ניהול נפרד של קבצים)
// שינוי מ- .js ל- .json והוספת התוספת בסוף השורה:
import courses from './data/courses.json' with { type: 'json' };
import students from './data/students.json' with { type: 'json' };

const app = express();
const PORT = 3000;

// --- 1. דף הבית: קריאה לכתובת הבסיס (ללא ניווט) ---
// מחזיר אובייקט פשוט שמכיל מידע שהשרת עובד ותיאור קצר בפורמט JSON
app.get('/', (req, res) => {
  console.log(chalk.blue('\n🏠 Notice: User requested the root path (/)'));
  
  res.json({
    status: "success",
    message: "Server is up and running successfully",
    description: "This API server provides detailed management data for school courses and students.",
    version: "1.0.0"
  });
});

// --- 2. דף הקורסים: קריאה עם ניווט פנימי (/courses) ---
// מחזיר את רשימת הקורסים המלאה בפורמט JSON בלבד
app.get('/courses', (req, res) => {
  console.log(chalk.magenta('\n📚 Sending all courses data in JSON format'));
  
  res.json(courses);
});

// --- 3. דף התלמידים: קריאה עם ניווט פנימי (/students) ---
// מחזיר את רשימת התלמידים המלאה בפורמט JSON בלבד
app.get('/students', (req, res) => {
  console.log(chalk.cyan('\n🎓 Sending all students data in JSON format'));
  
  res.json(students);
});

// --- 4. טיפול בנתיבים לא קיימים (מומלץ כפרקטיקה מקצועית, מחזיר JSON) ---
app.use((req, res) => {
  console.log(chalk.yellow(`\n⚠️ Warning: Someone tried to visit a broken path: ${req.url}`));
  
  res.status(404).json({
    error: "Not Found",
    message: `The requested path '${req.url}' does not exist on this server.`
  });
});

// --- 5. הפעלת השרת והאזנה לפורט 3000 ---
app.listen(PORT, () => {
  console.log(chalk.bold.green(`\n=== Express School API Server is Running on http://localhost:${PORT} ===`));
  console.log(chalk.gray('Available Endpoints:'));
  console.log(chalk.yellow(`- Base Info: http://localhost:${PORT}/`));
  console.log(chalk.yellow(`- Courses List: http://localhost:${PORT}/courses`));
  console.log(chalk.yellow(`- Students List: http://localhost:${PORT}/students\n`));

  // הדפסה לטרמינל לצרכי מעקב ופיתוח
  console.log(chalk.underline('--- Current Live Data Summary: ---'));
  console.log(chalk.cyan(`Loaded Courses:`) + ` ${courses.length}`);
  console.log(chalk.green(`Loaded Students:`) + ` ${students.length}`);
  console.log(chalk.gray('----------------------------------'));
});
