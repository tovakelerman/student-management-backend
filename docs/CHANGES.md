# תיקוני באגים — סיכום לשיפוט ולבדיקה

מסמך זה מתאר כל שינוי שנעשה בסבב "תיקון כל הבאגים". מטרתו לאפשר
לך לקרוא, להבין ולבדוק כל שינוי בנפרד.

---

## 1. מזהה חדש — `src/utils/nextId.js`

**הבעיה:** כל שירות חישב `max + 1` בעצמו. אם מחקת את הרשומה עם
המזהה הגבוה ביותר, המזהה הבא היה אותו מספר — כלומר מזהה "חוזר".

**התיקון:** פונקציה משותפת אחת `nextId(items, base)`:

```js
export const nextId = (items, base) => {
  const max = items.length > 0 ? Math.max(...items.map((item) => item.id)) : base;
  const taken = new Set(items.map((item) => item.id));
  let candidate = max + 1;
  while (taken.has(candidate)) candidate++;
  return candidate;
};
```

- `base` משמר את בסיס המזהים הקיים: קורסים 100 (הראשון 101),
  סטודנטים ורישומים 0 (הראשון 1).
- היא נקראת **בתוך** `store.update`, על הרשימה הטרייה — ולכן שתי
  בקשות מקבילות לא מקבלות מזהה זהה.
- שלושת השירותים אימצו אותה, והעתקים מקומיים הוסרו.

> **שים לב — מגבלה ידועה:** מחיקת הרשומה בעלת המזהה הגבוה ביותר
> **משחררת** את המזהה הזה לשימוש חוזר (נבדק: מחיקת קורס 104 →
> הקורס הבא מקבל 104). כדי שמזהה לא יחזור לעולם צריך לשמור "קו מים
> גבוה" בקובץ או בזיכרון התהליך. זה שינוי עיצובי נפרד — לא בוצע.

---

## 2. אימות תוכן — `src/utils/validate.js`

**הבעיה:** ערך ריק, רווחים בלבד, מזהה `"abc"`, `"1.5"`, `"-3"`
או סוג שגוי (מערך, `null`) נשמרו לקובץ או זרקו שגיאה כללית.

**התיקון:** שתי פונקציות קטנות שזורקות `BadRequestError` (400):

| פונקציה | מה היא מקבלת | מה היא מחזירה |
|---|---|---|
| `requireText(value, fieldName)` | מחרוזת לא ריקה אחרי `trim` | הערך אחרי `trim` |
| `requirePositiveInt(value, fieldName)` | מספר שלם חיובי או מחרוזת ספרות (`"101"`) | המספר כ-`number` |

שימוש: ב-`courseMiddleware`, `studentMiddleware`, `enrollmentMiddleware`,
ובקריאת `studentId`/`courseId` בתוך ה-URL של הרישומים.

---

## 3. מילדוורים — אחידות בפורמט התשובה

**הבעיה:** חלק מהשגיאות חזרו כ-`{ message }` בלבד, ורק בחלקן
כ-`{ error, message }`. הלקוח לא ידע איזה שדה לקרוא.

**התיקון:** כל שגיאה — בכל שלושת המילדוורים — עוברת ב-`next(err)`
אל המטפל הגלובלי, שמחזיר תמיד `{ error: "<שם>", message: "<הסבר>" }`.

קבצים: `courseMiddleware.js`, `studentMiddleware.js`,
`enrollmentMiddleware.js` (שכתוב; הוסרו שגיאות הכתיב "enrollmention").

**שינוי נוסף ב-`studentMiddleware`:** הבדיקה של הדוא"ל הייתה "מאלתרת"
שגיאה רגילה ל-400. עכשיו היא פשוט `throw new BadRequestError(...)`.

---

## 4. JSON פגום בגוף הבקשה — 400 במקום 500

**הבעיה:** בקשה עם גוף לא-תקין (למשל `{"name":` חסר סוגריים)
הגיעה ל-500 — כאילו השרת אשם.

**התיקון:** ב-`src/app.js` נוסף מיד אחרי `express.json()`:

```js
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return next(new BadRequestError('Request body is not valid JSON'));
  }
  next(err);
});
```

> **למה בדיוק כאן?** Express מריץ מידלוור שגיאה רק על השכבות
> שנרשמו *לפניו*. `express.json()` נרשם בשכבה שלפני — וזה מה שזורק
> את `SyntaxError`. לכן הרישום כאן (ולא בסוף הקובץ) הוא שמזהה אותו.

---

