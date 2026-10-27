# Audit: critical_thinking (CT)

## (a) Summary

- Main problem, in 43 of 45 explanations: the „ხაფანგი:“ line was a noun chain with no main verb („…-ის …-ად მიჩნევა“, „…-ის არჩევა“). It is now a short sentence in the formal თქვენ voice („…-ს ირჩევთ“, „…-ს კითხულობთ“, „…-ად თვლით“). The other 2, CT-026 and CT-043, had no trap line at all, so I added one in Georgian.
- Long explanations and passages were split into short sentences. Genitive chains were turned into verb phrases (CT-010, CT-011, CT-016, CT-019, CT-020, CT-024, CT-025, CT-036…CT-039, CT-041). Informal or "we" forms were fixed („გაიტან“, „გაასეირნო“, „იკითხო“, „უარვყოფთ“, „გამოვაკლოთ“), and so was the CT-045 wording from NEEDS_REVIEW.
- Pattern files: common.json used the informal შენ form in 4 rules („აირჩიე“, „შეაფასე“, „დახატე“, „მოძებნე“). Several rules were also stiff or used logic notation („თუ არა B, მაშინ არა A“, „განაპირა ჯგუფები“, „ტექსტზე მკაცრი დებულება“). The jargon names stay, but each rule now explains them in plain words. Contrapositive now has an example, and the wording follows the quant_logical reviewer's suggestion.
- I solved all 45 questions again and found no wrong stored answer. Six explanations pointed at options by position („პირველი და მესამე“, „ბოლო“, „მეორე“). The app shuffles 4-option questions, so those pointers were wrong on screen. That is the only content problem I found.

## (b) Content fixes

Answers, `correct`, options and `verify` are unchanged in all six. Only the explanation changed, in both languages.

| id | What was wrong | What I changed |
|---|---|---|
| CT-007 | Explanation said "the first and third options". Options are shuffled. | Both options are now quoted by their content (KA + EN). |
| CT-009 | "the last statement", "the first two", "the third" | Each option is named by its content (KA + EN). |
| CT-010 | "the last option" | Now says "students finding the lessons more fun" (KA + EN). |
| CT-032 | "the third option", "the last one" | The two conditionals are quoted (KA + EN). |
| CT-041 | "negate the last option" | Now says "negate that assumption" (KA + EN). |
| CT-043 | "the second option is not a flaw" | That option is quoted (KA + EN). |

Not changed, as instructed: CT-008, CT-029 and CT-034 keep their answers (judgement calls).

## (c) Georgian to check

- **CT-045:** NEEDS_REVIEW proposed „გაგახსენდეს“, but that is the informal შენ form. I used the formal **„გაგახსენდეთ“**: „„მეორე უცხო ენაზე“ შეიძლება ინგლისური გაგახსენდეთ“.
- **Trap lines are now in the 2nd person present** („ხაფანგი: „ვერ ვიტყვით“-ს ირჩევთ, რადგან…“). This follows the GEORGIAN_STYLE example. Please check that it doesn't sound accusatory when repeated across 60 questions.
- CT-041 option D: „სხვა ტიპის საჩივრები ისე არ გაზრდილა, რომ ნელ პასუხებზე საჩივრების კლება გაებათილებინა.“ The grammar is right, but the form „გაებათილებინა“ is heavy.
- CT-002: „…შეიძლება ნაწილობრივ ემთხვეოდნენ კიდეც“.
- CT-027: „…კვლევას მხოლოდ უფრო სანდოდ აჩენს“.
- CT-048: „ობიექტი“ for a business on a floor of a shopping centre.
- CT-060: „…მგზავრობა 40 წუთზე მეტხანს არ გაგრძელებულა“.
- common.json `chain_middle_term`: „ერთ-ერთი დებულება შუა ჯგუფზე (B) მთლიანად უნდა ლაპარაკობდეს: „ყველა B …“ ან „არცერთი B …““. This paraphrases "the middle group must be fully covered".
- New names: `out_of_scope_option` „თემაზეა, მაგრამ მსჯელობას არ ეხება“, `denying_antecedent` „პირობა არ შესრულდა — შედეგი მაინც შეიძლება დადგეს“, `all_not_reversible` „„ყველა A არის B“-ს შებრუნება არ შეიძლება“.

## (d) New questions

All are verified by `npm run validate` except CT-056 (argument_flaw is checked by a person). I also mutation-tested them: shifting `correct` on each verified one makes the validator fail.

| id | pattern_tag | diff | format | correct | Description |
|---|---|---|---|---|---|
| CT-046 | must_be_true_vs_likely | 2 | inference (+compute) | "more textbooks sold in October" | Bookshop: textbook share falls from 60% to 50%, but the count rises from 240 to 250. Traps: "demand fell" story, "revenue rose". |
| CT-047 | must_be_true_vs_likely | 3 | inference (+compute) | "at least 60 of the 80 stayed" | Dance studio 80 + 30 − 90. Trap: "exactly 20 old students left" (assumes all new students stayed). |
| CT-048 | must_be_true_vs_likely | 2 | ordering_puzzle (compute) | "pharmacy on floor 1" | 4-floor shopping centre, 2 valid layouts. "Bank on 4" and "café on 3" hold only in the first layout. |
| CT-049 | must_be_true_vs_likely | 2 | ordering_puzzle (ordering) | Cannot be determined | 5-floor office. Floor 3 is Irakli in layout 1 and Keti in layout 2. |
| CT-050 | must_be_true_vs_likely | 3 | ordering_puzzle (compute) | "Beka and Lika sit next to each other" | Cinema row, 2 layouts. The three traps hold only in the first layout. |
| CT-051 | necessary_vs_sufficient | 2 | conditional_logic TFC | True | Car rental "only if" plus a licence. She rented, so she has the licence (the valid direction). |
| CT-052 | necessary_vs_sufficient | 1 | conditional_logic TFC | Cannot say | Free repair only with a receipt. Having the receipt doesn't guarantee a free repair. |
| CT-053 | necessary_vs_sufficient | 3 | conditional_logic | "fewer than 300 tickets → not outdoors" | Concert "only if dry and 300+ tickets". The other options read the rule as a guarantee. |
| CT-054 | denying_antecedent | 1 | conditional_logic TFC | Cannot say | Finishes before 18:00 → gym. She didn't finish early, so "won't go" doesn't follow. |
| CT-055 | denying_antecedent | 2 | conditional_logic TFC | False | Order under 100 GEL, but a second rule gives club members free delivery. |
| CT-056 | denying_antecedent | 3 | argument_flaw | Shop-open / lights-off (denying the antecedent) | Parallel flaw. Distractors: affirming the consequent, a valid contrapositive, a valid modus ponens. |
| CT-057 | affirming_consequent | 1 | conditional_logic TFC | Cannot say | Express post → next-day delivery. Delivered next day, but that doesn't prove express. |
| CT-058 | affirming_consequent | 2 | conditional_logic | "Davit has a green pass" | Training → pass; warehouse entry needs a pass. Trap: "so he did the training". |
| CT-059 | contrapositive | 1 | conditional_logic TFC | False | Works Saturday → off Monday. He worked Monday, so he didn't work Saturday. |
| CT-060 | contrapositive | 3 | conditional_logic TFC | True | Bridge → detour → over 40 min. The trip took 35 min, so two contrapositives give "bridge not closed". |

TFC answers across the 7 new True/False/Cannot say items: True 2, False 2, Cannot say 3.
