import chalk from 'chalk';
import * as coursesService from '../services/coursesService.js';

// ========================================================
// 🎮 הפונקציות של הבקר (Controllers)
// ========================================================

// שליפת כל הקורסים
export const getAllCourses = (req, res, next) => {
  try {
    console.log(chalk.blue('\n📚 Fetching all courses...'));
    const courses = coursesService.fetchAllCourses();
    res.json(courses);
  } catch (err) {
    next(err); 
  }
};

// שליפת קורס לפי ID
export const getCourseById = (Fq, res, next) => {
  try {

    console.log(chalk.green(`🔍 Course ID ${req.course.id} found`));
    res.json(req.course);
  } catch (err) {
    next(err);
  }
};

// יצירת קורס חדש
export const createCourse = (req, res, next) => {
  try {
    const { name, description } = req.body;


    const newCourse = coursesService.addCourse(name, description);
    console.log(chalk.green(`➕ Course Created: ${newCourse.name}`));
    res.status(201).json(newCourse);
  } catch (err) {
    next(err);
  }
};

// עדכון קורס קיים
export const updateCourse = (req, res, next) => {
  try {
    const { name, description } = req.body;


    const updatedCourse = coursesService.editCourse(req.course.id, name, description);

    console.log(chalk.cyan(`✏️ Course ID ${req.course.id} Updated Successfully`));
    res.json(updatedCourse);
  } catch (err) {
    next(err);
  }
};

// מחיקת קורס
export const deleteCourse = (req, res, next) => {
  try {

    coursesService.removeCourse(req.course.id);

    console.log(chalk.red(`🗑️ Course ID ${req.course.id} Deleted Successfully`));
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    next(err);
  }
};