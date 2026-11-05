import { createStore } from '../dataStore.js';
import { NotFoundError } from '../utils/HttpError.js';
import { nextId } from '../utils/nextId.js';
import { removeEnrollmentsFor } from './enrollmentsService.js';

// ============================================================
//  Courses Service — כל הנתונים חיים בקובץ courses.json
// ============================================================
// כל פונקציה כאן מחזירה Promise דרך שרשרת `.then()/.catch()` (בלי
// async/await): הנתונים נקראים/נכתבים מהדיסק בכל בקשה באמצעות
// fs.promises (דרך jsonStore) — לא מערך בזיכרון.
// "לא נמצא" = זריקת NotFoundError (400/404/409 מטופלים ב-HttpError.js),
// וה-handler הגלובלי ב-app.js הופכת אותה לתשובת 404 אמיתית.
//
// סגנון: כל שרשרת נפתחת ב-`Promise.resolve()` כדי שגם זריקה סינכרונית
// תיפול ל-`.catch` (ולא "תברח" מחוץ לשרשרת). ה-`.catch` בשירותים
// כאן אינו בולע את השגיאה — הוא רק **מוסיף הקשר** ובכל מקרה זורק הלאה.

const store = createStore('courses.json');

// ה-ID הוא מספר עוקב, לפי סגנון הקובץ: מתחיל מ-101.
const ID_BASE = 100;

// שליפת כל הקורסים
export const fetchAllCourses = () => store.readAll();

// שליפת קורס לפי ID — זורק NotFoundError אם אין כזה
export const fetchCourseById = (id) =>
  store.readAll()
    .then((courses) => courses.find((c) => c.id === id))
    .then((course) => {
      if (!course) throw new NotFoundError(`Course ID ${id} not found`);
      return course;
    });

// הוספת קורס חדש
export const addCourse = (name, description) =>
  store.update((courses) => {
    const newCourse = { id: nextId(courses, ID_BASE), name, description };
    courses.push(newCourse);
    return newCourse; // ה-store שומר את המערך בעצמו
  });

// עדכון קורס קיים
export const editCourse = (id, name, description) =>
  store.update((courses) => {
    const course = courses.find((c) => c.id === id);

    // זריקה כאן מבטלת את הכתיבה — הקובץ נשאר כמו שהיה
    if (!course) throw new NotFoundError(`Course ID ${id} not found`);

    course.name = name;
    course.description = description;
    return course;
  });

// מחיקת קורס + ניקוי הרישומים שלו
//
// הסדר: קודם הקורס (404 אם אין — ואז הרישומים לא נגעו), אחר כך הרישומים.
// החסרון של הסדר הזה: אם המחיקה של הרישומים תיכשל (למשל קובץ נעול),
// יישארו רישומים "יתומים" שמצביעים על קורס שאינו קיים. זה נזק מצומצם:
// בקריאה הם פשוט מדולגים (filter(Boolean)), והם ניתנים לניקוי בהרצה
// חוזרת של DELETE על אותו ID (שם ההורה כבר לא נמצא ויחזיר 404) — ולכן
// מודיעים עליהם ללוג כדי שיהיה אפשר לאתר.
//
// למה לא להפוך את הסדר? כי אז מחיקת רישומים הייתה מקדימה בדיקת 404 של
// הקורס, וקריאה עם ID שגוי הייתה מוחקת רישומים לחינם.
//
// שני קבצים שונים = שתי נעילות שונות; אין כאן נעילה מקוננת ולא דדלוק.
export const removeCourse = (id) =>
  store.update((courses) => {
    const index = courses.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundError(`Course ID ${id} not found`);

    courses.splice(index, 1);
    return { id };
  })
    .then((removed) =>
      removeEnrollmentsFor('courseId', id)
        .then((removedEnrollments) => ({ ...removed, removedEnrollments }))
        .catch((err) => {
          // הקורס כבר נמחק. לא מחזירים 500 "סתמי" בלי רמז.
          err.message +=
            ` — but Course ID ${id} was already deleted; its enrollments may remain orphaned.`;
          throw err;
        })
    );
