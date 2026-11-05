import chalk from 'chalk';

// עצירת השרת מיד אם המפתח חסר — עדיף כשלון ברור בעלייה על פני 401 שקט לכל בקשה.
// קוראים את process.env בזמן שהבקשה מגיעה (ולא בקבוע ברמת מודול),
// כדי שהערך יהיה העדכני: dotenv נטען ב-index.js.
const requireSecretKey = () => {
  const secretKey = process.env.SECRET_KEY;

  if (!secretKey) {
    throw new Error('SECRET_KEY is missing. Set it in .env before starting the server.');
  }
  return secretKey;
};

export const verifyAuthKey = (req, res, next) => {
  const secretKey = requireSecretKey();

  // 1. שולפים את ה-header שנקרא auth-key מתוך הבקשה של הלקוח
  const authKey = req.headers['auth-key'];

  // 2. בדיקה האם ה-header לא קיים או שערכו ריק/שגוי
  if (!authKey || authKey !== secretKey) {
    console.log(chalk.red(`❌ [שגיאת אימות] ניסיון גישה חסום נדחה. נתיב: ${req.originalUrl}`));
    return res.status(401).json({ message: "Unauthorized: Missing or invalid auth-key header" });
  }

  // 3. אם האימות הצליח, מדפיסים הודעה לפי הדרישה וממשיכים הלאה
  console.log(chalk.green(`🔑 [אימות הצליח] בקשה מאומתת התקבלה עבור נתיב: ${req.originalUrl}`));
  next();
};
