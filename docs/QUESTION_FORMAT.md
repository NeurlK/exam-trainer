# Question format

Every module has one file: `public/data/questions/<module_id>.json`.
The file is a JSON **array**; each element is one question.
Pattern tags (the "reasoning trap" a question trains) live in `public/data/patterns/*.json`.

After any edit, run the validator from the `exam-trainer` folder:

```bash
npm run validate
```

It must end with `✓ Validation passed`. It checks structure and translations, and it
**recomputes** the answer of every question that has a `verify` block.

---

## Fields

| Field | Required | What it is |
|---|---|---|
| `id` | yes | `<PREFIX>-<3 digits>`, unique. Prefixes: CL, UI, IM, CT, QL, AD, VR (see `modules.json`). |
| `module` | yes | Module id, same as the file name: `computer_literacy`, `understanding_instructions`, `intermediate_math`, `critical_thinking`, `quant_logical`, `attention_to_detail`, `verbal_reasoning`. |
| `difficulty` | yes | `1` easy, `2` medium, `3` hard. |
| `format` | yes | Question type (table below). Decides whether `verify` is mandatory. |
| `pattern_tag` | yes | Key from `public/data/patterns/*.json`. |
| `question_ka`, `question_en` | yes | Question text. `\n` = line break, `\n\n` = paragraph. `` `text` `` renders as code, `**text**` as bold. |
| `options` | yes | 4 options, or exactly the 3 True/False/Cannot say options. Each option is a plain string (same in both languages: numbers, codes, `Ctrl + C`) or `{"ka": "...", "en": "..."}`. |
| `correct` | yes | 0-based index into `options` (0 = first). |
| `explanation_ka`, `explanation_en` | yes | Short worked reasoning that names the trap. |
| `visual` | no | Something to draw under the question (grids, shapes, pairs, table, text). |
| `verify` | depends | Machine-checkable recipe for the answer. |
| `fixed_order` | no | `true` = never shuffle this question's options. |

### True / False / Cannot say

Three options, exactly these, in this order:

```json
[{"ka":"მართალია","en":"True"},{"ka":"მცდარია","en":"False"},{"ka":"ვერ ვიტყვით","en":"Cannot say"}]
```

### How the app orders options

* True/False/Cannot say and `fixed_order: true` → as stored.
* All options contain a number → sorted from smallest to largest.
* Anything else → shuffled for each run.

So never write "both A and B" or "all of the above" unless you also set `"fixed_order": true`.

### Formats

`verify` **required** (the answer is computable):
`number_series`, `letter_series`, `ordering_puzzle`, `percentage`, `ratio`, `equation`,
`arithmetic`, `word_problem`, `data_table`, `probability`, `counting`, `coding_decoding`,
`syllogism`, `conditional_logic`, `string_compare`, `table_compare`, `visual_grid`, `visual_shapes`.

`verify` optional (add it whenever the answer can be computed):
`rule_scenario`, `step_sequence`, `tfc_passage`.

Checked by a person (no code can judge these):
`strengthen_weaken`, `assumption`, `argument_flaw`, `inference`, `workplace_task`, `analogy`,
`vocabulary`, `odd_one_out`, `sentence_completion`, `reading_comprehension`.

---

## `verify` recipes

The validator works out the answer from the recipe, finds which option it matches, and fails
if that is not `correct` — or if it matches no option, or more than one.

* A **number** answer is compared with the first number in each option's English text
  (`"84 GEL"` → 84). Use `"round": 2` to compare after rounding, or `"option_values": [..]`
  to give the value of each option explicitly.
* A **text** answer is compared, ignoring case and spaces, with each option's `en` and `ka` text.

### numeric — a formula

```json
"verify": { "type": "numeric", "expr": "80 * 1.25 * 0.8" }
```

### compute — any JavaScript function

Gets the question as `q`, returns a number or a string. Use it for rule scenarios, string
transformations, spreadsheet formulas, table lookups, brute-force logic grids, coding/decoding.

```json
"verify": { "type": "compute", "fn": "(q) => { let w = 'PLANET'; w = w.slice(-1) + w.slice(1, -1) + w[0]; return w.replace(/[AEIOU]/g, ''); }" }
```

### series — number or letter series

One `null` marks the asked term. Give either a closed form `rule` (n starts at 1) or a
recurrence `rec` (`t` = terms so far, `i` = 0-based index being computed; `seeds` = how many
leading terms are given as-is). The validator also checks that the shown terms appear, in
order, in both question texts.

```json
"verify": { "type": "series", "terms": [2, 6, 12, 20, 30, null], "rule": "n => n * (n + 1)" }
"verify": { "type": "series", "terms": [1, 1, 2, 3, 5, null], "rec": "(t, i) => t[i-1] + t[i-2]", "seeds": 2 }
"verify": { "type": "series", "terms": ["B", "E", "H", "K", null], "alphabet": "latin", "rule": "n => 3 * n - 1" }
```

### ordering — position puzzles (brute force over every arrangement)

`items` are ASCII names that equal the English option text. `pos.Name` is the 0-based
position (you decide what position 0 means — first in line, tallest, ground floor — and say
so in the question). `ask(order, pos)` returns the answer. If different valid arrangements give
different answers, the answer is undetermined: set `undetermined_option` to the index of a
"Cannot be determined" option.

