import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * ============================================================
 *  jsonStore — שכבת גישה סטנדרטית לקובץ JSON פיזי
 * ============================================================
 *
 * הקובץ הזה הוא "המנוע" שמאחורי כל ה-Services.
 * במקום שכל Service ינהל בעצמו קריאה/כתיבה,
 * כל Service יוצר "חנות" (store) אחת לקובץ שלו:
 *
 *     const store = createJsonStore(path.join(__dirname, '../data/courses.json'));
 *
 * ומכאן והלאה כל גישה לדיסק עוברת דרך שלוש פונקציות בלבד:
 *
 *     store.readAll()   → מחזיר Promise<Array> של כל המערך שקיים בקובץ
 *     store.writeAll()  → מחזיר Promise; דורס את הקובץ כולו (בצורה בטוחה)
 *     store.update()    → מחזיר Promise; "קרא → שנה → שמור" באופן מוגן מפני התנגשויות
 *
 * כל הקריאות/כתיבות מתבצעות ב-fs.promises — אסינכרוני, בלי לחסום את השרת.
 *
 * סגנון: כל הפונקציות כאן הן פונקציות "רגילות" שמחזירות שרשרת
 * `.then()/.catch()` — בלי `async`/`await`. הקריאה עוברת דרך `Promise.resolve()`
 * כדי שגם זריקה **סינכרונית** (למשל של mutator) תיפול ל-`.catch` ולא "תברח".
 *
 * למה צריך את זה בכלל?
 * - הקריאה אמיתית מהדיסק בכל בקשה, ולכן השרת תמיד רואה את הנתונים
 *   העדכניים, גם אם מישהו ערך את קובץ ה-JSON ביד.
 * - הכתיבה אטומית, כך שקריסה באמצע כתיבה לא משאירה קובץ שבור.
 * - עדכונים מקבילים מאותו קובץ מתבצעים בתור, כך שאף עדכון לא "נמחק".
 */

// ============================================================
//  1) אטומיות — למה כותבים לקובץ זמני ואחר כך משנים שם?
// ============================================================
//
// כתיבה רגילה (writeFile ישירות על courses.json) מחליפה את תוכן
// הקובץ חתיכה-חתיכה. אם השרת נופל / המחשב מתכבה באמצע,
// נשאר קובץ JSON חצי-כתוב — כלומר קובץ שבור שכל הקריאות ייכשלו עליו.
//
// לכן: כותבים את כל התוכן החדש לקובץ זמני (courses.json.tmp),
// ורק כשהוא נכתב במלואו — מחליפים אותו בקובץ האמיתי בשורה אחת.
// פעולת ה"החלפה" (rename) היא כמעט מיידית: או שיש את הקובץ הישן
// השלם, או את הקובץ החדש השלם. אין מצב ביניים.
//
// הערה: הקובץ הזמני חייב להיות באותה תיקייה — אחרת ה-rename
// הופך להעברה בין דיסקים, שאינה אטומית.

const RETRY_DELAYS_MS = [20, 50, 100, 200, 400];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * משנה שם של קובץ, עם ניסיונות חוזרים ב-Windows.
 *
 * ב-Windows, אנטי-וירוס או עורך טקסט שפותח את הקובץ באותו רגע
 * יכולים "לתפוס" אותו לשבריר שנייה, וה-rename נכשל ב-EPERM/EBUSY.
 * זו שגיאה זמנית — ממתינים מעט ומנסים שוב.
 *
 * מימוש כשרשרת רקורסיבית: כל ניסיון הוא `.then()`, וכשל זמני
 * ממשיך בשרשרת חדשה אחרי השהיה — במקום לולאת `for` עם `await`.
 */
const renameWithRetry = (from, to, attempt = 0) =>
  fs.rename(from, to).catch((err) => {
    const isTransient = err.code === 'EPERM' || err.code === 'EBUSY';
    const delay = RETRY_DELAYS_MS[attempt];

    if (!isTransient || delay === undefined) {
      // שגיאה אמיתית (או שנגמרו הניסיונות). אם הגענו לכאן אחרי ניסיונות,
      // הודעה מועילה יותר תחסוך זמן דיבוג — מה ואיך לתקן.
      if (isTransient) {
        err.message +=
          ' — the file stays locked after 5 attempts. ' +
          'Close any program that has it open (editor, antivirus) or remove the read-only flag.';
      }
      throw err;
    }

    return sleep(delay).then(() => renameWithRetry(from, to, attempt + 1));
  });

