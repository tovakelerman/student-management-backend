import chalk from 'chalk';
import * as coursesService from '../services/coursesService.js';

// ========================================================
//  ❌ פונקציית השגיאות 
// ========================================================
const sendError = (res, status, message) => {
    console.log(chalk.red(`❌ Error: ${message}`));
    return res.status(status).json({ message });
};

// ========================================================
// 🎮 הפונקציות של הבקר (Controllers)
// ========================================================

export const getAllCourses = (req, res, next) => {
  try {
    console.log(chalk.blue('\n📚 Fetching all courses...'));
    const courses = coursesService.fetchAllCourses();
    res.json(courses);
  } catch (err) {
    next(err); 
  }
};

export const getCourseById = (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id);
    const foundCourse = coursesService.fetchCourseById(courseId);

    if (!foundCourse) {
      return sendError(res, 404, `Course ID ${courseId} not found`);
    }

    console.log(chalk.green(`🔍 Course ID ${courseId} found`));
    res.json(foundCourse);
  } catch (err) {
    next(err);
  }
};

//  יצירת קורס חדש
export const createCourse = (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return sendError(res, 400, "Name and description are required");
    }

    const newCourse = coursesService.addCourse(name, description);
    console.log(chalk.green(`➕ Course Created: ${newCourse.name}`));
    res.status(201).json(newCourse);
  } catch (err) {
    next(err);
  }
};

//  עדכון קורס קיים
export const updateCourse = (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name || !description) {
      return sendError(res, 400, "Name and description are required");
    }

    const updatedCourse = coursesService.editCourse(courseId, name, description);

    if (!updatedCourse) {
      return sendError(res, 404, `Course ID ${courseId} not found`);
    }

    console.log(chalk.cyan(`✏️ Course ID ${courseId} Updated Successfully`));
    res.json(updatedCourse);
  } catch (err) {
    next(err);
  }
};

//  מחיקת קורס
export const deleteCourse = (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id);
    const isDeleted = coursesService.removeCourse(courseId);

    if (!isDeleted) {
      return sendError(res, 404, `Course ID ${courseId} not found for deletion`);
    }

    console.log(chalk.red(`🗑️ Course ID ${courseId} Deleted Successfully`));
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    next(err);
  }
};