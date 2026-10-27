# Georgian style rules

Every Georgian text in the question bank follows these rules: questions, options, explanations,
table labels and pattern names/rules. The reader is a native Georgian speaker answering under time
pressure, so the test is simple: **can they understand it on the first read?**
(The app's own buttons and menus in `public/js/i18n.js` are separate and not covered here.)

## 1. One way of addressing the reader

Use the formal **თქვენ** everywhere, in questions, explanations and pattern rules:
„შეამოწმეთ“, „გაყავით“, „ჩათვალეთ“, „თუ … დაითვლით, მიიღებთ …“.
Not the informal **შენ** („წაიკითხე“, „გაყავი“) and not "let's" („გადავამრავლოთ“, „დავითვალოთ“).

## 2. Short, plain sentences

* One idea per sentence. Split anything over about 20 words.
* Prefer a verb to a verbal noun. Chains of nouns in the genitive are the main reason a text is
  hard to read.
  * ✗ „ხაფანგი: პატარა და არაშემთხვევით შერჩეული ჯგუფის თავდაჯერებული პასუხის განზოგადება.“
  * ✓ „ხაფანგი: 3 მეგობრის აზრს ყველა მყიდველის აზრად თვლით.“
* No word-for-word translation from English.
  * ✗ „მაღაზია 10%-იან ფასდაკლებას აკეთებს“
  * ✓ „მაღაზია ფასს 10%-ით ამცირებს“
* Avoid stacked „რომელიც“ clauses. Avoid rare or bookish words when a common one exists.

## 3. Fixed terms

| Meaning | Use | Not |
|---|---|---|
| trap (in explanations) | ხაფანგი | მახე |
| True / False / Cannot say | მართალია / მცდარია / ვერ ვიტყვით | anything else |
| must be true | აუცილებლად ჭეშმარიტია | |
| statement / conclusion / assumption | დებულება / დასკვნა / დაშვება | |
| percentage point | პროცენტული პუნქტი | |
| 1st with a digit | „1-ლი“ (nominative), „1-ელ“ in other cases („1-ელ სართულზე“) | „1-ლ სართულზე“ |
| 2nd, 3rd… with a digit | მე-2, მე-3 | |

## 4. Explanations

1. The steps first, in short sentences with the actual numbers.
2. Then **one** sentence about the trap, starting with „ხაფანგი:“ and containing a verb. It speaks
   to the reader directly:
   „ხაფანგი: 1/4-ს მთელი ხელფასიდან ითვლით და არა დარჩენილი თანხიდან.“

## 5. What must not change during an edit

The meaning, every number (digits, `.` as the decimal point), the answer, `correct`, the order of
options, `id`, `verify`, Markdown (`**bold**`, `` `code` ``), line breaks (`\n`) and bullets (`•`).
The Georgian and English texts must still ask exactly the same thing. If a question is actually wrong
or ambiguous, fix both languages together and record it.
