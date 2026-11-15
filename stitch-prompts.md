# TATOOA – פרומפטים ל-Stitch (8 מסכים לפי ה-PRD)

**פרויקט:** TATOOA – UX/UI (PRD, Group 12)
https://stitch.withgoogle.com/projects/5979183669137206924

**איך משתמשים:**
1. פותחים את הפרויקט ב-Stitch ובוחרים **Mobile**.
2. ודאו שמערכת העיצוב **TATOOA Neon Ink** נבחרה (כהה, ציאן ורוד). אם Stitch יצר מערכת עיצוב בהירה בשם "Tattoo Atelier", בחרו במקומה את TATOOA Neon Ink.
3. מדביקים את פרומפט 1 ומחכים שהמסך ייווצר. אחר כך מדביקים את 2, וכן הלאה. מסך אחד בכל פעם.
4. בסוף עוברים ל-**Prototype** ומחברים את הכפתורים לפי טבלת הקישורים בתחתית הקובץ.

---

## 1. גילוי והשראה (Discovery) · PRD 5.2 Style & Inspiration
```
Screen 1 – "גילוי והשראה" (Discovery feed). Hebrew RTL mobile app called TATOOA (tattoo try-on + artist booking). Dark theme #111319, glowing cyan #00f2fe CTAs, pink #ff4a8d and gold #ffba38 accents, Rubik font, Material Symbols icons.
Top bar: "TATOOA" wordmark (last A pink) with subtitle "Discovery Feed", segmented toggle "אמן | מתקעקע" (מתקעקע selected), round avatar.
Hero card with soft cyan/pink glow: small badge "AR TRY-ON", headline "תראו את הקעקוע על העור שלכם לפני המחט הראשונה", one line subtitle, full-width glowing cyan button "✨ צרו את הקעקוע שלכם (Try-On)".
Thin status ribbon: "הדמיה דו-ממדית פעילה · LiDAR בקרוב".
Horizontal style chips: הכל (selected, cyan), קווים עדינים, מינימליזם, בלאקוורק, ריאליזם, צבעוני.
Section "טרנדים וקהילה": 2-column staggered feed of realistic tattoo-on-skin photos. Each card: badge "נסו עליכם בהדמיה", heart button, views/likes chips, title (e.g. "פרח עדין פיין-ליין"), placement tag, artist name + city.
Bottom tab bar (RTL): גילוי והשראה (active, cyan glow), יצירה ו-AR, התאמת מקעקע, לידים ויומן, פרופיל.
```

## 2. יצירת הסקיצה · PRD 5.2 Style & Inspiration + Cover-Up
```
Screen 2 – "יצירת הסקיצה" (Create sketch), same TATOOA dark Hebrew RTL style, subtitle "Create Sketch".
Badge "שלב 1 מתוך 3: יצירת הקונספט", headline "עיצוב ויצירת הסקיצה שלכם", subtitle "בחרו איך להתחיל".
3-way mode tabs: "מחולל AI" (selected), "העלאת רפרנס", "סריקת קאבר-אפ".
AI panel: text area with placeholder "לדוגמה: פרח עדין עם גבעול על האמה, קווים דקים…", small "השראה אקראית" dice chip and 0/240 counter, glowing cyan button "חוללו סקיצה", row of 3 generated sketch variations (black ink stencils on parchment) labeled וריאציה 1/2/3.
Style chips (multi-select): קווים עדינים, מינימליזם, בלאקוורק, ריאליזם, גיאומטרי, יפני.
Size pills: קטן 5–10 ס"מ / בינוני 10–20 ס"מ (selected) / שרוול מלא 30+ ס"מ.
Ink pills: שחור-אפור / צבע מלא / עדין (Dotwork).
Sticky bottom cyan button "המשך למיפוי אזור הגוף ←". Bottom tab bar with "יצירה ו-AR" active.
```

## 3. מצלמה ומיפוי אזור הגוף · PRD 5.2 Depth-Mapping & Privacy, 4 Tech Feasibility
```
Screen 3 – "מיפוי אזור הגוף" (AR camera), same TATOOA dark Hebrew RTL style, subtitle "Body Mapping".
Large camera viewfinder (4:5) showing an inner forearm, with neon cyan and pink contour-ring mesh lines wrapping the arm and a horizontal cyan laser scan line.
Top overlay chips: "LiDAR · 60 FPS" (pink dot) and "טשטוש אזורים אינטימיים פעיל" (shield icon).
Center pill: "מקמו את הזרוע במרכז ושמרו על יציבות".
Bottom overlay: 3 telemetry tiles – "רוחב אזור 14 ס״מ", "גוון עור" with 4 skin-tone dots, "רדיוס קימור 8.4 ס״מ"; then body-part pills: זרוע ואמה (selected), שוק, כתף, גב עליון, חזה.
Below: success card "המיפוי הושלם ✨" with full cyan-to-pink progress bar, small note "במכשירים בלי LiDAR: מעלים תמונה דו-ממדית וממקמים ידנית".
Shutter row: gallery button, big glowing cyan/pink shutter, reset button. Bottom bar "ממשיכים לחדר ההדמיה" with cyan "המשך" button. Tab bar "יצירה ו-AR" active.
```

