# Audit: quant_logical (QL-001 … QL-045)

## (a) Summary

- Georgian changed in 43 of 45 questions (QL-022 and QL-043 left as they were). 11 of 13 pattern `rule_ka` entries were reworded; no `name_ka` changed.
- Explanations: „მახე“ → „ხაფანგი“ (6 places). The trap is now one „ხაფანგი:“ sentence with a formal-you verb („ირჩევთ“, „იმეორებთ“) instead of noun chains such as „ბოლო სხვაობის ხელახლა დამატება … ვერ ამჩნევს“. Long sentences were split, and the "we"/"let's" forms („დავალაგებთ“, „ვიცით“, „დავითვალოთ“, „ვიმსჯელოთ“) were changed to formal თქვენ.
- Questions: the letter-series stem (QL-014…018) now reads „… ერთ წესს მიჰყვება, რომელიც ინგლისურ ანბანს ეყრდნობა. რომელი ასოა შემდეგი?“ (it was „რომელი ასო უნდა მოდიოდეს შემდეგ?“). Genitive chains in table stems were opened up (QL-028, 030, 031). Ambiguous wording was made precise: in QL-027 „სხვადასხვა კურსზე დარეგისტრირდნენ“ became „თითო კურსზე … ყველა სხვადასხვაზე“, in QL-038 „მცირე კუთხე“ became „უფრო მცირე კუთხე“, and in QL-021 „ორს ერთნაირი შედეგი არ ჰქონია“ became „ყველას განსხვავებული შედეგი ჰქონდა“.
- I solved all 45 questions independently, and every stored answer is correct. Puzzle conditions („უშუალოდ … მარჯვნივ“, „გვერდით არ ზის“, „არა აუცილებლად გვერდით“) were already exact and were not changed. QL-039 (London 4 hours behind) was kept as instructed.
- The explanations of QL-020, 022, 026, 043 and 044 have no trap sentence in either language. I did not add one, so the Georgian still says the same as the English.

## (b) Content fixes

No answers changed. These fixes are to explanations only, in both languages.

| id | what was wrong | what I changed |
|---|---|---|
| QL-013 | The explanation said adding the two previous terms "fits none" of the steps, but 2 + 2 = 4 fits. | It now says adding fits just one step (2 + 2 = 4). |
| QL-021 | The Georgian trap said choosing Tamar assumes Nino is **last** („ბოლოშია“), and the English said "near the bottom". It only assumes Nino ranks below Tamar. | Both now say "Nino is below Tamar". |
| QL-023 | The second valid seating was called the "mirror" of the first. It isn't: the mirror would put Ketevan left of Tamar, which breaks a clue. | Removed "mirror" in both languages and just listed the two seatings. |

## (c) Georgian to check

- „თანაბრად სავარაუდო შედეგები“ for "equally likely outcomes" (QL-041, counting_cases). I replaced „თანაბრად შესაძლო“. The textbook term „ტოლშესაძლებელი“ felt too bookish.
- Letter-series stem: „… ერთ წესს მიჰყვება, რომელიც ინგლისურ ანბანს ეყრდნობა. რომელი ასოა შემდეგი?“
- QL-019: I changed the conditional „თუ … დავალაგებთ“ ("we") to a statement: „ოთხივე სიმაღლის მიხედვით დადგა რიგში: ყველაზე მაღალი — თავში, ყველაზე დაბალი — ბოლოში. ვინ დგას ბოლოდან მეორე?“ It asks the same thing as the English.
- „ბიჯი“ for the step of a series (QL-001, 014–016, letter_series_skip). I kept it because it is common in school maths.
- Left unchanged, but worth a glance:
  - „გარკვეულ კოდში“ (QL-033…036): standard in Georgian aptitude tests, I believe.
  - „რისი ტოლია ალბათობა“ (QL-041).
  - „დაწინაურებაზე განაცხადი“ (QL-045): „დაწინაურებისთვის“ may be more standard.
  - QL-044 option „…მაგრამ დარჩა“: it mirrors the English "but stayed". „…მაგრამ თბილისში არ გადავიდა“ would be clearer, but the English would have to change too.
  - „სასაათო სარტყელი“ (calendar_clock).

## (d) common.json

- `contrapositive.rule_ka`: in „თუ არა B, მაშინ არა A“, the „არა B“ reads like logic notation rather than Georgian. The second sentence, „ეს მისი შებრუნების ერთადერთი სწორი გზაა“, is stiff. Suggested wording: „„თუ A, მაშინ B“ იგივეა, რაც „თუ B არ არის, მაშინ არც A არის“. წესის შებრუნების მხოლოდ ეს გზაა სწორი.“ This is used by QL-043…045.
