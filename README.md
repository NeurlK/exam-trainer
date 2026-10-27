# Exam Trainer

A practice app for the TestGorilla-style admission exam, in Georgian (default) and English.
It runs on your own laptop; nothing is sent anywhere.

## Start it

In a terminal, inside the `exam-trainer` folder:

```bash
npm start
```

Your browser opens at <http://localhost:8765>. Leave the terminal window open while you practise;
press `Ctrl + C` in it to stop the app. The only requirement is Node.js 18 or newer
(<https://nodejs.org>); there is nothing else to install.

## Modes

| Mode | What happens |
|---|---|
| **Full mock exam** | Programming or AI: 5 modules in a row, 12 questions and 12 minutes each. You can't go back to a finished module. Between modules the break clock runs — 10 minutes in total for the whole exam. |
| **Single module** | One module, 12 random questions, 12 minutes. Questions you've seen least come first. |
| **Weak spots** | 12 questions drawn only from the question types (patterns) you got wrong or left blank before. Appears once you have some mistakes. |

### How the timers behave

* The first module's timer starts **only when you press Start** on its intro screen.
* Inside a module you can skip questions and jump back with the numbered buttons.
* When the timer hits zero your answers are saved and you move on.
* **Breaks follow the official guide (10.6.2026):** as soon as a module ends, the break clock
  starts on its own and runs until you press "Start next module". The 10 minutes are shared
  across the whole exam. When they run out, the next module starts by itself, and once the break
  is used up later modules start immediately. *(The guide doesn't say what happens at zero
  break time; starting the next module is my assumption.)*
* The timers follow the real clock: reloading the page or switching tabs does not pause them.
* Results show "time without breaks": in the real exam, two people with the same final score are
  ranked by how fast they finished, and break time doesn't count.

### How it compares with the real exam

The Programming and AI mock exams use the same five modules as the official guide. The Design
and Management/IT-support exams are not in the app: they need modules it has no questions for
(leadership & communication; computer literacy for designers; separate text and visual
attention-to-detail).

Keyboard during a module: `1`–`4` choose an answer, `←` `→` move between questions, `F` flags a
question. Clicking the chosen answer again clears it.

### Results and history

After every run you get the score per module, time used, and a review of every question: your
answer, the correct one, the explanation, and the reasoning pattern behind it.
**History** shows scores over time per module and your most frequent mistake patterns.

History is stored in this browser, for this address only (`localhost:8765`). Another browser,
an incognito window, or clearing site data starts empty. Use **History → Export** now and then
as a backup; **Import** merges an exported file back in.

## Adding more questions

1. Open the module's file in `public/data/questions/` — e.g. `critical_thinking.json`.
2. Copy an existing question (from `{` to `}`) and paste it before the final `]`, with a comma
   between questions.
3. Give it the next free `id` (e.g. `CT-046`) and change the texts, options, `correct`
   (0 = first option, 1 = second, …) and explanations. Keep `module` the same as the file name.
4. If it's a computable question (math, series, ordering, visual…), update its `verify` block
   so the answer can be re-checked automatically.
5. Check everything (in the `exam-trainer` folder):

   ```bash
   npm run validate
   ```

   It must end with `✓ Validation passed`. If it prints `WRONG ANSWER`, the stored answer
   doesn't match what the recipe computes — fix whichever one is wrong.
6. Reload the page in Chrome. New questions are used immediately.

The full field reference, every `verify` recipe and the visual formats are in
[docs/QUESTION_FORMAT.md](docs/QUESTION_FORMAT.md). New reasoning-pattern tags go in
`public/data/patterns/`. The easiest route: ask Claude to "add 10 critical thinking
questions following docs/QUESTION_FORMAT.md and run the validator".

## Files

| Path | What it is |
|---|---|
| `public/data/questions/*.json` | The question bank, one file per module |
| `public/data/patterns/*.json` | Reasoning-pattern names and rules (shown in reviews and History) |
| `public/data/modules.json` | Module names, which modules each exam has, timings (12 questions / 720 s / 600 s break) |
| `scripts/validate.mjs` | The checker: structure, both languages, and recomputed answers |
| `NEEDS_REVIEW.md` | Questions whose answers can't be computed and that deserve a human look |
| `public/js/`, `public/css/` | The app itself |
| `server.mjs` | The tiny local web server behind `npm start` |

## Practice tip: shorter timers

Add `?moduleSeconds=480` to the address (e.g. `http://localhost:8765/?moduleSeconds=480`) to run
modules with 8 minutes instead of 12 — useful for building speed. `breakSeconds` works the same way
for the break budget. The setting applies to runs started from that address.
