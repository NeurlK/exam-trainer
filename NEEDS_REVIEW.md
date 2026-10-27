# Needs review

How the original 315 questions were checked:

1. **Recomputed by code** — 216 questions have a `verify` recipe. `npm run validate` recomputes
   each answer and fails if it doesn't match the stored one (every math, series, percentage,
   ordering, syllogism, if/then, spreadsheet and visual question).
2. **Solved blind by a second reviewer** — every module, all 315 questions, was solved from
   scratch by a reviewer who had not seen the answer key, then compared. **Result: 315 of 315
   agreed.** Reviewers also compared the Georgian and English texts line by line.
3. Reviewer fixes already applied: UI-028 (the date depended on an unstated "today"), UI-032
   („ფიშკა“ → „ფიგურა“), VR-021 and CT-044 (broken Georgian in explanations), CL-018 / CL-035
   (explanations made precise; the phishing example now uses a domain that doesn't exist),
   CL-042 (Georgian option names "Task Manager"), CT-014 (pattern tag).

What's below is everything still open. None of it is a known wrong answer.

## Georgian audit, 2026-10-26

All five Programming modules (computer literacy, understanding instructions, intermediate math,
critical thinking, quant & logical) were reread for Georgian readability against
[docs/GEORGIAN_STYLE.md](docs/GEORGIAN_STYLE.md): formal თქვენ everywhere, short sentences, one
„ხაფანგი:“ sentence with a verb per explanation. 222 of 225 questions and 63 pattern rules were
reworded; 30 new questions were added (IM-046…060, CT-046…060). No stored answer was wrong.

* Every change, before and after: [audit/changes.html](audit/changes.html).
* What each reviewer found, content fixes and wording they were unsure about: `audit/<module>.md`.
* Resolved from the list that used to be here: IM-037 („სულ“ → „რეალურად“), CT-045, CL-030,
  CL-038, the „1-ლ“ / „1-ელ“ ordinals in UI.
* Ambiguities fixed during the audit: UI-031 (refund rule could be read two ways), UI-010 and
  UI-042 ("only if" rules that expected a guarantee, contradicting the critical-thinking lesson),
  UI-023 / UI-037 („6 წლამდე“ could include 6).

## Georgian wording a native speaker should glance at (answers unaffected)

| Id | Point |
|---|---|
| IM-044 | „გერბი“ / „საფასური“ for heads / tails. The answer (3/4) is the same whichever side is which. |
| CL (several) | „ნაგვის ყუთი“, „მალსახმობი“, „ამოცანების მენეჯერი“, „გამომძალველი პროგრამა“ are natural Georgian but may not match the exact menu names of Georgian-language Windows. The English name is given in brackets on first use. |
| VR-025 | „ჟინჟღილი“ (drizzle) is a correct but rare word. (Verbal reasoning was not part of the audit.) |

## Judgement calls — flagged by the writer, upheld by the reviewer

These are deliberate traps. If you disagree with one after seeing the explanation, that's
worth discussing — it's exactly the kind of borderline the real exam uses.

| Id | Why it's borderline | Verdict |
|---|---|---|
| CT-008 | Passage gives weekday and Saturday hours, never Sunday. | Cannot say (not False): the text never contradicts the statement. |
| CT-034 | "Only if" gives a necessary condition, not a guarantee. | Cannot say, recomputed by the truth-table check. |
| UI-006 | Long leave "must **also** be approved by the department head". | Cannot say: the rule doesn't say only long leave goes to the head. |
| UI-043 | Is a call of exactly 3:00 billed as 3 or 4 started minutes? | 3: a 4th minute only starts after 3:00. |
| IM-015 | "Rose by 10%" vs "rose by 10 percentage points". | Only the percentage-points option is exactly right; that's what's tested. |
| VR-040 | Opposite of "generous": "stingy" vs "selfish". | Stingy — "selfish" is broader. |
| CL-029 | Chrome no longer shows a padlock for https; Edge, Firefox and Safari do. | The question says "many browsers", which is true. |
| QL-039 | "London is 4 hours behind Tbilisi" is only true in winter. | Given as data in the question, so the answer stands. |

## Display notes

* Attention-to-detail lookalike traps (O/0, I/1, rn/m) are shown in the normal font on purpose — a
  typewriter font would make them too easy.
* CT-029: Georgian has no single word for "unless", so the Georgian version („თუ ნისლი არ არის“)
  is slightly easier than the English one. Same logic, same answer.