```json
"verify": {
  "type": "ordering",
  "items": ["Ana", "Beka", "Gio", "Dato"],
  "constraints": ["pos.Ana < pos.Beka", "pos.Gio === 3", "Math.abs(pos.Dato - pos.Ana) === 1", "pos.Dato !== 0"],
  "ask": "(order, pos) => order[0]"
}
```

### syllogism — all / no / some statements (checked over every possible Venn diagram)

Statements: `all X Y`, `no X Y`, `some X Y`, `some X not Y`. Every group is assumed non-empty.
For True/False/Cannot say use `conclusion`. For "which conclusion follows" use
`option_statements` (one per option; `null` = "none of these"), plus optional `mode`:
`must_be_true` (default), `must_be_false`, `could_be_true`, `not_necessarily_true`.

```json
"verify": { "type": "syllogism", "sets": ["M", "D", "E"], "premises": ["all M D", "some D E"], "conclusion": "some M E" }
```

### propositional — if/then logic (checked over every truth table row)

JavaScript boolean expressions over `vars`; `imp(a, b)` = "if a then b", also `iff`, `xor`.
Same `conclusion` / `option_statements` / `mode` options as `syllogism`.

```json
"verify": { "type": "propositional", "vars": ["R", "W"], "premises": ["imp(R, W)", "W"], "conclusion": "R" }
```

### visual — answers read straight off the `visual` block

| `check` | Answer | Needs |
|---|---|---|
| `odd_one_out` | number of the grid/row that differs (the others are identical) | grids or shapes |
| `match_reference` | number of the grid/row identical to `reference` | grids or shapes + reference |
| `transform` | number of the grid equal to `reference` after `transform`: `rot90` (clockwise), `rot180`, `rot270`, `flip_h` (mirror left↔right), `flip_v` (mirror top↔bottom) | grids + reference |
| `diff_count` | how many cells differ between grid `a` and grid `b` (indexes, default 0 and 1; `a` may be `"reference"`) | grids |
| `count_value` | how many cells of grid `grid` (default 0, or `"reference"`) hold `value` | grids |
| `identical_pairs_count` / `differing_pairs_count` | how many pairs are exactly identical / differ | pairs |
| `odd_pair` | number of the only pair that differs (`"which": "different"`) or the only identical one (`"which": "identical"`) | pairs |
| `table_diff_rows` / `table_diff_cells` | how many rows / cells differ between `rows` and `compare_rows` | table |
| `count_substring` | how many times `needle` occurs (`"ignore_case": true` optional) | text |

Grid/row numbers shown to the user start at 1, so options are `"1"`, `"2"`, `"3"`, `"4"`.

---

## `visual` blocks

```json
{ "type": "grids", "reference": [[1,0],[0,2]], "grids": [[[1,0],[0,2]], [[0,1],[2,0]], ...] }
```
Cells: `0` empty, `1` filled square, `2` circle, `3` cross, `4` diamond (all look the same when
rotated, so rotation questions stay fair). `reference` is optional.

```json
{ "type": "shapes", "reference": [{"shape":"triangle","rotate":90}], "rows": [[{"shape":"circle","fill":"outline","color":"blue"}, ...], ...] }
```
`shape`: circle, square, triangle, diamond, star, arrow. `fill`: solid (default) / outline.
`color`: black (default), blue, orange, gray, red, green. `rotate`: 0, 90, 180, 270 (clockwise; arrow at 0 points right, triangle at 0 points up).

```json
{ "type": "pairs", "pairs": [["GE29TB7781", "GE29TB7781"], ["Rustaveli Ave 14", "Rustaveli Ave 41"]] }
```

```json
{ "type": "table",
  "columns": [{"ka": "კოდი", "en": "Code"}, {"ka": "ფასი", "en": "Price"}],
  "rows": [["A-17", "45.50"], ["B-03", "12.00"]],
  "compare_rows": [["A-17", "45.05"], ["B-03", "12.00"]] }
```
With `compare_rows` the app shows two tables, "Original" and "Copy".

```json
{ "type": "text", "text": "Any string shown in a monospace box (or {\"ka\": \"...\", \"en\": \"...\"})" }
```

---

## Writing rules

* Both languages ask exactly the same thing. Write every number as digits in both, with `.` as
  the decimal point and no thousands separators (`1250`, not `1,250`). The validator compares
  the numbers in `question_ka` and `question_en` and fails on a mismatch for computable formats.
* The answer must hold in both languages — no spelling, rhyme, or letter tricks that only work
  in one of them.
* Exactly one defensible answer. Wrong options should be the answers people get when they
  fall into the trap, not random numbers.
* About one minute per question: passages under ~120 words.
* Georgian: natural modern literary Georgian, not word-for-word translation. Georgian names in
  `question_ka` (ნინო, გიორგი) and their transliteration in `question_en` (Nino, Giorgi).
* The explanation shows the steps and names the trap in one sentence.

## Adding a pattern tag

Add an entry to the module's file in `public/data/patterns/` (or `common.json` if several
modules share it):

```json
"successive_percent": {
  "name_en": "Successive percentages multiply",
  "name_ka": "ზედიზედ პროცენტები მრავლდება",
  "rule_en": "+20% then -20% is not 0%: 1.2 × 0.8 = 0.96, a 4% drop.",
  "rule_ka": "+20% და შემდეგ -20% არ არის 0%: 1.2 × 0.8 = 0.96, ანუ 4%-იანი კლება."
}
```
