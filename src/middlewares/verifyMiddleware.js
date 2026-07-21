import chalk from 'chalk';

export const verifyAuthKey = (req, res, next) => {
  // 1. שולפים את ה-header שנקרא auth-key מתוך הבקשה של הלקוח
  const authKey = req.headers['auth-key'];

  // 2. בדיקה האם ה-header לא קיים או שערכו ריק/שגוי
  if (!authKey || authKey !== 'my-secret-key') {
    console.log(chalk.red(`❌ [שגיאת אימות] ניסיון גישה חסום נדחה. נתיב: ${req.originalUrl}`));
    return res.status(401).json({ message: "Unauthorized: Missing or invalid auth-key header" });
  }

  // 3. אם האימות הצליח, מדפיסים הודעה לפי הדרישה וממשיכים הלאה
  console.log(chalk.green(`🔑 [אימות הצליח] בקשה מאומתת התקבלה עבור נתיב: ${req.originalUrl}`));
  next();
};