## 4. חדר ההדמיה (Visualizer) · PRD 5.2 AR/AI Generation + Social Try-on
```
Screen 4 – "חדר ההדמיה" (Visualizer), same TATOOA dark Hebrew RTL style, subtitle "AR Visualizer".
Top: realistic forearm photo with a black fine-line flower tattoo projected on the skin, cyan corner brackets around it, a small "TATOOA · הדמיה להשראה בלבד" watermark, chips "קימור זרוע: 94%" and "14.5 ס״מ · אמה".
Title "פרח עדין · קווים עדינים" with a toggle chip "⏳ דהייה (5 שנים)" (fading simulation).
Sliders card: "גודל" 14.5 ס״מ (cyan), "שקיפות והטמעה בעור" 88% (pink), "זווית סיבוב" 18° (gold), each with min/max labels.
Section "מתלבטים? שאלו את החברים": 3 tiles – וואטסאפ (green), סטורי עם סקר (Instagram gradient), שמירה לגלריה (cyan).
Small matched-artist preview row: avatar, name, studio, "התאמה 98%".
Full-width glowing cyan button "אהבתם? לתמחור והתאמת מקעקע ←". Tab bar "יצירה ו-AR" active.
```

## 5. תמחור והתאמת מקעקע · PRD 5.2 Dynamic Pricing + Matchmaking, 6 Pricing Engine
```
Screen 5 – "הערכת מחיר והתאמת מקעקע אישי", same TATOOA dark Hebrew RTL style, subtitle "Artist Matchmaking".
Badge "אלגוריתם התאמה פעיל", subtitle "בהתאם לגודל 14.5 ס״מ, סגנון קווים עדינים", tag chips: 14.5 ס״מ · אמה, קווים עדינים, שחור-אפור, זמן משוער 3 שעות.
Price card: label "ניתוח מחיר", gold tag "מורכבות: בינונית", big range "₪600 – ₪900", line "ממוצע משוער: ₪750", a cyan bell-curve chart with min/avg/max markers, segmented control פשוט/בינוני/מורכב, budget slider "תקציב מקסימלי ₪700" and a pink warning "התקציב מעט נמוך מהטווח – אפשר 11×11 ס״מ באותו סגנון".
Section "מקעקעים מומלצים" with badge "4 נמצאו": artist cards, first one highlighted with a cyan "99% התאמה" flag. Each card: avatar with verified badge, name + studio, specialty line, rating ★4.9 (142), distance, "טווח מחיר משוער ₪700–₪850", "תור פנוי קרוב: יום ג׳ 11:00", 3 mini portfolio thumbnails, button "צפו בפרופיל וקבעו תור" (cyan on first, dark on others) and a heart.
Tab bar "התאמת מקעקע" active.
```

## 6. פרופיל מקעקע וקביעת תור · PRD 2 Business Model (15% מקדמה), 7 Legal
```
Screen 6 – "פרופיל מקעקע וקביעת תור", same TATOOA dark Hebrew RTL style, header with back arrow and title "Artist Studio Portfolio".
Banner: "הדמיה מותאמת אישית מוכנה – ההדמיה שלכם מצורפת לפנייה".
Profile card: square avatar, name "נועה ל." with gold tag "מאסטר סטודיו", "סטודיו קו דק · תל אביב", ★4.9 (128), 8 שנות ניסיון, short bio, 3 stats: +850 עבודות, 128 חוות דעת, 98% שביעות רצון.
"תיק עבודות" 2×2 grid of tattoo photos with captions. Studio location row with tag "חניה סמוכה".
Booking card with pink-to-cyan top edge: title "בקשה להצעת מחיר ושריון תור", date chips (יום ג׳ 11:00 / יום ה׳ 16:00 / ראשון 12:00), deposit box "מקדמה 15%: ₪120 · יתרה בסטודיו 85%: ₪680" with a split bar, payment method tiles (אשראי / Bit / Apple Pay), name + phone fields, checkboxes "אני בן/בת 18 ומעלה" and "ההדמיה להשראה בלבד ואינה מחליפה ייעוץ רפואי", note "ביטוח קעקוע: תיקון בחינם כשקובעים דרך TATOOA · ביטול חינם עד 48 שעות".
Big glowing cyan button "שליחת בקשה · מקדמה ₪120 רק באישור". Small text "לא נגבה כסף עד שהאמן/ית מאשר/ת".
```

