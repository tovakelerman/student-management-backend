/**
 * ============================================================
 *  validate — אימות תוכן לנתוני הבקשה
 * ============================================================
 *
 * בכל נתיב POST/PUT, לפני שהנתון נשמר לקובץ, בודקים שהוא
 * באמת במבנה הנכון. למה? בלי בדיקה, JSON כמו
 *   { "studentId": "abc", "courseId": [] }
 * היה נשמר בקובץ ויגרום לשגיאות מכוערות בהמשך.
 *
 * העיקרון: הנתון צריך להיות מחרוזת שאינה ריקה אחרי trim,
 * ומזהה צריך להיות מספר שלם חיובי (או מחרוזת ספרות,
 * כמו "101" — כי טפסים ב-HTML שולחים הכל כמחרוזת).
 *
 * מחזירה את הערך המנוקה (trimmed), או זורקת BadRequestError.
 */
import { BadRequestError } from './HttpError.js';

/** מחרוזת לא ריקה, אחרי trim */
export const requireText = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestError(`${fieldName} must be a non-empty text`);
  }
  return value.trim();
};

/** מספר שלם חיובי — מקבל number או מחרוזת ספרות */
export const requirePositiveInt = (value, fieldName) => {
  // מחרוזת "101" → 101. ערך מספרי 101 → 101.
  const num =
    typeof value === 'number' ? value : /^\d+$/.test(String(value).trim()) ? Number(value) : NaN;

  if (!Number.isInteger(num) || num <= 0) {
    throw new BadRequestError(`${fieldName} must be a positive integer`);
  }
  return num;
};
