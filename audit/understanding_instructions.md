# Audit: understanding_instructions (UI-001..UI-045)

## (a) Summary

- **Register.** Explanations mixed in "we" forms („ვითვლით“, „ვტოვებთ“, „ვსვამთ“, „დავადასტურებთ“) and impersonal "they" forms („თვლიან“, „კითხულობენ“). Every pattern rule used informal შენ („შეასრულე“, „ნახე“, „მიჰყევი“). All of it is now formal თქვენ.
- **Explanation shape.** None of the 45 explanations used the "steps, then one „ხაფანგი:“ sentence" shape. All 45 now do. Each trap sentence has a verb and uses only numbers the English explanation already has, so the validator's number check still passes with 0 warnings.
- **Translationese and clumsy grammar in rule texts.** Examples: „მოვლენები ამ რიგით მუშავდება“, „ზარი განახორციელა“, „10%-იანი ფასდაკლებაა“, „მიწოდებაში“, „უდაბლესი“. UI-003 had a subject slip (the order „ირჩევს“ express delivery), and UI-019 used „უზრუნველყოფს“ with the wrong case. Long bullets in UI-025, UI-035 and UI-045 are split into short sentences inside the same bullet, so line breaks and bullets are unchanged.
- **Boundary precision.** On its own, „-მდე“ ("up to") can be read as including the number (UI-023, UI-037), so those lines now say „… წელზე უმცროსი“. UI-038 gets „(ჩათვლით)“. In UI-013, „ის“ could point to either the book or the loan period, so it now says „წიგნი“; „5 წიგნამდე“ became „არაუმეტეს 5 წიგნის“.
- **Ordinals.** „1-ლ“ became „1-ელ“ in UI-002 (explanation), UI-022, UI-029 (explanation), UI-030 and UI-032. Nominative and genitive forms stay „1-ლი“ (see (c)).

Every stored answer was re-solved by hand and is correct. No `correct`, `verify`, option order, English text, Markdown, `\n` or `•` changed. UI-006 and UI-043 keep their answers.

## (b) Content fixes

| id | what was wrong | what changed |
|---|---|---|
| UI-023 | The tested boundary read „6 წლამდე — უფასო“. A Georgian reader can take „-მდე“ as including 6, which makes the 6-year-old free and gives 16 GEL instead of 20. The English ("under 6") is not ambiguous. | Georgian only: „6 წელზე უმცროსი — უფასო“, and „65 წელზე უფროსი“ to match. The explanation now quotes the same wording. The answer (20 GEL) is unchanged. |
| UI-037 | Same „12 წლამდე“ ambiguity ("children under 12"). Luka is 8, so the answer was not affected. | Georgian only: „12 წელზე უმცროსი ბავშვები“. |

No stored answer was wrong. No question asked something different in Georgian and English.

## (c) Georgian to check

- **Ordinal rule, my reading.** „პირველი“ keeps its final ი in the genitive and instrumental („პირველი ნაბიჯის შემდეგ“), so I left „1-ლი ნაბიჯის“ / „1-ლი ნაბიჯი“ as they were. I used „1-ელ“ only where the word loses the ი: „1-ელ უჯრაზე“, „1-ელ ნაბიჯში“, „1-ელ დერეფანში“. The position_counting pattern says „ბოლო ელემენტი 1-ლია“ (nominative plus „-ა“). Please confirm this matches what you meant by "other cases".
- **UI-031** (left unchanged): „… დაბრუნდა **და** მყიდველს ან ქვითარი აქვს, **ან** ბარათით გადაიხადა“. This depends on „ან … ან“ being read as one unit, i.e. 14 days AND (receipt OR card). Someone who reads it as (A and B) OR C would also refund Giorgi, which gives two answers. If you think that reading is realistic, add „ამასთან“ after **და**.
- **UI-023:** „65 წელზე უფროსი“ for a mother who is exactly 65 relies on counting age in whole years. The English "over 65" has the same convention.
- **UI-005:** „გარე სტუმარი“ (external guest) is a corporate calque. I kept it so the question stays as hard as the English one.
- **UI-035:** „1.5-ჯერადად / 2-ჯერადად ანაზღაურდება“ is bookish but exact. „1.5-ჯერ მეტი“ could be misread as "rate + 1.5 × rate", so I kept the original.
- **UI-006:** „ავადმყოფობის გამო გაცდენა“ is used for "sick leave". **UI-043:** „რამდენჯერმე დარეკა“ replaces „ზარი განახორციელა“.
- **Trap sentences.** UI-005, 010, 013, 019, 027, 028, 031, 036 and 042 now have a „ხაფანგი:“ sentence, but their English explanations name no trap. Each sentence only restates a wrong option the question already offers. Even so, the Georgian explanation now says slightly more than the English one.

## (d) common.json rules that read badly (not edited)

- `hidden_rule_override.rule_ka`: „მოძებნე სიტყვები“ is informal. It should be „მოძებნეთ“.
- `cannot_say_vs_false.rule_ka`: „„მცდარია“ აირჩიე“ is informal. It should be „აირჩიეთ“.
- `qualifier_words.rule_ka`: „ტექსტზე მკაცრი დებულება ტექსტით არ დასტურდება“ is understandable but heavy. Suggested: „თუ დებულება ტექსტზე მკაცრია, ტექსტი მას არ ადასტურებს.“
