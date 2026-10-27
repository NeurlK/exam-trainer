# Audit — intermediate_math (IM)

## (a) Summary

* Almost every explanation described the trap with a verbal noun or no verb at all („ხაფანგი: მარცხნიდან მარჯვნივ მიყოლებით გამოთვლა…“, „ხაფანგია 75 — …“). In 44 of 45 explanations the trap is now a „ხაფანგი: …“ sentence in the formal 2nd person („ითვლით“, „ყოფთ“, „კრებთ“). Long step sentences were split.
* Fixed register: "let's" forms („გადავამრავლოთ“, „გავყოთ“, „გადავიყვანოთ“, „გავხსნათ“, „ვადარებთ“) and informal forms („შეკრიბე“, „გამოაკლო“) in explanations. All informal imperatives in the pattern names and rules are now formal („იპოვეთ“, „გაყავით“, „ნუ აიღებთ“).
* Rewrote 9 questions that read like translations or used genitive chains: IM-005 (the „ფასდაკლებას აკეთებს“ calque), IM-013, IM-014 („ბრენდ „B“-ს მიერ გაყიდული…“), IM-017 („ისე შეეფარდება ერთმანეთს, როგორც“), IM-024 („არსებული ნახვრეტიდან“), IM-027 („სიგანის გაორმაგებულ მნიშვნელობაზე“), IM-029 („საკვებში“ → „საკვებზე“), IM-037, and IM-041 (a long parenthesis split into its own sentence).
* All 45 stored answers were re-solved by hand. All are correct, and the Georgian and English versions ask the same thing (except IM-037, which is now fixed).

## (b) Content fixes

| id | what was wrong | what I changed |
|---|---|---|
| IM-037 | „სულ რამდენ ხანს მუშაობს…“ ("in total") could make the lunch-included option (8 სთ 45 წთ) look right. The English asks how long he "actually" works. | „სულ“ → „რეალურად“ in question_ka (approved in NEEDS_REVIEW). English unchanged. |
| pattern `proportion_scaling` | The rule covered lengths and areas only, but the new IM-051 relies on volume scaling by the cube. | Added "volumes by its cube" / „მოცულობა კი — მის კუბზე“ to rule_en and rule_ka. This is the only English text I changed. |

## (c) Georgian to double-check

* The trap sentences use the 2nd-person present to describe the mistake: „ხაფანგი: ზრდას ახალ ფასზე ყოფთ…“, „…და იღებთ 1080-ს“. This follows the GEORGIAN_STYLE.md example. Please check that it reads naturally over many questions.
* IM-014: „B“ ბრენდი instead of „ბრენდ „B““ (in the question and in the table column).
* IM-010: „შესყიდვის ფასი“ instead of „თვითღირებულება“. IM-018: „ყველა თანამშრომელი“ instead of „შტატი“.
* „დროების / სიჩქარეების საშუალოს იღებთ“ (and „ნუ აიღებთ“ in the rules) instead of „გაასაშუალოება“.
* IM-004 and `successive_percent`: „კოეფიციენტები გადაამრავლეთ“ instead of „მამრავლები გადაამრავლე“.
* Pattern names: „რისი პროცენტი? იპოვეთ, რისგან ითვლება“ (was „იპოვე ბაზა“) and „შეწონილი საშუალო: ჯგუფის ზომაც მნიშვნელოვანია“ (was „საშუალო ზომის მიხედვით იწონება“).
* „აითვლება“ (for example „ახალი ფასიდან აითვლება“) is kept everywhere. „ითვლება“ may sound more everyday.
* New questions: IM-049 „ქულების ჯამი“ for dice; IM-051 a 1 : 10 model of a ქვევრი and „სიმაღლე, სიგანე და სიღრმე“ for a jar; IM-054 „ბოლოს ამის შემდეგ დარჩენილი მანდარინის 1/2“.
* Not changed, because a fix would mean editing the English too:
  * IM-037: the explanation names the "subtract like decimals" trap (17.30 − 8.45), which leads to none of the options. It doesn't name the trap behind the 8 სთ 45 წთ option (forgetting the break).
  * IM-045: the explanation doesn't explain the 1/3 option (4/6 × 3/6: one fewer good bulb but the same total). The new IM-046 explains this trap.

## (d) New questions

| id | pattern_tag | difficulty | format | correct answer | description |
|---|---|---|---|---|---|
| IM-046 | probability_basics | 2 | probability | 2/9 | 10 apples (5 red), draw 2 without replacement, both red. Traps 1/5 and 1/4. |
| IM-047 | probability_basics | 3 | probability | 3/5 | Pick 2 of 5 students (3 boys, 2 girls): one boy and one girl. Both orders count, no repeats. |
| IM-048 | probability_basics | 2 | probability | 4/25 | Draw, put back, draw again. Trap: reducing the count anyway (2/15). |
| IM-049 | probability_basics | 2 | probability | 1/6 | Two dice add up to 7. Traps 1/11 (11 sums) and 1/12 (unordered pairs). |
| IM-050 | proportion_scaling | 2 | word_problem | 24 m² | 1 : 200 flat plan, 6 cm² on the plan. Area scales by 2². |
| IM-051 | proportion_scaling | 3 | word_problem | 2500 litres | 1 : 10 qvevri model holds 2.5 L. Volume scales by 10³. |
| IM-052 | proportion_scaling | 1 | word_problem | 180 ml | Logo with sides 3 times as long needs 9 times the paint. |
| IM-053 | order_of_operations | 1 | word_problem | 30 GEL | 80 GEL: 1/4 spent, then 1/2 of the rest. |
| IM-054 | order_of_operations | 2 | word_problem | 1/3 | Harvest: 1/6, then 1/5 of the rest, then 1/2 of what is left. |
| IM-055 | order_of_operations | 3 | word_problem | 900 GEL | Reverse: 1/5, then 1/2 of the rest, 360 GEL left. Find the bonus. |
| IM-056 | weighted_average | 1 | word_problem | 1050 GEL | 6 waiters at 900 GEL and 2 cooks at 1500 GEL. Trap: 1200. |
| IM-057 | weighted_average | 2 | word_problem | 15.2 GEL | Tea blend: 60% at 12 GEL/kg and 40% at 20 GEL/kg. Trap: 16. |
| IM-058 | weighted_average | 3 | word_problem | By 90 GEL | 9 people averaging 1200 GEL, plus one at 2100 GEL. How much does the average rise? Trap: ÷9 = 100. |
| IM-059 | percent_change_base | 3 | percentage | 60% | Share of this year's hires who work in sales (12% of all ÷ 20% of all). |
| IM-060 | successive_percent | 1 | percentage | 300 GEL | Hotel room 200 GEL, +25% then +20%. Trap: 290. |

Difficulty mix of the new questions: 4 easy, 6 medium, 5 hard. All 15 have a `verify` block.