## 5. רישומים יתומים — מחיקה ממתואמת

**הבעיה:** מחיקת קורס או סטודנט השאירה את הרישומים שלו בקובץ.
הם לא הופיעו באף רשימה (הקוד מדלג עליהם) אבל גם לא היה דרך למחוק אותם.

**התיקון:**

- פונקציה חדשה ב-`enrollmentsService`: `removeEnrollmentsFor(field, value)`
  שמוחקת כל רישום ש-`courseId` או `studentId` שלו שווה לערך, ומחזירה כמה נמחקו.
- `removeCourse` ו-`removeStudent`: קודם מוחקים את הפריט עצמו (עליו
  נבדק ה-404), ורק אז את רישומיו — כך אם הפריט לא נמצא, לא נגענו ברישומים.
- נקראים שני `store`-ים שונים, ולכן אין נעילה מקוננת ואין חשש לדדלוק.
- התשובה חזרה גם מספר: `{ message, removedEnrollments }`.

---

## 6. בקרי רישומים — ללא `parseInt` כפול

`parseInt` בתוך הבקר הפך `"abc"` ל-`NaN` בשקט. עכשיו:
- ה-URL של `GET /enrollments/student/:studentId` ו-`/course/:courseId`
  נבדק ב-`requirePositiveInt` (400 ברור).
- ה-`POST`/`PUT` משתמשים בערכים שכל המילדוור כבר המר למספרים.

---

## 7. תיקונים קטנים

- `src/utils/HttpError.js` — ההערה העליונה עדכנית (הוסרה ההתייחסות
  ל-`null`/`false` ול-`index.js`).
- `src/controllers/courseController.js` — הערה על `index.js` תוקנה ל-`app.js`;
  `deleteCourse` מדווח על מספר הרישומים שנמחקו.
- `src/services/coursesService.js` — שגיאת כתיב בהערה ("מספרשלם").
- `src/utils/validate.js` — כותרת ההערה תוקנה (`validate` במקום `specs`).

---

## 7.1 שכבת הנתונים ושכבת הבקרים — `.then()` / `.catch()`

### מה היה ומה השתנה

| שכבה | לפני | אחרי |
|---|---|---|
| שמירת קבצים (`jsonStore`) | — | `fs.promises` (אסינכרוני, לא חוסם את השרת) |
| Services (שכבת הנתונים) | מחזירים מערך מהזיכרון | `async` → מחזירים `Promise` של קריאה מהדיסק |
| Controllers (שכבת הבקרים) | `async/await` + `try/catch` | שרשרת `.then()` להצלחה ו-`.catch(next)` לשגיאה |

### איך בנוי כל בקר עכשיו

```js
export const getAllCourses = (req, res, next) => {
  coursesService.fetchAllCourses()   // מחזיר Promise
    .then((courses) => res.json(courses))  // הצלחה
    .catch(next);                          // שגיאה → המטפל הגלובלי
};
```

`next(err)` מעביר את השגיאה אל המטפל הגלובלי ב-`app.js`, שזה
ה"`.catch` האחרון" של כל בקשה:

```js
const status = err.status ?? 500;
```

### למה `.catch(next)` ולא `res.status(500)` בתוך כל בקר?

- **תקלת קבצים אמיתית** (JSON פגום, אין הרשאות, דיסק מלא) אינה נושאת
  `status`, ולכן מקבלת `500` עם הודעה כללית — בלי לחשוף פרטי מערכת
  למשתמש, ובלי שהשרת ייפול.
- **שגיאה עסקית** (`NotFoundError` / `BadRequestError` / `ConflictError`)
  נושאת `status` משלה ומקבלת `404` / `400` / `409` — בדיוק כמו קודם.
- אם כל בקר היה עונה `500` בעצמו, היינו מאבדים את 404/409, וכל בקר
  היה צריך לשכפל לוגיקה. כך יש **נקודה אחת** שמחליטה סטטוס.

### שרשרת `.then()` גם לבדיקות סינכרוניות

ב-`enrollmentsController` בדיקת ה-ID (`requirePositiveInt`) זורקת
שגיאה סינכרונית. כדי שגם היא תעבור ב-`.catch`, עוטפים אותה ב-Promise:

```js
Promise.resolve()
  .then(() => requirePositiveInt(req.params.studentId, 'Student ID'))
  .then((studentId) => enrollmentsService.fetchCoursesByStudentId(studentId))
  .then((data) => res.json(data))
  .catch(next);
```

### גם המילדוורים — `.then()` / `.catch(next)`

