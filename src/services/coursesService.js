import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import courses from '../data/courses.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/courses.json');

// 💾 פונקציית עזר פנימית לשמירת השינויים בדיסק
const saveToDisk = () => {
    fs.writeFileSync(dataPath, JSON.stringify(courses, null, 2), 'utf-8');
};

// שליפת כל הקורסים
export const fetchAllCourses = () => {
    return courses;
};

//  שליפת קורס לפי ID
export const fetchCourseById = (id) => {
    return courses.find(c => c.id === id);
};

//  הוספת קורס חדש 
export const addCourse = (name, description) => {

  const maxId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) : 100;
    
    const newCourse = {
        id: maxId + 1,
        name: name,
        description: description
    };
  
    courses.push(newCourse);
    saveToDisk();
    return newCourse;
};

// עדכון קורס 
export const editCourse = (id, name, description) => {
    const course = courses.find(c => c.id === id);
    if (!course) return null; 

    course.name = name;
    course.description = description;
    
    saveToDisk(); 
    return course;
};

//  מחיקת קורס 
export const removeCourse = (id) => {
    const courseIndex = courses.findIndex(c => c.id === id);
    if (courseIndex === -1) return false; 

    courses.splice(courseIndex, 1);
    saveToDisk(); 
    return true; 
};