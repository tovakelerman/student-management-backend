import chalk from 'chalk';
import * as coursesService from '../services/coursesService.js';

// ========================================================
// 🎮 הפונקציות של הבקר (Controllers)
// ========================================================
// כל פונקציה מטפלת ב-Promise של השירות:
//   .then(...)  ← הצלחה
//   .catch(next) ← שגיאה עוברת למטפל הגלובלי ב-app.js
//                 (404/400/409 עם הקוד שלהם, כל השאר → 500)

// שליפת כל הקורסים
export const getAllCourses = (req, res, next) => {
  console.log(chalk.blue('\n📚 Fetching all courses...'));

  coursesService.fetchAllCourses()
    .then((courses) => res.json(courses))
    .catch(next);
};

// שליפת קורס לפי ID
export const getCourseById = (req, res, next) => {
  console.log(chalk.green(`🔍 Course ID ${req.course.id} found`));

  Promise.resolve(req.course) // המילדוור כבר הביא את הנתון מהדיסק
    .then((course) => res.json(course))
    .catch(next);
};

// יצירת קורס חדש
export const createCourse = (req, res, next) => {
  const { name, description } = req.body;

  coursesService.addCourse(name, description)
    .then((newCourse) => {
      console.log(chalk.green(`➕ Course Created: ${newCourse.name}`));
      res.status(201).json(newCourse);
    })
    .catch(next);
};

// עדכון קורס קיים
export const updateCourse = (req, res, next) => {
  const { name, description } = req.body;

  coursesService.editCourse(req.course.id, name, description)
    .then((updatedCourse) => {
      console.log(chalk.cyan(`✏️ Course ID ${req.course.id} Updated Successfully`));
      res.json(updatedCourse);
    })
    .catch(next);
};

// מחיקת קורס (השירות מוחק גם את הרישומים שלו)
export const deleteCourse = (req, res, next) => {
  coursesService.removeCourse(req.course.id)
    .then(({ removedEnrollments }) => {
      console.log(chalk.red(`🗑️ Course ID ${req.course.id} Deleted Successfully`));
      if (removedEnrollments > 0) {
        console.log(chalk.yellow(`   ↳ ${removedEnrollments} enrollment(s) removed along with the course`));
      }
      res.json({ message: "Course deleted successfully", removedEnrollments });
    })
    .catch(next);
};
