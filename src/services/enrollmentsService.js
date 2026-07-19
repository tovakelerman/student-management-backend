import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import enrollments from '../data/enrollments.json' with { type: 'json' };
import * as studentsService from './studentsService.js';
import * as coursesService from './coursesService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/enrollments.json');

// 💾 פונקציית עזר פנימית לשמירת השינויים בקובץ
const saveToDisk = () => {
    fs.writeFileSync(dataPath, JSON.stringify(enrollments, null, 2), 'utf-8');
};

// 1. החזרת כל הרישומים הגולמיים
export const fetchAllEnrollments = () => {
    return enrollments;
};

// 2. החזרת רישום בודד
export const fetchEnrollmentById = (id) => {
    return enrollments.find(e => e.id === id);
};

//   שליפת כל הקורסים של סטודנט עם פרטיהם המלאים
export const fetchCoursesByStudentId = (studentId) => {
    const student = studentsService.fetchStudentById(studentId);
    if (!student) return { error: true, status: 404, message: "Student not found" };

    const studentRecords = enrollments.filter(e => e.studentId === studentId);

    const fullCoursesList = studentRecords.map(record => {
        return coursesService.fetchCourseById(record.courseId);
    });

    return {
        error: false,
        data: {
            student: { id: student.id, name: student.name },
            enrolledCourses: fullCoursesList
        }
    };
};

//  שליפת כל הסטודנטים בקורס עם פרטיהם המלאים
export const fetchStudentsByCourseId = (courseId) => {
    const course = coursesService.fetchCourseById(courseId);
    if (!course) return { error: true, status: 404, message: "Course not found" };

    const courseRecords = enrollments.filter(e => e.courseId === courseId);

    const fullStudentsList = courseRecords.map(record => {
        return studentsService.fetchStudentById(record.studentId);
    });

    return {
        error: false,
        data: {
            course: { id: course.id, name: course.name },
            registeredStudents: fullStudentsList
        }
    };
};

//הוספת רישום חדש 
export const addEnrollment = (studentId, courseId) => {
    if (!studentsService.fetchStudentById(studentId)) {
        return { error: true, status: 404, message: "Cannot enroll: Student does not exist" };
    }
    if (!coursesService.fetchCourseById(courseId)) {
        return { error: true, status: 404, message: "Cannot enroll: Course does not exist" };
    }

    // מניעת כפל רישום
    const exists = enrollments.some(e => e.studentId === studentId && e.courseId === courseId);
    if (exists) return { error: true, status: 400, message: "Student is already registered to this course" };

    const maxId = enrollments.length > 0 ? Math.max(...enrollments.map(e => e.id)) : 0;

    const newEnrollment = {
        id: maxId + 1,
        studentId,
        courseId
    };

    enrollments.push(newEnrollment);
    saveToDisk();
    return { error: false, data: newEnrollment };
};

// עדכון רישום קיים
export const editEnrollment = (id, studentId, courseId) => {
    const record = enrollments.find(e => e.id === id);
    if (!record) return { error: true, status: 404, message: "Enrollment record not found" };

    if (!studentsService.fetchStudentById(studentId)) {
        return { error: true, status: 404, message: "Cannot update: New Student ID does not exist" };
    }
    if (!coursesService.fetchCourseById(courseId)) {
        return { error: true, status: 404, message: "Cannot update: New Course ID does not exist" };
    }

    record.studentId = studentId;
    record.courseId = courseId;
    
    saveToDisk(); 
    return { error: false, data: record };
};

//מחיקת רישום 
export const removeEnrollment = (id) => {
    const index = enrollments.findIndex(e => e.id === id);
    if (index === -1) return false;

    enrollments.splice(index, 1);
    saveToDisk(); 
    return true;
};