כל ששת המילדוורים (קורסים / סטודנטים / רישומים — גוף ו-"האם קיים")
עברו לאותה סגנון. דוגמה, בדיקת קיום קורס:

```js
export const validateCourseExists = (req, res, next) => {
  let courseId;

  Promise.resolve()
    .then(() => { courseId = requirePositiveInt(req.params.id, 'Course ID'); }) // 400
    .then(() => coursesService.fetchCourseById(courseId))                       // 404
    .then((course) => { req.course = course; next(); })                         // הצלחה
    .catch((err) => { log...; next(err); });                                    // כל שגיאה
};
```

- `Promise.resolve()` פותח את השרשרת, כדי שגם שגיאה **סינכרונית**
  (ID לא תקין) תיפול ל-`.catch` ולא "תברח" מחוץ לשרשרת.
- ה-`if (err.status === 400/404)` ב-`.catch` הוא רק *לוגים* שונים;
  התשובה עצמה נקבעת תמיד במטפל הגלובלי — אין שינוי בהתנהגות.
- `validate*Body` (גוף הבקשה) לא נוגע בדיסק, אבל גם הוא עטוף
  בשרשרת — כדי שכל המילדוורים והבקרים בפרויקט ייראו אותו דבר.

### אימות השכבה החדשה (עותק מבודד, `DATA_DIR` זמני)

| בדיקה | תוצאה |
|---|---|
| קובץ `courses.json` פגום → `GET /courses` | `500` + `"Something went wrong on the server."`, השרת ממשיך לעבוד |
| `POST /courses` כשהקובץ פגום | `500` |
| `GET /students` בזמן ש-`courses.json` פגום | `200` — קובץ אחד לא מפיל את השאר |
| הקובץ הפגום אחרי השגיאה | לא נדרס (אומת בהשוואת תוכן) |
| יצירת קורס / עדכון / מחיקה / הרשמה / 409 כפול / 400 / 404 | זהים לתוצאות בסעיף 8 |
| `GET /courses/999`, `/students/999`, `/enrollments/999` | `404` |
| `GET /courses/abc`, `/students/abc`, `PUT` עם `studentId: "abc"` | `400` |
| `PUT /students/1` עם דוא"ל לא תקין | `400` |
| `PUT /courses/101` עם שם ריק | `400` |

---

## 7.2 שיפור טיפול בשגיאות — לוג, רמז ו"בדיקת מוכנות" בעלייה

שלושה שינויים קטנים, בלי לשנות אף תשובה שהלקוח מקבל:

### א. לוג ה-500 — `src/app.js`

**היה:** `💥 Internal Server Error: <message>` בלבד. אם הקובץ פגום וקיים
גם `err.code`, הוא היה נעלם — והיה קשה לדעת מהיכן הבקשה הגיעה.

**עכשיו:**

```
💥 Internal Server Error [DATA_FILE_CORRUPTED]: Data file is corrupted ...
   ↳ GET /courses
```

- `err.code` (למשל `DATA_FILE_CORRUPTED`, `EACCES`, `ENOSPC`) נדפס **רק ללוג**.
- שורת הנתיב (`req.method` + `req.originalUrl`) עוזרת לדעת איזה בקשה נפלה.
- **התשובה ללקוח לא השתנתה:** `{"error":"Internal Server Error","message":"Something went wrong on the server."}`
  (נבדק: התשובה לא מכילה את הקוד ולא את שם הקובץ).

### ב. רמז כשקובץ נשאר נעול — `src/utils/jsonStore.js`

`renameWithRetry` מנסה 5 פעמים על `EPERM`/`EBUSY`. **מה היה:** אחרי הניסיון
החמישי הגיעה שגיאה גולמית של Node, ומי שקרא אותה לא ידע מה לעשות.
**מה עכשיו:** נוספת לסוף ההודעה שורת פעולה:

> `… — the file stays locked after 5 attempts. Close any program that has it open (editor, antivirus) or remove the read-only flag.`

(נבדק בפועל: קובץ עם `attrib +R` מחזיר `EPERM` מהניסיון הראשון, ועכשיו
מגיעה איתו גם העצה.)

### ג. בדיקת מוכנות בעלייה — `src/index.js`

**הבעיה:** השרת "עלה בהצלחה", ואז גילינו שהקובץ פגום רק כשמישהו שלח בקשה.
וכן: `SECRET_KEY` חסר התגלה רק בבקשה הראשונה.

**מה עכשיו:** לפני `app.listen` רץ `checkStartup()`:

