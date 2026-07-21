import express from 'express';
import chalk from 'chalk';

import studentsRoutes from './routes/studentsRoutes.js';
import coursesRoutes from './routes/courseRoutes.js';
import enrollmentsRoutes from './routes/enrollmentsRoutes.js'; 

import { verifyAuthKey } from '../src/middlewares/verifyMiddleware.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/students', verifyAuthKey,studentsRoutes); 
app.use('/courses', verifyAuthKey,coursesRoutes);
app.use('/enrollments', verifyAuthKey,enrollmentsRoutes); 

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

app.use(verifyAuthKey);

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
  console.error(chalk.red(`💥 Internal Server Error: ${err.message}`));
  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong on the server."
  });
});

// =========================================================
//  הפעלת השרת
// =========================================================
app.listen(PORT, () => {
  console.log(chalk.bold.green(`\n=== Express School API Server is Running on http://localhost:${PORT} ===`));
  console.log(chalk.gray('Available Endpoints:'));
  console.log(chalk.yellow(`- Base Info: http://localhost:${PORT}/`));
  console.log(chalk.yellow(`- Courses List: http://localhost:${PORT}/courses`));
  console.log(chalk.yellow(`- Students List: http://localhost:${PORT}/students`));
  console.log(chalk.yellow(`- Enrollments List: http://localhost:${PORT}/enrollments\n`));
});