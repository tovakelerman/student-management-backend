import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJsonStore } from './utils/jsonStore.js';

// ============================================================
//  dataStore — "נקודה אחת" ליצירת ה-store של קובץ נתונים
// ============================================================
// כל ה-Services יוצרים את ה-store שלהם דרך הפונקציה הזו בלבד.
//
// למה זה קיים?
// כדי שנריץ בדיקות על *העותק* של הנתונים ולא על קבצי הנתונים האמיתיים:
// אם משתנה הסביבה DATA_DIR מוגדר — קוראים משם, אחרת מ-src/data כרגיל.
// הבדיקות מריצות את השרת עם DATA_DIR לתיקייה זמנית, ולכן שום
// בדיקה לא יכולה לגעת ב-src/data (גם לא בטעות).

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data');

export const createStore = (fileName) =>
  createJsonStore(path.join(DATA_DIR, fileName));