// ============================================================
//  2) תור פנימי (mutex) — מונע "עדכון שנמחק"
// ============================================================
//
// דוגמה לבעיה ללא תור:
//   בקשה א' קוראת את הקובץ (10 רשומות)
//   בקשה ב' קוראת את הקובץ (10 רשומות)
//   בקשה א' מוסיפה רשומה ושומרת (11)
//   בקשה ב' מוסיפה רשומה ושומרת (11)  ← הרשומה של א' אבדה!
//
// הפתרון: כל update "נדחף" לסוף שרשרת Promises.
// עד שעדכון קודם לא הסתיים, העדכון הבא לא מתחיל לקרוא.
// התוצאה: קריאה → שינוי → כתיבה קורים תמיד ברצף, ולא בשזירה.
//
// חשוב: לכל קובץ יש תור משלו (התור נוצר בתוך createJsonStore),
// ולכן עדכון ב-students לא מעכב עדכון ב-courses.
// הערה: שוני בין קבצים עשוי לשזור (courses ו-students במקביל) —
// זה מכוון, כי אף פעולה לא כותבת לשני קבצים באותו רגע.

// ============================================================
//  3) יצירת ה-store
// ============================================================
export const createJsonStore = (filePath) => {
  const tmpPath = `${filePath}.tmp`;

  // שרשרת ה-Promises שמייצגת את התור. מתחילה כ"הסתיימה".
  let tail = Promise.resolve();

  /**
   * מריץ פונקציה בתוך התור, ומחזיר את ה-Promise שלה.
   */
  const withLock = (fn) => {
    // ממתינים לסוף העדכון הקודם — בין אם הצליח ובין אם לא.
    // (אם הוא נכשל, .then(fn, fn) עדיין יקרא ל-fn, ולא יזרוק את שגיאתו.)
    const run = tail.then(fn, fn);

    // ה"ראש" החדש של התור הוא סוף הפעולה הזו.
    // ה-catch כאן רק מונע שגיאה אחת "להרעיל" את כל התור —
    // שגיאתה של run עצמה עדיין מוחזרת לקורא של update.
    tail = run.catch(() => {});

    return run;
  };

  /**
   * יוצר את הקובץ עם [] אם — ורק אם — הוא עדיין לא קיים.
   *
   * למה שרשרת נפרדת (`createChain`) ולא `withLock`?
   * `update` כבר מחזיק את המקום בתור כשהוא קורא ל-readAll (דרך
   * applyMutation). אם גם היצירה הייתה נדחפת לתור, היא הייתה מחכה
   * לעדכון שמחכה לה — המתנה מעגלית (דדלוק) בכל קריאה ראשונה אל
   * קובץ חסר. לכן היצירה רצה מחוץ לתור, אבל מסודרת בתור משלה כדי
   * שכמה בקשות מקבילות לא ייצרו את אותו קובץ פעמיים.
   *
   * בדיקת `fs.access` היא שגם מונעת דריסה: אם עדכון אחר כבר כתב את
   * הקובץ בינתיים, הוא נמצא, ואנחנו מחזירים בלי לכתוב `[]` עליו.
   */
  /**
   * כותב את המערך כולו — כתיבה אטומית.
   * משמש בעיקר את readAll כשהוא יוצר קובץ חסר.
   *
   * חשוב: מוגדר **לפני** createIfMissing/readAll — `const` שנקרא לפני
   * שורת ההגדרה שלו נמצא ב"אזור מת" וזורק ReferenceError.
   */
  const writeAll = (items) => {
    const json = JSON.stringify(items, null, 2);

    return fs.writeFile(tmpPath, json, 'utf-8')
      .then(() => renameWithRetry(tmpPath, filePath));
  };

  let createChain = Promise.resolve();

  const createIfMissing = () => {
    const run = createChain.then(() =>
      fs.access(filePath).then(
        () => undefined,
        () =>
          fs
            .mkdir(path.dirname(filePath), { recursive: true })
            .then(() => writeAll([]))
      )
    );
    // כמו בתור הראשי: כשל לא "מרעיל" את השרשרת, אבל הוא עדיין
    // מוחזר לקורא.
    createChain = run.catch(() => {});
    return run;
  };

  /**
   * קורא את כל הרשומות מקובץ ה-JSON.
   *
   * מחזיר מערך חדש בכל קריאה (אובייקטים חדשים בזיכרון),
   * כך שמי שמשנה את התוצאה לא משנה "עותק שמור" פנימי.
   *
   * - קובץ לא קיים  → נוצר עם [] (החלטה: קובץ חסר אינו שגיאה)
   * - JSON שבור      → שגיאה ברורה, והקובץ לא נדרס לעולם
   *
   * ENOENT: יוצרים את הקובץ (createIfMissing) ואז חוזרים ל-readAll —
   * ולא ל-fs.readFile ישיר — כדי שעריכה/מחיקה שנעשתה בינתיים תטופל
   * שוב באותו לוגיקה. אחרי createIfMissing הקובץ קיים, ולכן אין רקורסיה
   * אינסופית, ואין גם תלות בתור העדכונים.
   */
  //
  // למה fs.access **לפני** fs.readFile ולא ניסיון קריאה עם טיפול ב-ENOENT?
  // כשה-readFile(Z).then(ok, recover) משמש כטיפול ב-ENOENT של אותה שרשרת
  // שבה נעשית afterwards קריאה נוספת, ה-ok של הקריאה הראשונה עלול להיות
  // נקרא שוב עם התוצאה של הקריאה החוזרת. בדיקת קיום נפרדת משאירה כל קריאה
  // בשרשרת משלה, בלי ערבוב בין הענפים.
  const readAll = () =>
    fs
      .access(filePath)
      .then(
        () => undefined,
        (err) => {
          if (err.code !== 'ENOENT') throw err;
          return createIfMissing();
        }
      )
      .then(() => fs.readFile(filePath, 'utf-8'))
      .then((raw) => {
        // קובץ ריק (0 בתים) — מתייחסים אליו כמו אל מערך ריק.
        // (trim על null יקרוס, לכן בודקים קודם.)
        if (!raw || raw.trim() === '') {
          return [];
        }

        return Promise.resolve()
          .then(() => JSON.parse(raw))
          .catch(() => {
            // לא מדבירים את הקובץ — הוא מכיל נתונים של המשתמש שאולי
            // ניתן לשחזר ידנית. עוצרים עם הודעה שמסבירה מה לתקן.
            const error = new Error(
              `Data file is corrupted and could not be parsed: ${filePath}. ` +
              `Fix the JSON manually (it was NOT overwritten).`
            );
            error.code = 'DATA_FILE_CORRUPTED';
            throw error;
          })
          .then((parsed) => {
            // קובץ JSON תקין אך לא מערך (למשל אובייקט) — גם סוג של נתונים לא מתאימים.
            if (!Array.isArray(parsed)) {
              const error = new Error(
                `Data file must contain a JSON array, but it contains something else: ${filePath}. ` +
                `It was NOT overwritten.`
              );
              error.code = 'DATA_FILE_CORRUPTED';
              throw error;
            }
            return parsed;
          });
      });

  /**
   * מריץ את השינוי על תוצאה **מבודדת** של readAll.
   *
   * למה structuredClone ולא לעבוד ישר על מה ש-readAll החזיר?
   * מבטיחים שהמערך שמשמש את ה-mutator (ואותו מחזיר update לקורא,
   * ולכן ה-Controller שולח אותו ב-res.json) לא יהיה אובייקט שנשמר
   * אחר כך בזיכרון או ייערך על ידי כתיבה שלא הייתה אמורה לקרות —
   * וגם לא יישאר שבור אם ה-mutator זרק באמצע. הקובץ עצמו תמיד
   * נכתב מהעותק הזה בלבד.
   *
   * הפונקציה הזו נקראת *בתוך* התור (על ידי update).
   *
   * `Promise.resolve().then(...)` עוטף את ה-mutator: אם הוא זורק
   * **סינכרונית**, הזריקה הופכת לדחייה רגילה בשרשרת, והכתיבה
   * (שהיא ה-`.then` הבא) לא מתבצעת — הקובץ נשאר בדיוק כפי שהיה.
   */
  const applyMutation = (mutator) =>
    readAll()
      .then((items) => {
        const draft = structuredClone(items);
        return Promise.resolve()
          .then(() => mutator(draft))
          .then((result) => writeAll(draft).then(() => result));
      });

  /**
   * עדכון מוגן: קורא → משנה עותק → שומר.
   *
   * mutator מקבל את המערך (עותק), משנה אותו (push/splice/...), ומחזיר
   * את הערך שהפונקציה הקוראת ל-update רוצה לקבל.
   *
   * מגבלה: אסור ש-mutator יקרא ל-update של אותו store —
   * זה ייכנס לתור שנמצא באמצע ההמתנה ויתקע.
   */
  const update = (mutator) => withLock(() => applyMutation(mutator));

  return { filePath, readAll, writeAll, update };
};
