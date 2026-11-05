import chalk from 'chalk';
import * as studentsService from '../services/studentsService.js';

// ============================================================
//  Students Controller — .then() / .catch() לכל פונקציה
// ============================================================
// השירות מחזיר Promise (קריאה/כתיבה מהדיסק). כאן מטפלים בתוצאה
// ובשגיאה בשתי דרכים:
//
//   .then(data => res.json(data))          ← הצלחה
//   .catch(next)                            ← שגיאה
//
// ה-.catch(next) מעביר את השגיאה אל המטפל הגלובלי ב-app.js, ושם:
//   - שגיאה "עסקית" (404 / 400 / 409) מוחזרת עם הקוד שלה;
//   - כל שגיאה אחרת (למשל קובץ נתונים שלא אפשר לקרוא) מוחזרת 500.
// כך שהשרת אף פעם לא קורס בגלל בקשה אחת, והלקוח מקבל תשובה ברורה.

// קבלת כל הסטודנטים
export const getAllStudents = (req, res, next) => {
  console.log(chalk.blue('\n👥 Fetching all students data...'));

  studentsService.fetchAllStudents()
    .then((students) => res.json(students))
    .catch(next);
};

// קבלת סטודנט לפי מזהה (המילדוור כבר שם אותו ב-req.student)
export const getStudentById = (req, res, next) => {
  console.log(chalk.green(`🔍 Student ID ${req.student.id} found`));

  Promise.resolve(req.student) // הלקוח מבקש "עוד לקרוא" משהו — מגיבים מיד
    .then((student) => res.json(student))
    .catch(next);
};

// יצירת סטודנט חדש
export const createStudent = (req, res, next) => {
  const { name, email } = req.body;

  studentsService.addStudent(name, email)
    .then((newStudent) => {
      console.log(chalk.green(`🎓 Student created: ${newStudent.name} (ID: ${newStudent.id})`));
      res.status(201).json(newStudent);
    })
    .catch(next);
};

// עדכון סטודנט קיים
export const updateStudent = (req, res, next) => {
  const { name, email } = req.body;

  studentsService.editStudent(req.student.id, name, email)
    .then((updatedStudent) => {
      console.log(chalk.cyan(`📝 Student ID ${req.student.id} Updated Successfully`));
      res.json(updatedStudent);
    })
    .catch(next);
};

// מחיקת סטודנט (השירות מוחק גם את הרישומים שלו)
export const deleteStudent = (req, res, next) => {
  studentsService.removeStudent(req.student.id)
    .then(({ removedEnrollments }) => {
      console.log(chalk.red(`🗑️ Student ID ${req.student.id} Removed from system`));
      if (removedEnrollments > 0) {
        console.log(chalk.yellow(`   ↳ ${removedEnrollments} enrollment(s) removed along with the student`));
      }
      res.json({ message: "Student deleted successfully", removedEnrollments });
    })
    .catch(next);
};
