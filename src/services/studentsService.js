import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import students from '../data/students.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/students.json');

// 💾 פונקציית עזר פנימית לשמירת השינויים בדיסק
const saveToDisk = () => {
    fs.writeFileSync(dataPath, JSON.stringify(students, null, 2), 'utf-8');
};

// שליפת כל הסטודנטים
export const fetchAllStudents = () => {
    return students;
};

// שליפת סטודנט לפי ID
export const fetchStudentById = (id) => {
    return students.find(s => s.id === id);
};

// הוספת סטודנט חדש 
export const addStudent = (name, email) => {

    const maxId = students.length > 0 ? Math.max(...students.map(s => s.id)) : 0;
    
    const newStudent = {
        id: maxId + 1,
        name: name,
        email: email 
    };
    
    students.push(newStudent);
    saveToDisk(); 
    return newStudent;
};

// עדכון סטודנט קיים 
export const editStudent = (id, name, email) => {
    const student = students.find(s => s.id === id);
    if (!student) return null;

    student.name = name;
    student.email = email; 
    
    saveToDisk(); 
    return student;
};

//מחיקת סטודנט 
export const removeStudent = (id) => {
    const studentIndex = students.findIndex(s => s.id === id);
    if (studentIndex === -1) return false;

    students.splice(studentIndex, 1);
    saveToDisk(); 
    return true;
};