import chalk from 'chalk';
import * as coursesService from '../services/coursesService.js';

// מילדוור לבדיקת קיום השדות בגוף הבקשה
export const validateCourseBody = (req, res, next) => {
  const { name, description } = req.body;

  if (!name || !description) {
    console.log(chalk.yellow(`⚠️ [Missing input] Attempt to submit a course without a name or description at path: ${req.originalUrl}`));
    return res.status(400).json({ message: "Name and description are required" });
  }

  next();
};

// מילדוור לבדיקת קיום הקורס לפי ID
export const validateCourseExists = (req, res, next) => {
  const courseId = parseInt(req.params.id);


  if (isNaN(courseId)) {
    console.log(chalk.red(`❌ [Invalid ID] Received non-numeric ID in path: ${req.originalUrl}`));
    return res.status(400).json({ message: "Invalid course ID format" });
  }

  const foundCourse = coursesService.fetchCourseById(courseId);

  if (!foundCourse) {
    console.log(chalk.red(`📚🔍 ❌ [Not Found] Course with ID ${courseId} does not exist in the system`));
    return res.status(404).json({ message: `Course ID ${courseId} not found` });
  }
  console.log(chalk.green(`📚 ✅ [Course found] ${foundCourse.name}`));
  req.course = foundCourse;
  next();
};
