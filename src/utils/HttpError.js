/**
 * ============================================================
 *  HttpError — שגיאות "עסקיות" עם קוד HTTP מובנה
 * ============================================================
 *
 * למה זה קיים?
 * ה-Services לא מחזירות null / false / { error: true } — פונקציה
 * שנתקלה בבעיה פשוט *זורקת שגיאה*.
 * הבעיה: שגיאה רגילה (new Error) מגיעה ל-handler הגלובלי
 * ב-app.js, ואין לה קוד HTTP — ולכן הלקוח יקבל 500,
 * כלומר "השרת אשם" — וזה מטעה כשהבעיה היא בעצם "לא נמצא" (404).
 *
 * הפתרון: כל השגיאות שלנו יורשות מ-HttpError ויש להן status.
 * ה-handler הגלובלי קורא err.status ?? 500 — ולכן כל שגיאה
 * כזו יוצאת החוצה עם הקוד הנכון, בלי לגעת ב-handler עצמו.
 *
 *   new NotFoundError('Course ID 999 not found')   → 404
 *   new BadRequestError('email must be a valid email address') → 400
 *   new ConflictError('Student is already enrolled')  → 409
 *
 * 409 (Conflict) נבחר במקום 400 עבור הרשמה כפולה:
 * הבקשה עצמה תקינה לגמרי — מצב הנתונים הוא שמתנגש איתה.
 */

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export class NotFoundError extends HttpError {
  constructor(message) {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends HttpError {
  constructor(message) {
    super(400, message);
    this.name = 'BadRequestError';
  }
}

export class ConflictError extends HttpError {
  constructor(message) {
    super(409, message);
    this.name = 'ConflictError';
  }
}
