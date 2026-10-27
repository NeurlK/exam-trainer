# Computer literacy (CL-001..CL-045): Georgian audit

## (a) Summary

- **Register:** 22 questions addressed the reader with the informal შენ („წაშალე“, „დაიწყე“, „შეინახე“, „გადაგიყვანს“) or used "we" („გვაძლევს“, „მივიღებთ“). All 14 pattern rules did the same („ნახე“, „ენდე“, „გაყავი“). All of it is now formal თქვენ. Four questions (CL-004, CL-035, CL-038 and CL-041's question) were reshaped so that the question and its options agree grammatically.
- **Sentence length:** long explanations made of chained clauses („…, …, … კი …“) are now split into short sentences. Noun chains became verbs. Example: „0-ის გამოტოვება“ → „0-საც გამოტოვებთ“.
- **Trap sentences:** „ხაფანგია X-ის Y-ად დათვლა“ became „ხაფანგი: X-ს Y-ად ითვლით“, at the end of the explanation, as GEORGIAN_STYLE §4 asks.
- **Terms:** „მატარებელი“ (storage medium, but in everyday speech a train) → „საცავი“ (CL-013, CL-045, backup pattern). „თავი“ → „ნაწილი“ (CL-038). Shortcut names are consistent („კლავიშების კომბინაცია“). „მეორე ფაქტორი“/„MFA“ jargon → „შესვლის დადასტურება“, with MFA in brackets. „სასწრაფოობა“ → „სასწრაფოდ მოქმედების თხოვნა“.
- **NEEDS_REVIEW items:** CL-038 now uses „ნაწილი“. CL-030 now says „`Report.docx` ფაილის მალსახმობი (shortcut) შექმნა“. CL-029 keeps its answer; only the register changed.

## (b) Content fixes

| id | What was wrong | What I changed |
|---|---|---|
| CL-045 | Both explanations said "only the **last** setup". The app shuffles these options, so "last" can point to the wrong option. | Both languages now name the option: "laptop + external drive + cloud" / „ლეპტოპი + გარე დისკი + ღრუბელი“. |
| pattern `spreadsheet_formulas` (rule_ka + rule_en) | The old rule said "AVERAGE and COUNT skip blank cells, but a blank divisor counts as 0". Read together, the two halves seem to back the CL-017 trap (dividing by all 5 cells → 60). The rule never said that a 0 *is* counted. It also didn't mention SUBTOTAL, which CL-025 relies on. | Rewritten as separate short points in both languages: >= vs > (with a >=60 / >60 example); AVERAGE/COUNT skip blank cells but count 0; in plain arithmetic (=B2/C2, =A4*B2) a blank cell counts as 0, so dividing by it gives #DIV/0!; SUM includes filter-hidden rows, and only SUBTOTAL adds just the visible rows; the VLOOKUP column number counts from the range's first column (= 1). |

No stored answer was wrong. All 45 questions were solved independently and matched. None of the questions asked something different in Georgian than in English.

## (c) Georgian to check (I was unsure)

- **CL-004, CL-038: options in the „-ოთ“ form** („მაუსი მიიტანოთ ბმულზე…“) after „რა უნდა გააკეთოთ, რომ…?“. This mirrors the bank's 3rd-person pattern („რა უნდა გააკეთოს?“ → „გადატვირთოს“). Please check that it reads naturally as stand-alone answer options.
- **CL-035:** „რომელი მათგანი შეიძლება აღდგეს ნაგვის ყუთიდან?“ The options are now nominative („Shift + Delete-ით წაშლილი ფაილი“) instead of the old genitive „ფაილის, რომელიც…“.
- **CL-042:** „გაჭედილია და არაფერზე რეაგირებს“ replaced „გაყინულია და არაფერს პასუხობს“. „გაჭედვა“ is what people say, but it is informal.
- **Row = „სტრიქონი“** throughout (kept as found). A Georgian-language Excel may say „მწკრივი“.
- **Menu names, still unverified:** „ნაგვის ყუთი“, „მალსახმობი“, „ამოცანების მენეჯერი“, „ყველას, ვისაც ბმული აქვს“ (Google Drive) and „შეზღუდული წვდომა“. Each has its English name in brackets.
- **CL-044** keeps the colleague's informal „სასწრაფოდ გადახედე“, on purpose: it is quoted speech between colleagues.
- **Pattern box display:** the „მსჯელობის წესი“ box prints `rule` with `esc()` inside one `<p>` (public/js/app.js:405). A line break or a bullet would not show. The spreadsheet rule is therefore written as consecutive one-fact sentences. To show real bullets, someone would need to add `white-space: pre-line` to `.pattern-box p` and use `\n` (app code, not changed).

## (d) common.json rules that read badly (not edited, owned by another agent)

- Informal register: `cannot_say_vs_false` „აირჩიე“, `outside_knowledge` „შეაფასე“, `chain_middle_term` „დახატე“, `hidden_rule_override` „მოძებნე“. "We" forms: `some_not_all` and `denying_antecedent` „გვეუბნება“.
- `affirming_consequent`: „B შეიძლება სხვა რამემ გამოიწვია“ mixes the modal with the aorist. Suggested: „B შეიძლება სხვა რამემ გამოიწვიოს“.
- `qualifier_words`: „ტექსტზე მკაცრი დებულება ტექსტით არ დასტურდება“ is hard to parse on first read. Suggested: „თუ დებულება ტექსტზე მკაცრია, ტექსტი მას არ ადასტურებს“.
- `chain_middle_term`: „წანამძღვარი“ and „განაპირა ჯგუფები“ are bookish, and the middle sentence is long.
