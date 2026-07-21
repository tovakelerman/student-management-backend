import * as studentsService from '../services/studentsService.js';
import chalk from 'chalk';
export const validateStudentExists = (req, res, next) => {
  const studentId = parseInt(req.params.id);

  if (isNaN(studentId)) {
    console.log(chalk.red(`❌ [Invalid ID] A non-numeric student ID was received in the path: ${req.originalUrl}`));
    return res.status(400).json({ error: "Invalid student ID format" });
  }

  const foundStudent = studentsService.fetchStudentById(studentId);

  if (!foundStudent) {
    console.log(chalk.red(`🎓 ❌ [Not Found] Student with ID ${studentId} does not exist in the system`));
    return res.status(404).json({ error: `🤷‍♂️ Oops! No student found with ID number ${studentId}` });
  }

  console.log(chalk.green(`🎓 ✅ [Found Student] ${foundStudent.name} (${foundStudent.email})`));
  req.student = foundStudent;
  next();
};



export const validateStudentBody = (req, res, next) => {
  const { name, email } = req.body;

  if (!name || !email) {
    console.log(chalk.yellow(`⚠️ [missing input] Attempt to send student without name or email`));
    return res.status(400).json({ message: "Name and email are required" });
  }

  next();
};