1. `SECRET_KEY` חייב להיות מוגדר.
2. `readAll()` על שלושת קבצי הנתונים — קובץ חסר נוצר כ-`[]` (כמו היום),
   קובץ פגום/לא-מערך → שגיאה.

אם משהו נכשל:

```
❌ Startup check failed: <message>
   Fix the problem above and start the server again.
```

ו-`process.exit(1)` — השרת **לא** מאזין.

**שים לב:** `readAll` על קובץ **חסר** יוצר `[]` — זו התנהגות קיימת של
ה-store, והבדיקה מקבלת אותה (לא נוצרת התנהגות חדשה).

### אימות (עותק מבודד, `DATA_DIR` זמני)

| בדיקה | תוצאה |
|---|---|
| `courses.json` פגום בעלייה | לא מאזין, `exit 1`, הקובץ **לא** נדרס |
| `SECRET_KEY` חסר | לא מאזין, `exit 1` |
| קבצים תקינים | עולה, `GET /courses` → `200 []`, `POST` → `201 id 101`, `404`/`400` כרגיל |
| קובץ הופך פגום **אחרי** העלייה | `500` ללקוח (הודעה גנרית, בלי קוד ובלי נתיב), בלוג `[DATA_FILE_CORRUPTED]` + `↳ GET /courses` |
| קבצי הנתונים האמיתיים | ללא שינוי (אומת ב-`sha256`), אין `.tmp` שנשארו |

---

## 7.3 תיקון בעיות עיקריות — בידוד עותק הכתיבה, שמות, וסדר במחיקה ממתואמת

### א. `jsonStore` — ה-mutator עובד על עותק מבודד (`structuredClone`)

**הבעיה:** `update` העביר ל-mutator את המערך **שהחזיר** `readAll`, ואותו ערך
(והאובייקטים שבו) הוחזרו גם לקורא — כלומר ל-Controller, ל-`res.json`, ולכל
`then` בהמשך. כך אובייקט "פנימי" אחד יכול להשתייך לשני מקומות בו-זמנית:
שינוי בקורא משנה את מה שנכתב לדיסק, ושינוי שנעשה אחרי הכתיבה משאיר
"עותק שמור" בזיכרון שאינו משקף את הקובץ. בפועל זה מסוכן במיוחד כשמחזירים
אובייקט פנימי ללקוח — אם בעתיד ייווסף שדה פנימי (למשל `internalNote`) הוא
״יידלף״ בלי ששמים לב.

**התיקון:** הוצאה פונקציה פנימית `applyMutation(mutator)` שמייד אחרי
`readAll` מבצעת `structuredClone(items)`, מריצה את ה-mutator **על העותק**,
וכותבת **רק את העותק**. הערך שמוחזר לקורא הוא התוצאה של ה-mutator בלבד.
הקובץ לא השתנה מבחינת סמנטיקה (זריקת mutator עדיין מבטלת את הכתיבה),
והבדיקות מראות ש-`readAll` אכן מחזיר עותק שאינו משפיע על הקובץ.

### ב. `removeEnrollmentsFor` — ניסוח מחדש, ללא "טרנזקציה" מזויפת

ניסיון ראשון (שנזרק) אפשר לפונקציה למחוק את ההורה מתוך הכתיבה של
קובץ הרישומים. זה **יוצר דדלוק אפשרי**: הפעולה מחזיקה את נעילת
`enrollments` ומחכה לנעילת `courses`, בזמן שבקשה אחרת מחזיקה `courses`
ומחכה ל-`enrollments`. לכן הוסרה התכונה, והוחלף בה:
- קודם מוחקים את ההורה, אחר כך את רישומיו (כמו בסעיף 5).
- כשל **במחיקת הרישומים** מוסיף הודעה מפורשת לשגיאה
  (`— but Course ID N was already deleted; its enrollments may remain orphaned.`)
  כדי שתקלה לא תיראה כמו 500 סתמי. רישום יתום לא מפריע לקריאה
  (`.filter(Boolean)` מדלג עליו) ואפשר לנקות אותו ידנית בקובץ.
- שם הפרמטר `field` נשאר (`'courseId' | 'studentId'`), אבל התיעוד מפרט
  שהסדר הוא קורס-ואז-רישומים ולמה.

### ג. שמות וסגנון