## 7. דאשבורד לידים (CRM לאמן) · PRD 5.3 Lead Intake
```
Screen 7 – "דאשבורד לידים" (artist CRM), same TATOOA dark Hebrew RTL style, subtitle "CRM Leads", top toggle on "אמן".
Header card: "מצב סטודיו · CRM", artist name "נועה ל.", gold "פרו ✦" tag, button "חזרה למתקעקע".
3 KPI tiles: "לידים פעילים 12 (+3 היום)" cyan bar, "תורים השבוע 4 מתוך 5" pink bar, "הכנסה צפויה ₪14.8k" gold bar.
Search field "חיפוש ליד, לקוח או סגנון…" + "סינון מהיר" button. Filter chips: הכל (12), Cover-Up, בתקציב, צבעוני.
Tabs: לידים חדשים 3 (selected) / ממתינים 4 / תורים 8.
Lead card (expanded): client avatar with AR badge, name "תומר ל.", "לפני 15 דקות · דרך AR Try-On", pink tag "חדש – דורש מענה", "₪800 מוצע"; simulation image of a forearm tattoo with chips "מיפוי גוף: אמה (14.5 ס״מ)" and "התאמת עקמומיות 98%"; style "קווים עדינים · שחור-אפור"; quoted client message; buttons "אשר הצעה וקבע תור" (cyan) and "צ׳אט".
2–3 collapsed lead rows below with thumbnail, style, size, status tag (הדמיה מוכנה / ממתין לסקיצה / ממתין לתמחור), arrow.
Bottom pill "3 לידים דורשים מענה היום" + "הזמן תור חדש". Tab bar "לידים ויומן" active.
```

## 8. כרטיס פרויקט וניהול ליד · PRD 5.3 End-to-End + 2 Lock-in (סימן מים → סטנסיל)
```
Screen 8 – "כרטיס פרויקט וניהול ליד" (Lead detail), same TATOOA dark Hebrew RTL style, header with back arrow and title "Artwork Details".
Top: "חזרה ללידים", pink status chip "ליד חדש · בהמתנה לאישור", title "פרויקט #TA-4892: תומר ל.", line "סגנון: קווים עדינים · מיקום: אמה פנימית".
Client card: avatar, name, phone "(מאומת)", tiles "מועד מועדף: יום ג׳ 11:00" and "אמצעי תשלום: Bit".
"הדמיית AR של הלקוח" card: forearm photo with the tattoo and a visible TATOOA watermark, tracking frame, dimensions bar "אורך 14.5 ס״מ · רוחב 6.8 ס״מ · אמה פנימית", biometrics tiles "קימור 8.4 ס״מ", "גוון עור: בהיר-בינוני", "Cover-Up: לא".
"תמחור ומסגרת תקציב" card: "תקציב הלקוח ₪700", pink/cyan comparison bar, "המלצת האלגוריתם: ₪600–₪900", "מקדמה 15% לשריון: ₪120 (נגבית אוטומטית באישור)".
Big cyan button "אשר וקבע תור ביומן", secondary pink button "הצע מחיר / תאריך חלופי".
Action rows: "צ׳אט מהיר עם הלקוח", "שלח טופס הצהרת בריאות דיגיטלי", "הוראות טיפול (Aftercare)", and a locked row "🔒 הורדת סטנסיל נקי – נפתח אחרי סליקת המקדמה".
```

---

## קישורי Prototype (מצב Prototype ב-Stitch)
| מסך | כפתור | יעד |
|---|---|---|
| 1 | "צרו את הקעקוע שלכם" / "נסו עליכם בהדמיה" | 2 |
| 2 | "המשך למיפוי אזור הגוף" | 3 |
| 3 | "המשך" | 4 |
| 4 | "אהבתם? לתמחור והתאמת מקעקע" | 5 |
| 5 | "צפו בפרופיל וקבעו תור" | 6 |
| 6 | "שליחת בקשה" | 7 (כאילו עברנו לצד האמן) |
| 7 | כרטיס הליד / "אשר הצעה" | 8 |
| 8 | "חזרה ללידים" | 7 |
| כל המסכים | טאבים בסרגל התחתון | 1 / 2 / 5 / 7 |

> כל השמות, המחירים, הדירוגים ומדדי ה-AR בפרומפטים הם נתוני הדגמה בדויים, לא נתונים אמיתיים.
