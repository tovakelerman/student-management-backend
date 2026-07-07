import express from 'express';
import chalk from 'chalk';
import courses from './data/courses.json' with { type: 'json' };
import students from './data/students.json' with { type: 'json' };

const app = express();
app.use(express.json());

const PORT = 3000;

// =========================================================
// 1. נתיבים כלליים ורשימות מלאות (GET)
// =========================================================
app.get('/', (req, res) => {
  console.log(chalk.blue('\n🏠 Notice: User requested the root path (/)'));
  res.json({ status: "success",
             message: "Server is up and running successfully",
             description: "This API server provides detailed management data for school courses and students.",
             version: "1.0.0"
   });
});

app.get('/courses', (req, res) => {
        console.log(chalk.magenta('\n📚 Sending all courses data in JSON format'));
        res.json(courses);
});


app.get('/students', (req, res) => {
     console.log(chalk.cyan('\n🎓 Sending all students data in JSON format'));
     res.json(students);
});

// =========================================================
//  שליפת קורס בודד לפי מזהה(get/:id)
// =========================================================
app.get('/courses/:id', (req, res) => {
  const courseId = parseInt(req.params.id); 
  const foundCourse = courses.find(c => c.id === courseId); 
  if (!foundCourse) return res.status(404).json({ message: "Course not found" });
  res.json(foundCourse);
});


// =========================================================
// שליפת סטודנט בודד לפי מזהה (get/:id)
// =========================================================
app.get('/students/:id', (req, res) => {
  const studentId = parseInt(req.params.id); 
  const foundStudent = students.find(s => s.id === studentId); 
  if (!foundStudent) return res.status(404).json({ message: "Student not found" });
  res.json(foundStudent);
});

// =========================================================
//  הוספת פריטים חדשים (POST)
// =========================================================


// =========================================================
 // 1. POST - יצירת קורס חדש
// =========================================================

app.post('/courses', (req, res) => {   const { name, description } = req.body;


  if (!name || !description) {
    return res.status(400).json({ message: "Name and description are required" });
  }


  const newCourse = {
    id: courses.length > 0 ? courses[courses.length - 1].id + 1 : 101,
    name: name,
    description: description
  };

  courses.push(newCourse);

  res.status(201).json(newCourse); });

 // =========================================================
 // יצירת סטודנט חדש :
 // =========================================================

app.post('/students', (req, res) => {


  const { name, email, enrolledCourseId } = req.body;


  if (!name || !email || !enrolledCourseId) {
    return res.status(400).json({ message: "Name, email and enrolledCourseId are required" });
  }

  const newStudent = {
    id: students.length > 0 ? students[students.length - 1].id + 1 : 1,
    name: name,
    email: email,
    enrolledCourseId: parseInt(enrolledCourseId)
  };

  students.push(newStudent);

  res.status(201).json(newStudent);
 });

// =========================================================
//  עדכון פריטים (PUT)
// =========================================================

// =========================================================
 // עדכון קורס קיים
 // =========================================================



app.put('/courses/:id', (req, res) => {
  const courseId = parseInt(req.params.id);
  const course = courses.find(c => c.id === courseId);

  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({ message: "Name and description are required" });
  }

  course.name = name;
  course.description = description;

  res.json(course);
});

//  =========================================================
// עדכון סטודנט קיים
//  =========================================================

app.put('/students/:id', (req, res) => { 
  const studentId = parseInt(req.params.id);
  const student = students.find(s => s.id === studentId);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const { name, email, enrolledCourseId } = req.body;

  if (!name || !email || !enrolledCourseId) {
    return res.status(400).json({ message: "All fields are required" });
  }


  student.name = name;
  student.email = email;
  student.enrolledCourseId = parseInt(enrolledCourseId);

  res.json(student);
});

// =========================================================
//  מחיקת פריטים (DELETE)
// =========================================================

// =========================================================
// מחיקת קורס
// =========================================================


app.delete('/courses/:id', (req, res) => {
  const courseId = parseInt(req.params.id);
  const courseIndex = courses.findIndex(c => c.id === courseId);

  if (courseIndex === -1) {
    return res.status(404).json({ message: "Course not found" });
  }


  courses.splice(courseIndex, 1);

  res.json({ message: "Course deleted successfully" });
});

// =========================================================
// מחיקת סטודנט
// =========================================================


app.delete('/students/:id', (req, res) => {

  const studentId = parseInt(req.params.id);
  const studentIndex = students.findIndex(s => s.id === studentId);

  if (studentIndex === -1) {
    return res.status(404).json({ message: "Student not found" });
  }


  students.splice(studentIndex, 1);

  res.json({ message: "Student deleted successfully" });
});

// =========================================================
// טיפול בנתיבים לא קיימים (404)
// =========================================================
app.use((req, res) => {
  console.log(chalk.yellow(`\n⚠️ Warning: Someone tried to visit a broken path: ${req.url}`));
  res.status(404).json({
    error: "Not Found",
    message: `The requested path '${req.url}' does not exist on this server.`
  });
});

// =========================================================
// 7. הפעלת השרת (פעם אחת בלבד, בסוף הקובץ)
// =========================================================
app.listen(PORT, () => {
  console.log(chalk.bold.green(`\n=== Express School API Server is Running on http://localhost:${PORT} ===`));
});


app.listen(PORT, () => {
  console.log(chalk.bold.green(`\n=== Express School API Server is Running on http://localhost:${PORT} ===`));
  console.log(chalk.gray('Available Endpoints:'));
  console.log(chalk.yellow(`- Base Info: http://localhost:${PORT}/`));
  console.log(chalk.yellow(`- Courses List: http://localhost:${PORT}/courses`));
  console.log(chalk.yellow(`- Students List: http://localhost:${PORT}/students\n`));


  console.log(chalk.underline('--- Current Live Data Summary: ---'));
  console.log(chalk.cyan(`Loaded Courses:`) + ` ${courses.length}`);
  console.log(chalk.green(`Loaded Students:`) + ` ${students.length}`);
  console.log(chalk.gray('----------------------------------'));
});