| מקום | לפני | אחרי |
|---|---|---|
| `enrollmentsService.js:82` | `enrollmentedStudents` (שם משתנה) | `enrolledStudents` — **שם השדה בתשובה נשאר** `enrollmentedStudents` (תאימות ללקוח) |
| `courseRoutes.js:11` | `validateCourseExists,validateCourseBody` | `validateCourseExists, validateCourseBody` (רווח); שורה ריקה כפולה הוסרה |
| `jsonStore.js` (הערת הרמז) | "מה HOW לתקן" | "מה ואיך לתקן" |

### מה **לא** שונה (במכוון)

- שמות הפונקציות/המשתנים הציבוריים — נשמרו.
- שדה `enrollmentedStudents` בתשובת ה-API — נשמר בשמו ההיסטורי.
- `Promise.resolve(req.course)` / `Promise.resolve(req.student)` בבקרי ה-`GET`
  על ידי ID — נשארו, כי המרצה ביקש סגנון `.then()/.catch()`. (אין בהם תקלה;
  הם פשוט "טקס" — `res.json` סינכרוני.)
- `getCourseById`/`getStudentById` מחזירים את האובייקט מה-`req` — בטוח, כי
  `validateXExists` מקבל אותו מ-`readAll` חדש בכל בקשה.

### אימות (עותק מבודד, `DATA_DIR` זמני + סקריפט Node + HTTP חי)

| בדיקה | תוצאה |
|---|---|
| `readAll` → שינוי במערך שהוחזר לא משפיע על הקובץ | עובר |
| `removeCourse(101)` עם 2 רישומים | `removedEnrollments: 2`, רישום אחר נשמר |
| `removeCourse` לקורס **בלי** רישומים | מחזיר `0` ומוחק את הקורס |
| `removeCourse(404)` | `NotFoundError`, הרישומים **לא** נגעו |
| `removeStudent(1)` / `removeStudent(404)` | אותה התנהגות כמו למעלה |
| `fetchStudentsByCourseId` | מפתח התשובה נשאר `enrollmentedStudents` |
| 5 הרשמות זהות במקביל | `1` הצלחה + `4` × `409`, רשומה אחת בלבד |
| HTTP חי: `DELETE /courses/101` → `GET /enrollments` | `200` ואז `[]` |
| HTTP חי: `DELETE` כפול / ID לא קיים | `404 NotFoundError` |
| קבצי הנתונים האמיתיים | ללא שינוי (`sha256` זהה), אין `.tmp` שנשארו |

---

## 8. תוצאות הבדיקה (עותק מבודד של הנתונים, פורט 3999)

| בדיקה | תוצאה |
|---|---|
| JSON פגום | `400 BadRequestError` |
| שדה חסר / רווחים בלבד | `400` |
| דוא"ל לא תקין | `400` |
| ID `1.5` / `abc` | `400` |
| גוף רישום לא תקין | `400` |
| סטודנט לא קיים ב-`/student/999` | `404` |
| יצירת קורס תקין (עברית מ-UTF-8) | `201` עם `id` עוקב |
| מחיקת קורס 101 | `200`, `removedEnrollments: 3` |
| מחיקת סטודנט 2 | `200`, `removedEnrollments: 1` |
| רשימת סטודנטים של קורס שנמחק | `404` |
| ללא `auth-key` | `401` |
| נתיב לא קיים | `404` |
| 5 יצירות מקבילות | מזהים שונים (105–109) |
| קבצי הנתונים האמיתיים | ללא שינוי (אומת ב-`sha256`) |
| קבצי `.tmp` שנשארו | אין |

```
78c27ffd30fa7d8ad98e108b00bee6ca5c70e926ba295b261c99189a847601cf  courses.json
8483cd99b4489fe0d704e844e5a88786cf19da7d9d76c0d5eedbd31d76c5bd44  enrollments.json
471dd2909148bb592ed5fe99affff26c1a35b71e0ebe967fb528c9326b44a85f  students.json
```

---

## 9. איחוד הסגנון: הכול בשרשרת `.then()` — כולל `jsonStore` ובדיקת העלייה

**מה ביקשו:** להשלים את המעבר לסגנון שרשרת, כך שיהיה אחיד בכל השכבות:
Services שמחזירים `Promise`, פנים `jsonStore`, ובדיקת המוכנות ב-`index.js` —
בלי ערבוב `async`/`await`, ובלי `await` שנשאר בצד.

**מה שונה:**

