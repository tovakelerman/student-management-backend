import { createStore } from '../dataStore.js';
import { NotFoundError } from '../utils/HttpError.js';
import { nextId } from '../utils/nextId.js';
import { removeEnrollmentsFor } from './enrollmentsService.js';

// ============================================================
//  Students Service — כל הנתונים חיים בקובץ students.json
// ============================================================
// אותו דפוס בדיוק כמו coursesService (שרשות `.then()/.catch()` בלי
// async/await), עם בסיס ID שונה: סטודנטים מתחילים מ-1.

const store = createStore('students.json');

const ID_BASE = 0; // הראשון יקבל 1 (0 + 1)

// שליפת כל הסטודנטים
export const fetchAllStudents = () => store.readAll();

// שליפת סטודנט לפי ID — זורק NotFoundError אם אין כזה
export const fetchStudentById = (id) =>
  store.readAll()
    .then((students) => students.find((s) => s.id === id))
    .then((student) => {
      if (!student) throw new NotFoundError(`Student ID ${id} not found`);
      return student;
    });

// הוספת סטודנט חדש
export const addStudent = (name, email) =>
  store.update((students) => {
    const newStudent = { id: nextId(students, ID_BASE), name, email };
    students.push(newStudent);
    return newStudent;
  });

// עדכון סטודנט קיים
export const editStudent = (id, name, email) =>
  store.update((students) => {
    const student = students.find((s) => s.id === id);
    if (!student) throw new NotFoundError(`Student ID ${id} not found`);

    student.name = name;
    student.email = email;
    return student;
  });

// מחיקת סטודנט + ניקוי הרישומים שלו
// אותו סדר ואותו נימוק כמו ב-removeCourse: קודם הסטודנט, אחר כך הרישומים,
// ועל כשל בניקוי הרישומים מוסיפים הסבר לשגיאה במקום להחזיר 500 סתמי.
export const removeStudent = (id) =>
  store.update((students) => {
    const index = students.findIndex((s) => s.id === id);
    if (index === -1) throw new NotFoundError(`Student ID ${id} not found`);

    students.splice(index, 1);
    return { id };
  })
    .then((removed) =>
      removeEnrollmentsFor('studentId', id)
        .then((removedEnrollments) => ({ ...removed, removedEnrollments }))
        .catch((err) => {
          err.message +=
            ` — but Student ID ${id} was already deleted; their enrollments may remain orphaned.`;
          throw err;
        })
    );
