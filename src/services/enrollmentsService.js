import { createStore } from '../dataStore.js';
import { NotFoundError, ConflictError } from '../utils/HttpError.js';
import { nextId } from '../utils/nextId.js';

// ============================================================
//  Enrollments Service — רישומי סטודנט–קורס (enrollments.json)
// ============================================================
// כל פונקציה מחזירה Promise דרך שרשרת `.then()/.catch()` (בלי
// async/await) של קריאה/כתיבה מהדיסק באמצעות fs.promises (עטוף
// ב-jsonStore). "לא נמצא" → NotFoundError (404),
// הרשמה כפולה → ConflictError (409).
//
// שים לב: השירות קורא ישירות את הקובץ שלו (new Map / find)
// ולא דרך fetchStudentById/fetchCourseById — אלה זורקים שגיאה
// כשחסר פריט, ובתוך רשימה זו התנהגות לא רצויה.

const store = createStore('enrollments.json');
const studentsStore = createStore('students.json');
const coursesStore = createStore('courses.json');

const ID_BASE = 0; // הראשון יקבל 1

// בודק שהסטודנט קיים; מחזיר אותו או זורק 404
const requireStudent = (studentId) =>
  studentsStore.readAll()
    .then((students) => students.find((s) => s.id === studentId))
    .then((student) => {
      if (!student) throw new NotFoundError('Cannot enroll: Student does not exist');
      return student;
    });

// בודק שהקורס קיים; מחזיר אותו או זורק 404
const requireCourse = (courseId) =>
  coursesStore.readAll()
    .then((courses) => courses.find((c) => c.id === courseId))
    .then((course) => {
      if (!course) throw new NotFoundError('Cannot enroll: Course does not exist');
      return course;
    });

// 1. כל הרישומים הגולמיים
export const fetchAllEnrollments = () => store.readAll();

// 2. רישום בודד לפי ID
export const fetchEnrollmentById = (id) =>
  store.readAll()
    .then((enrollments) => enrollments.find((e) => e.id === id))
    .then((enrollment) => {
      if (!enrollment) throw new NotFoundError(`Enrollment ID ${id} not found`);
      return enrollment;
    });

// 3. כל הקורסים של סטודנט, עם פרטי הקורס המלאים
export const fetchCoursesByStudentId = (studentId) =>
  studentsStore.readAll()
    .then((students) => students.find((s) => s.id === studentId))
    .then((student) => {
      if (!student) throw new NotFoundError('Student not found');

      return Promise.all([store.readAll(), coursesStore.readAll()])
        .then(([enrollments, courses]) => {
          // Map: id → קורס, כדי למצוא כל קורס ב-O(1) ולא לסרוק את המערך בכל פעם
          const coursesById = new Map(courses.map((c) => [c.id, c]));

          const enrolledCourses = enrollments
            .filter((e) => e.studentId === studentId)
            .map((e) => coursesById.get(e.courseId))
            .filter(Boolean); // קורס שנמחק אבל הרישום נשאר — מדלגים

          return {
            student: { id: student.id, name: student.name },
            enrolledCourses,
          };
        });
    });

// 4. כל הסטודנטים בקורס, עם פרטיהם המלאים
export const fetchStudentsByCourseId = (courseId) =>
  coursesStore.readAll()
    .then((courses) => courses.find((c) => c.id === courseId))
    .then((course) => {
      if (!course) throw new NotFoundError('Course not found');

      return Promise.all([store.readAll(), studentsStore.readAll()])
        .then(([enrollments, students]) => {
          const studentsById = new Map(students.map((s) => [s.id, s]));

          // שם השדה בתשובה ללקוח נשאר enrollmentedStudents (תאימות לאחור) —
          // רק שם המשתנה הפנימי תוקן.
          const enrolledStudents = enrollments
            .filter((e) => e.courseId === courseId)
            .map((e) => studentsById.get(e.studentId))
            .filter(Boolean);

          return {
            course: { id: course.id, name: course.name },
            enrollmentedStudents: enrolledStudents,
          };
        });
    });

// 5. הוספת רישום חדש
export const addEnrollment = (studentId, courseId) =>
  // בדיקות הקיום נעשות לפני הכניסה לתור של enrollments,
  // ובדיקת ההרשמה הכפולה נעשית *בתוכו* — כלומר אחרי קריאה
  // טרייה, ולכן רק בקשה אחת מתוך 5 מקבילות זהות תעבור.
  requireStudent(studentId)
    .then(() => requireCourse(courseId))
    .then(() =>
      store.update((enrollments) => {
        const exists = enrollments.some(
          (e) => e.studentId === studentId && e.courseId === courseId
        );
        if (exists) throw new ConflictError('Student is already enrolled to this course');

        const newEnrollment = { id: nextId(enrollments, ID_BASE), studentId, courseId };
        enrollments.push(newEnrollment);
        return newEnrollment;
      })
    );

// 6. עדכון רישום קיים
export const editEnrollment = (id, studentId, courseId) =>
  studentsStore.readAll()
    .then((students) => students.find((s) => s.id === studentId))
    .then((student) => {
      if (!student) throw new NotFoundError('Cannot update: New Student ID does not exist');
      return coursesStore.readAll();
    })
    .then((courses) => courses.find((c) => c.id === courseId))
    .then((course) => {
      if (!course) throw new NotFoundError('Cannot update: New Course ID does not exist');

      return store.update((enrollments) => {
        const record = enrollments.find((e) => e.id === id);
        if (!record) throw new NotFoundError('Enrollment record not found');

        const duplicate = enrollments.some(
          (e) => e.id !== id && e.studentId === studentId && e.courseId === courseId
        );
        if (duplicate) throw new ConflictError('Student is already enrolled to this course');

        record.studentId = studentId;
        record.courseId = courseId;
        return record;
      });
    });

// 7. מחיקת רישום
export const removeEnrollment = (id) =>
  store.update((enrollments) => {
    const index = enrollments.findIndex((e) => e.id === id);
    if (index === -1) throw new NotFoundError(`Enrollment ID ${id} not found`);

    enrollments.splice(index, 1);
    return { id };
  });

// 8. ניקוי רישומים יתומים — נקרא מתוך removeCourse / removeStudent.
// כשמוחקים קורס או סטודנט, הרישומים שמצביעים עליו נשארים בלי יעד וכך
// "תקועים" בקובץ בלי שום דרך להגיע אליהם. כאן מוחקים אותם.
// field: 'courseId' | 'studentId'. מחזיר את מספר הרישומים שנמחקו.
//
// ⚠️ סדר וסיכונים (מול removeCourse / removeStudent):
// (א) שני קבצים = שתי כתיבות = אין אטומיות אמיתית. אם המחיקה של ההורה
//     תכשל והרישומים כבר נמחקו — הקורס נשאר בלי רישומים. זה מצב חוקי
//     לגמרי (קורס בלי סטודנטים), לעומת ההפך — רישום בלי קורס.
// (ב) איסור דדלוק: אסור להחזיק את נעילת הרישומים ולחכות לנעילת הקורסים,
//     בזמן שבקשה אחרת מחזיקה קורסים ומחכה לרישומים. לכן ההורה נמחק
//     **לפני** ה-store.update, ולא בתוכו.
export const removeEnrollmentsFor = (field, value) =>
  store.update((enrollments) => {
    const kept = enrollments.filter((e) => e[field] !== value);
    const removedCount = enrollments.length - kept.length;

    if (removedCount > 0) {
      enrollments.length = 0;
      enrollments.push(...kept);
    }
    return removedCount;
  });