| קובץ | שינוי |
|---|---|
| `src/utils/jsonStore.js` | `createIfMissing`, `readAll`, `applyMutation` — שרשראות `.then()` בלבד; ה-mutator עטוף ב-`Promise.resolve().then()` כדי שזריקה סינכרונית לא "תברח" מהשרשרת |
| `src/services/coursesService.js` | שרשרת `.then()` בכל שש הפונקציות, כולל מפל המחיקה |
| `src/services/studentsService.js` | כנ"ל |
| `src/services/enrollmentsService.js` | כנ"ל; `requireStudent`/`requireCourse` כ-`.then()` המחזיר 404 |
| `src/index.js` | `checkStartup()` מחזיר `Promise` ומסתיים ב-`checkStartup().then(start).catch(...)` |

**מה התגלה בדרך ותוקן (בגלל המעבר עצמו):**

- **TDZ** — `writeAll` הוגדר אחרי `createIfMissing`; `const` שנקרא לפני שורת
  ההגדרה שלו זורק `ReferenceError`. הועבר למעלה.
- **דדלוק ביצירת קובץ חסר** — `update` מחזיק את התור וקורא ל-`readAll`,
  שיצר את הקובץ דרך אותו תור. עכשיו היצירה רצה בשרשרת נפרדת (`createChain`)
  עם בדיקת `fs.access` — לא נכנסת לתור של העדכונים.
- **הקריאה הכפולה** — צורת `fs.readFile(...).then(ok, recover)` בשרשרת שבה
  הענף המטפל קורא שוב לאותו קובץ גרמה לשלב הפרסור לרוץ פעמיים (פעם שנייה עם
  ערך שאינו מחרוזת). עכשיו: בדיקת קיום ב-`fs.access`, ואז קריאה אחת בלבד.

**הערה על יצירת הקבצים:** הקבצים נוצרים באופן "עצל" — קובץ נוצר בפעם
הראשונה שנקרא או נכתב. בדיקת העלייה ב-`index.js` קוראת את שלושתם, ולכן
בהרצה אמיתית כולם קיימים מיד עם עליית השרת.

**מה לא שונה (במכוון):** שמות הפונקציות המיוצאות, מבנה התשובות (כולל המפתח
`enrollmentedStudents`), בסיסי המזהים (קורסים 101, סטודנטים/רישומים 1),
הכתיבה האטומית והניסיונות החוזרים ב-`rename`.

### אימות (עותק מבודד, `DATA_DIR` זמני)

| בדיקה | תוצאה |
|---|---|
| קובץ חסר → `[]` וקובץ נוצר | עבר |
| מזהים עוקבים: קורסים 101/102, סטודנטים 1/2 | עבר |
| `fetchCourseById/StudentById/EnrollmentById(999)` | `404` |
| הרשמה לקורס חסר | `404` |
| 5 הרשמות כפולות במקביל לזוג חדש | `1 × 201` ו-`4 × 409`, שורה אחת בקובץ |
| 3 יצירות מקבילות | מזהים שונים |
| `enrollmentedStudents` | נשמר |
| שינוי במערך שהוחזר | לא משפיע על השמירה |
| מפל מחיקה (קורס / סטודנט) | `removedEnrollments` נכון |
| קובץ פגום / לא-מערך | `DATA_FILE_CORRUPTED`, והקובץ **לא** נדרס |
| קובץ לקריאה בלבד | `EPERM` + רמז, אחרי ~770 מ"ש (5 ניסיונות) |
| `readAll` + `update` במקביל על קובץ חסר | אין דדלוק |
| 6 עדכונים מקבילים על קובץ חסר | 7 שורות, בלי אובדן |
| קבצי `.tmp` שנשארו | אין |
| קבצי הנתונים האמיתיים | ללא שינוי (`sha256`) |

```
78c27ffd30fa7d8ad98e108b00bee6ca5c70e926ba295b261c99189a847601cf  courses.json
8483cd99b4489fe0d704e844e5a88786cf19da7d9d76c0d5eedbd31d76c5bd44  enrollments.json
471dd2909148bb592ed5fe99affff26c1a35b71e0ebe967fb528c9326b44a85f  students.json
```

---

## הערה לסביבת הבדיקה

אם מריצים בדיקה מ-Git Bash ורואים `?` במקום עברית — זו בעיית
קידוד של *הטרמינל* (`od`/`grep` מפרשים בתים בודדים), לא של השרת.
בדיקה עם גוף בקשה מקובץ UTF-8 (`curl --data-binary @body.json`)
הראתה שהעברית נשמרת נכון (`d7 9b` וכו'). חלון cmd/PowerShell
עשוי להציג עברית כ-`?` גם בתגובת `curl` — זו תצוגה בלבד.
