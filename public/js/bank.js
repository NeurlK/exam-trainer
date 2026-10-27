// Loads the question bank and picks questions for a run.

async function fetchJson(url, fallback) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    if (fallback !== undefined) return fallback;
    throw new Error(`${url}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function loadBank() {
  const config = await fetchJson('data/modules.json');
  const ids = config.modules.map(m => m.id);
  const [patternFiles, questionFiles] = await Promise.all([
    Promise.all(['common', ...ids].map(id => fetchJson(`data/patterns/${id}.json`, {}))),
    Promise.all(ids.map(id => fetchJson(`data/questions/${id}.json`, []))),
  ]);
  const byId = new Map();
  const questions = {};
  ids.forEach((id, i) => {
    questions[id] = questionFiles[i];
    for (const q of questionFiles[i]) byId.set(q.id, q);
  });
  return {
    settings: config.settings,
    modules: new Map(config.modules.map(m => [m.id, m])),
    exams: config.exams,
    patterns: Object.assign({}, ...patternFiles),
    questions,
    byId,
  };
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const optText = (o, lang) => (typeof o === 'string' ? o : o[lang]);

// First number in an option's text, for sorting; "5/36" counts as a fraction.
function firstNumber(s) {
  const m = String(s).replace(/−/g, '-').replace(/(\d),(?=\d{3}(?!\d))/g, '$1')
    .match(/(?<![A-Za-z0-9])(-?\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?/);
  if (!m) return NaN;
  return m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]);
}

// Display order of a question's options, as indexes into q.options.
export function optionOrder(q) {
  const idx = q.options.map((_, i) => i);
  if (q.options.length === 3 || q.fixed_order) return idx;
  const nums = q.options.map(o => firstNumber(optText(o, 'en')));
  if (nums.every(Number.isFinite) && new Set(nums).size === nums.length) return idx.sort((a, b) => nums[a] - nums[b]);
  return shuffle(idx);
}

// Per-question and per-pattern statistics over the whole history.
export function computeStats(history) {
  const questions = {};
  const patterns = {};
  for (const attempt of history) {
    for (const mod of attempt.modules) {
      for (const it of mod.items) {
        const q = (questions[it.qid] ??= { seen: 0, correct: 0, lastCorrect: false });
        q.seen++;
        if (it.isCorrect) q.correct++;
        q.lastCorrect = it.isCorrect;
        const p = (patterns[it.pattern] ??= { seen: 0, wrong: 0, blank: 0, modules: new Set(), lastMistake: 0 });
        p.seen++;
        p.modules.add(it.module);
        if (!it.isCorrect) {
          if (it.answer === null) p.blank++;
          else p.wrong++;
          p.lastMistake = Math.max(p.lastMistake, attempt.finishedAt ?? attempt.startedAt);
        }
      }
    }
  }
  return { questions, patterns };
}

// Patterns with at least one mistake, worst first.
export function weakPatterns(stats) {
  return Object.entries(stats.patterns)
    .map(([tag, p]) => ({ tag, ...p, mistakes: p.wrong + p.blank, accuracy: (p.seen - p.wrong - p.blank) / p.seen }))
    .filter(p => p.mistakes > 0)
    .sort((a, b) => b.mistakes - a.mistakes || a.accuracy - b.accuracy || b.lastMistake - a.lastMistake);
}

// Least-seen first (random among equals), capped per format and per pattern for variety.
export function pickForModule(bank, moduleId, n, stats) {
  const seen = id => stats.questions[id]?.seen ?? 0;
  const pool = shuffle(bank.questions[moduleId]).sort((a, b) => seen(a.id) - seen(b.id));
  const picked = [];
  const perFormat = {};
  const perTag = {};
  const formatCap = Math.max(3, Math.ceil(n / 3));
  for (const q of pool) {
    if (picked.length === n) break;
    if ((perFormat[q.format] ?? 0) >= formatCap || (perTag[q.pattern_tag] ?? 0) >= 3) continue;
    picked.push(q);
    perFormat[q.format] = (perFormat[q.format] ?? 0) + 1;
    perTag[q.pattern_tag] = (perTag[q.pattern_tag] ?? 0) + 1;
  }
  for (const q of pool) {
    if (picked.length === n) break;
    if (!picked.includes(q)) picked.push(q);
  }
  return shuffle(picked).map(q => q.id);
}

// Questions from weak patterns only: round-robin over patterns, worst pattern first,
// preferring questions not yet answered correctly.
export function pickWeak(bank, stats, n, moduleFilter) {
  const weak = weakPatterns(stats);
  const all = Object.values(bank.questions).flat().filter(q => !moduleFilter || moduleFilter.includes(q.module));
  const rank = q => {
    const s = stats.questions[q.id];
    if (!s) return 1;            // never seen
    if (!s.lastCorrect) return 0; // got it wrong last time
    return 2 + s.correct;         // already solved
  };
  const queues = weak
    .map(p => ({ tag: p.tag, list: shuffle(all.filter(q => q.pattern_tag === p.tag)).sort((a, b) => rank(a) - rank(b)) }))
    .filter(x => x.list.length);
  const picked = [];
  while (picked.length < n && queues.some(x => x.list.length)) {
    for (const x of queues) {
      if (picked.length === n) break;
      const q = x.list.shift();
      if (q) picked.push(q);
    }
  }
  return { qids: shuffle(picked).map(q => q.id), tags: queues.map(x => x.tag) };
}
