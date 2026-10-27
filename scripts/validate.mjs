#!/usr/bin/env node
// Validates the question bank: structure, both translations, and — for every
// question with a `verify` block — recomputes the answer and checks it against
// the stored `correct` option. Exits with code 1 if anything is wrong.
//
//   node scripts/validate.mjs                      every module
//   node scripts/validate.mjs intermediate_math    only the listed module(s)
//   node scripts/validate.mjs --min 0              skip the 40-questions-per-module rule
//   node scripts/validate.mjs --verbose            print every warning
//
// The question format is documented in docs/QUESTION_FORMAT.md.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
let dataDir = path.join(ROOT, 'public', 'data');
let minPerModule = 40;
let verbose = false;
const onlyModules = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--min') minPerModule = Number(argv[++i]);
  else if (a === '--data') dataDir = path.resolve(argv[++i]);
  else if (a === '--verbose' || a === '-v') verbose = true;
  else onlyModules.push(a);
}

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}  ${msg}`);
const warn = (where, msg) => warnings.push(`${where}  ${msg}`);

// ---------------------------------------------------------------- constants

// required = the answer must be recomputable, so a `verify` block is mandatory.
const FORMATS = {
  number_series: 'required', letter_series: 'required', ordering_puzzle: 'required',
  percentage: 'required', ratio: 'required', equation: 'required', arithmetic: 'required',
  word_problem: 'required', data_table: 'required', probability: 'required',
  counting: 'required', coding_decoding: 'required', syllogism: 'required',
  conditional_logic: 'required', string_compare: 'required', table_compare: 'required',
  visual_grid: 'required', visual_shapes: 'required',
  rule_scenario: 'optional', step_sequence: 'optional', tfc_passage: 'optional',
  strengthen_weaken: 'manual', assumption: 'manual', argument_flaw: 'manual',
  inference: 'manual', workplace_task: 'manual', analogy: 'manual', vocabulary: 'manual',
  odd_one_out: 'manual', sentence_completion: 'manual', reading_comprehension: 'manual',
};

const TFC = [
  { en: 'True', ka: 'მართალია' },
  { en: 'False', ka: 'მცდარია' },
  { en: 'Cannot say', ka: 'ვერ ვიტყვით' },
];

const GRID_MAX_VALUE = 4; // 0 empty, 1 filled square, 2 circle, 3 cross, 4 diamond
const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'arrow'];
const FILLS = ['solid', 'outline'];
const COLORS = ['black', 'blue', 'orange', 'gray', 'red', 'green'];
const ROTATIONS = [0, 90, 180, 270];
const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const KNOWN_FIELDS = new Set([
  'id', 'module', 'difficulty', 'format', 'pattern_tag', 'question_ka', 'question_en',
  'options', 'correct', 'explanation_ka', 'explanation_en', 'verify', 'visual', 'fixed_order',
]);
const REQUIRED_FIELDS = [...KNOWN_FIELDS].filter(f => !['verify', 'visual', 'fixed_order'].includes(f));

// ---------------------------------------------------------------- helpers

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    err(path.relative(ROOT, file), `cannot read JSON: ${e.message}`);
    return null;
  }
}

const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const hasGeorgian = s => /[ა-ჿ]/.test(String(s));
const optText = (o, lang) => (typeof o === 'string' ? o : o?.[lang]);
const letter = i => 'ABCD'[i] ?? String(i);
const norm = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim().replace(/\.$/, '');
const fmt = v => (typeof v === 'string' ? JSON.stringify(v) : String(v));

function cleanNumbers(s) {
  return String(s).replace(/−/g, '-').replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
}

function firstNumber(s) {
  if (typeof s === 'number') return s;
  const m = cleanNumbers(s).match(/(?<![A-Za-z0-9])-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}

function numbersIn(s) {
  return (cleanNumbers(s).match(/\d+(?:\.\d+)?/g) || []).map(Number);
}

const sortedKey = arr => [...arr].sort((a, b) => a - b).join(',');

function sameNum(a, b, round) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  if (round != null) {
    const f = 10 ** round;
    return Math.round(a * f + 1e-9) === Math.round(b * f + 1e-9);
  }
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

// Runs author-written verification code in an isolated context with a time limit.
function sandbox(where, code, bindings = {}) {
  try {
    const ctx = vm.createContext(structuredClone(bindings));
    return vm.runInContext(code, ctx, { timeout: 3000 });
  } catch (e) {
    err(where, `verify code failed: ${e.message}`);
    return undefined;
  }
}

function matchingOptions(q, v, value) {
  const hits = [];
  q.options.forEach((opt, i) => {
    let ok;
    if (typeof value === 'number') {
      const ov = v.option_values ? Number(v.option_values[i]) : firstNumber(optText(opt, 'en'));
      ok = sameNum(value, ov, v.round);
    } else {
      const candidates = v.option_values ? [v.option_values[i]] : [optText(opt, 'en'), optText(opt, 'ka')];
      ok = candidates.some(c => c != null && norm(c) === norm(value));
    }
    if (ok) hits.push(i);
  });
  return hits;
}

function expectAnswer(where, q, v, value) {
  if (value === undefined) return; // the sandbox already reported why
  if (typeof value !== 'number' && typeof value !== 'string') {
    return err(where, `verify produced a ${typeof value}; it must produce a number or a string`);
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return err(where, `verify produced ${value}`);
  const hits = matchingOptions(q, v, value);
  if (hits.length === 0) err(where, `computed answer ${fmt(value)} matches none of the options`);
  else if (hits.length > 1) err(where, `computed answer ${fmt(value)} matches several options: ${hits.map(letter).join(', ')}`);
  else if (hits[0] !== q.correct) {
    err(where, `WRONG ANSWER: computed ${fmt(value)} is option ${letter(hits[0])}, but "correct" points to ${letter(q.correct)}`);
  }
}

// ---------------------------------------------------------------- verify: series

function verifySeries(where, q, v) {
  const terms = v.terms;
  if (!Array.isArray(terms) || terms.length < 3) return err(where, 'series: "terms" needs at least 3 entries');
  const unknown = terms.flatMap((t, i) => (t === null ? [i] : []));
  if (unknown.length !== 1) return err(where, 'series: "terms" must contain exactly one null (the term being asked for)');
  const letters = v.alphabet === 'latin';
  const toNum = t => (letters ? LATIN.indexOf(String(t).toUpperCase()) + 1 : t);
  const toOut = n => (letters ? LATIN[(((n - 1) % 26) + 26) % 26] : n);
  const known = terms.map(t => (t === null ? null : toNum(t)));
  if (letters && known.some(t => t === 0)) return err(where, 'series: letter terms must be single Latin letters');

  let computed;
  if (v.rule) {
    computed = sandbox(where, `const f = (${v.rule}); Array.from({ length: ${terms.length} }, (_, i) => f(i + 1))`);
  } else if (v.rec) {
    const seeds = v.seeds ?? 1;
    if (known.slice(0, seeds).some(t => t === null)) return err(where, 'series: the asked term cannot be one of the seed terms');
    computed = sandbox(where,
      `const f = (${v.rec}); const t = ${JSON.stringify(known.slice(0, seeds))};
       for (let i = ${seeds}; i < ${terms.length}; i++) t.push(f(t, i));
       t`);
  } else {
    return err(where, 'series: needs "rule" (closed form, n starts at 1) or "rec" (recurrence)');
  }
  if (!computed) return;

  const eq = (a, b) => (letters ? (((a - b) % 26) + 26) % 26 === 0 : sameNum(a, b));
  for (let i = 0; i < terms.length; i++) {
    if (known[i] !== null && !eq(computed[i], known[i])) {
      return err(where, `series: rule gives ${toOut(computed[i])} at position ${i + 1}, but the series shows ${terms[i]}`);
    }
  }
  expectAnswer(where, q, v, toOut(computed[unknown[0]]));

  // The shown terms must really be the ones in the question text (both languages).
  if (!letters) {
    const shown = terms.filter(t => t !== null).map(Math.abs);
    for (const lang of ['en', 'ka']) {
      let k = 0;
      for (const n of numbersIn(q[`question_${lang}`])) if (k < shown.length && sameNum(n, shown[k])) k++;
      if (k < shown.length) err(where, `series: question_${lang} does not show the terms ${JSON.stringify(terms)} in order`);
    }
  }
}

// ---------------------------------------------------------------- verify: ordering

function verifyOrdering(where, q, v) {
  const { items, constraints, ask } = v;
  if (!Array.isArray(items) || items.length < 2 || items.length > 8) return err(where, 'ordering: "items" needs 2–8 names');
  if (!items.every(x => /^[A-Za-z_][A-Za-z0-9_]*$/.test(x))) return err(where, 'ordering: item names must be plain ASCII identifiers');
  if (!Array.isArray(constraints) || !constraints.length) return err(where, 'ordering: "constraints" must be a non-empty array');
  if (typeof ask !== 'string') return err(where, 'ordering: "ask" must be a function like "(order, pos) => order[0]"');

  const res = sandbox(where, `
    const items = ${JSON.stringify(items)};
    const rules = [${constraints.map(c => `(pos, order) => (${c})`).join(',\n')}];
    const ask = (${ask});
    const answers = new Set();
    let count = 0;
    const used = items.map(() => false), order = [];
    const walk = () => {
      if (order.length === items.length) {
        const pos = {};
        order.forEach((x, i) => { pos[x] = i; });
        if (rules.every(r => r(pos, order))) { count++; answers.add(ask(order.slice(), pos)); }
        return;
      }
      for (let i = 0; i < items.length; i++) {
        if (!used[i]) { used[i] = true; order.push(items[i]); walk(); order.pop(); used[i] = false; }
      }
    };
    walk();
    ({ count, answers: [...answers] });
  `);
  if (!res) return;
  if (res.count === 0) return err(where, 'ordering: no arrangement satisfies all constraints');
  if (v.unique_arrangement && res.count !== 1) err(where, `ordering: expected exactly 1 valid arrangement, found ${res.count}`);
  const answers = [...res.answers];
  if (answers.length === 1) return expectAnswer(where, q, v, answers[0]);
  if (v.undetermined_option != null) {
    if (q.correct !== v.undetermined_option) {
      err(where, `ordering: the answer is not determined (${answers.map(fmt).join(' / ')}), so the correct option must be ${letter(v.undetermined_option)}`);
    }
    return;
  }
  err(where, `ordering: ${res.count} valid arrangements give different answers: ${answers.map(fmt).join(' / ')}`);
}

// ---------------------------------------------------------------- verify: logic

// Status of a statement given the premises: 'true' (in every model), 'false' (in none), 'unknown'.
function statusFromCounts(t, f) {
  if (f === 0) return 'true';
  if (t === 0) return 'false';
  return 'unknown';
}

const MODE_TEST = {
  must_be_true: s => s === 'true',
  must_be_false: s => s === 'false',
  could_be_true: s => s !== 'false',
  not_necessarily_true: s => s !== 'true',
};

function checkStatuses(where, q, v, statuses) {
  if (v.conclusion !== undefined) {
    if (q.options.length !== 3) return err(where, 'logic: "conclusion" is for True/False/Cannot-say questions (3 options)');
    const idx = { true: 0, false: 1, unknown: 2 }[statuses[0]];
    if (idx !== q.correct) err(where, `WRONG ANSWER: the conclusion is ${statuses[0]} given the premises, so the answer is ${TFC[idx].en}`);
    return;
  }
  const mode = v.mode ?? 'must_be_true';
  const test = MODE_TEST[mode];
  if (!test) return err(where, `logic: unknown mode "${mode}"`);
  if (v.option_statements.length !== q.options.length) return err(where, 'logic: "option_statements" needs one entry per option');
  const hits = statuses.flatMap((s, i) => (s !== null && test(s) ? [i] : []));
  const noneIdx = v.option_statements.indexOf(null);
  let expected;
  if (hits.length === 1) expected = hits[0];
  else if (hits.length === 0 && noneIdx >= 0) expected = noneIdx;
  else return err(where, `logic: ${hits.length} options satisfy "${mode}" (${hits.map(letter).join(', ') || 'none'}); exactly one must`);
  if (expected !== q.correct) err(where, `WRONG ANSWER: option ${letter(expected)} is the one that satisfies "${mode}", but "correct" is ${letter(q.correct)}`);
}

function verifySyllogism(where, q, v) {
  const sets = v.sets;
  if (!Array.isArray(sets) || sets.length < 2 || sets.length > 4) return err(where, 'syllogism: "sets" needs 2–4 names');
  const idx = Object.fromEntries(sets.map((s, i) => [s, i]));
  const parse = s => {
    const t = String(s).trim().split(/\s+/);
    let st;
    if (t.length === 3 && ['all', 'no', 'some'].includes(t[0])) st = { q: t[0], x: t[1], y: t[2] };
    else if (t.length === 4 && t[0] === 'some' && t[2] === 'not') st = { q: 'somenot', x: t[1], y: t[3] };
    if (!st || !(st.x in idx) || !(st.y in idx)) throw new Error(`cannot parse statement "${s}" (use: all X Y | no X Y | some X Y | some X not Y)`);
    return st;
  };
  let premises, statements;
  try {
    premises = v.premises.map(parse);
    statements = v.conclusion !== undefined ? [parse(v.conclusion)] : v.option_statements.map(s => (s === null ? null : parse(s)));
  } catch (e) {
    return err(where, `syllogism: ${e.message}`);
  }
  const k = sets.length;
  const regions = (1 << k) - 1; // regions 1..2^k-1, region r = sets whose bit is on
  const inside = (r, s) => ((r >> idx[s]) & 1) === 1;
  const holds = (st, m) => {
    let anyBoth = false, anyXnotY = false;
    for (let r = 1; r <= regions; r++) {
      if (!((m >> (r - 1)) & 1)) continue;
      const x = inside(r, st.x), y = inside(r, st.y);
      if (x && y) anyBoth = true;
      if (x && !y) anyXnotY = true;
    }
    return { all: !anyXnotY, no: !anyBoth, some: anyBoth, somenot: anyXnotY }[st.q];
  };
  const existential = v.existential !== false;
  const counts = statements.map(() => ({ t: 0, f: 0 }));
  let models = 0;
  for (let m = 0; m < 2 ** regions; m++) {
    if (existential && !sets.every(s => { for (let r = 1; r <= regions; r++) if (((m >> (r - 1)) & 1) && inside(r, s)) return true; return false; })) continue;
    if (!premises.every(p => holds(p, m))) continue;
    models++;
    statements.forEach((st, i) => { if (st) holds(st, m) ? counts[i].t++ : counts[i].f++; });
  }
  if (!models) return err(where, 'syllogism: the premises contradict each other');
  checkStatuses(where, q, v, statements.map((st, i) => (st ? statusFromCounts(counts[i].t, counts[i].f) : null)));
}

function verifyPropositional(where, q, v) {
  const vars = v.vars;
  if (!Array.isArray(vars) || !vars.length || vars.length > 8 || !vars.every(x => /^[A-Za-z_]\w*$/.test(x))) {
    return err(where, 'propositional: "vars" needs 1–8 identifier names');
  }
  const statements = v.conclusion !== undefined ? [v.conclusion] : v.option_statements;
  const fn = s => `(${vars.join(',')}) => (${s})`;
  const res = sandbox(where, `
    const imp = (a, b) => !a || b, iff = (a, b) => a === b, xor = (a, b) => a !== b;
    const premises = [${v.premises.map(fn).join(',')}];
    const stmts = [${statements.map(s => (s === null ? 'null' : fn(s))).join(',')}];
    const out = stmts.map(() => ({ t: 0, f: 0 }));
    let models = 0;
    for (let m = 0; m < ${1 << vars.length}; m++) {
      const vals = ${JSON.stringify(vars)}.map((_, i) => ((m >> i) & 1) === 1);
      if (!premises.every(p => p(...vals))) continue;
      models++;
      stmts.forEach((s, i) => { if (s) { if (s(...vals)) out[i].t++; else out[i].f++; } });
    }
    ({ models, out });
  `);
  if (!res) return;
  if (!res.models) return err(where, 'propositional: the premises contradict each other');
  checkStatuses(where, q, v, statements.map((s, i) => (s === null ? null : statusFromCounts(res.out[i].t, res.out[i].f))));
}

// ---------------------------------------------------------------- verify: visual

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const normShape = s => ({ shape: s.shape, fill: s.fill ?? 'solid', color: s.color ?? 'black', rotate: s.rotate ?? 0 });
const normRow = row => row.map(normShape);

function transformGrid(g, t) {
  const R = g.length, C = g[0].length;
  switch (t) {
    case 'rot90': return Array.from({ length: C }, (_, i) => Array.from({ length: R }, (_, j) => g[R - 1 - j][i]));
    case 'rot270': return Array.from({ length: C }, (_, i) => Array.from({ length: R }, (_, j) => g[j][C - 1 - i]));
    case 'rot180': return g.slice().reverse().map(r => r.slice().reverse());
    case 'flip_h': return g.map(r => r.slice().reverse());
    case 'flip_v': return g.slice().reverse();
    default: return null;
  }
}

function verifyVisual(where, q, v) {
  const vis = q.visual;
  if (!isObj(vis)) return err(where, 'visual verify needs a "visual" block');
  const items = vis.type === 'grids' ? vis.grids : vis.type === 'shapes' ? vis.rows.map(normRow) : null;
  const ref = vis.type === 'shapes' && vis.reference ? normRow(vis.reference) : vis.reference;
  const onlyOne = (list, label) => {
    if (list.length !== 1) { err(where, `visual: ${list.length} items are ${label}; exactly one must be`); return undefined; }
    return list[0] + 1;
  };
  let answer;
  switch (v.check) {
    case 'odd_one_out': {
      if (!items) return err(where, 'odd_one_out needs grids or shapes');
      const odd = items.flatMap((it, i) => {
        const others = items.filter((_, j) => j !== i);
        return others.every(o => sameJson(o, others[0])) && !sameJson(it, others[0]) ? [i] : [];
      });
      answer = onlyOne(odd, 'the odd one out (all others identical)');
      break;
    }
    case 'match_reference': {
      if (!items || !ref) return err(where, 'match_reference needs a reference and grids/shapes');
      answer = onlyOne(items.flatMap((it, i) => (sameJson(it, ref) ? [i] : [])), 'identical to the reference');
      break;
    }
    case 'transform': {
      if (vis.type !== 'grids' || !ref) return err(where, 'transform needs grids and a reference');
      const target = transformGrid(ref, v.transform);
      if (!target) return err(where, `unknown transform "${v.transform}" (rot90, rot180, rot270, flip_h, flip_v)`);
      answer = onlyOne(items.flatMap((it, i) => (sameJson(it, target) ? [i] : [])), `equal to the reference after ${v.transform}`);
      break;
    }
    case 'diff_count': {
      if (vis.type !== 'grids') return err(where, 'diff_count needs grids');
      const a = v.a === 'reference' ? ref : vis.grids[v.a ?? 0];
      const b = vis.grids[v.b ?? 1];
      if (!a || !b || a.length !== b.length || a[0].length !== b[0].length) return err(where, 'diff_count: grids must exist and have the same size');
      answer = a.flatMap((row, r) => row.filter((c, j) => c !== b[r][j])).length;
      break;
    }
    case 'count_value': {
      if (vis.type !== 'grids') return err(where, 'count_value needs grids');
      const g = v.grid === 'reference' ? ref : vis.grids[v.grid ?? 0];
      if (!g) return err(where, 'count_value: grid not found');
      answer = g.flat().filter(c => c === v.value).length;
      break;
    }
    case 'identical_pairs_count':
    case 'differing_pairs_count': {
      if (vis.type !== 'pairs') return err(where, `${v.check} needs pairs`);
      const same = vis.pairs.filter(([x, y]) => x === y).length;
      answer = v.check === 'identical_pairs_count' ? same : vis.pairs.length - same;
      break;
    }
    case 'odd_pair': {
      if (vis.type !== 'pairs') return err(where, 'odd_pair needs pairs');
      const want = v.which === 'identical';
      answer = onlyOne(vis.pairs.flatMap(([x, y], i) => ((x === y) === want ? [i] : [])), want ? 'identical pairs' : 'differing pairs');
      break;
    }
    case 'table_diff_rows':
    case 'table_diff_cells': {
      if (vis.type !== 'table' || !vis.compare_rows) return err(where, `${v.check} needs a table with compare_rows`);
      const diffs = vis.rows.map((row, r) => row.filter((c, j) => !sameJson(c, vis.compare_rows[r][j])).length);
      answer = v.check === 'table_diff_rows' ? diffs.filter(n => n > 0).length : diffs.reduce((s, n) => s + n, 0);
      break;
    }
    case 'count_substring': {
      if (vis.type !== 'text') return err(where, 'count_substring needs a text visual');
      const counts = ['ka', 'en'].map(l => {
        let text = typeof vis.text === 'string' ? vis.text : vis.text[l];
        let needle = v.needle;
        if (v.ignore_case) { text = text.toLowerCase(); needle = needle.toLowerCase(); }
        return text.split(needle).length - 1;
      });
      if (counts[0] !== counts[1]) return err(where, `count_substring: ka text has ${counts[0]}, en text has ${counts[1]}`);
      answer = counts[0];
      break;
    }
    default:
      return err(where, `visual: unknown check "${v.check}"`);
  }
  if (answer !== undefined) expectAnswer(where, q, v, answer);
}

function checkVisual(where, vis) {
  if (!isObj(vis)) return err(where, '"visual" must be an object');
  const isGrid = g => Array.isArray(g) && g.length > 0 && Array.isArray(g[0]) && g[0].length > 0
    && g.every(r => Array.isArray(r) && r.length === g[0].length && r.every(c => Number.isInteger(c) && c >= 0 && c <= GRID_MAX_VALUE));
  const checkShape = (s, label) => {
    if (!isObj(s) || !SHAPES.includes(s.shape)) return err(where, `${label}: shape must be one of ${SHAPES.join(', ')}`);
    if (s.fill !== undefined && !FILLS.includes(s.fill)) err(where, `${label}: fill must be ${FILLS.join('/')}`);
    if (s.color !== undefined && !COLORS.includes(s.color)) err(where, `${label}: color must be one of ${COLORS.join(', ')}`);
    if (s.rotate !== undefined && !ROTATIONS.includes(s.rotate)) err(where, `${label}: rotate must be 0, 90, 180 or 270`);
  };
  switch (vis.type) {
    case 'grids':
      if (!Array.isArray(vis.grids) || vis.grids.length < 1) return err(where, 'grids visual needs "grids"');
      [...vis.grids, ...(vis.reference ? [vis.reference] : [])].forEach((g, i) => {
        if (!isGrid(g)) err(where, `grid ${i + 1} must be a rectangular array of integers 0–${GRID_MAX_VALUE}`);
      });
      break;
    case 'shapes':
      if (!Array.isArray(vis.rows) || vis.rows.length < 2) return err(where, 'shapes visual needs at least 2 "rows"');
      [...vis.rows, ...(vis.reference ? [vis.reference] : [])].forEach((row, i) => {
        if (!Array.isArray(row) || !row.length) return err(where, `shape row ${i + 1} is empty`);
        row.forEach((s, j) => checkShape(s, `row ${i + 1} shape ${j + 1}`));
      });
      break;
    case 'pairs':
      if (!Array.isArray(vis.pairs) || !vis.pairs.length) return err(where, 'pairs visual needs "pairs"');
      vis.pairs.forEach((p, i) => {
        if (!Array.isArray(p) || p.length !== 2 || !p.every(s => typeof s === 'string')) err(where, `pair ${i + 1} must be [string, string]`);
      });
      break;
    case 'table': {
      if (!Array.isArray(vis.columns) || !Array.isArray(vis.rows)) return err(where, 'table visual needs "columns" and "rows"');
      const w = vis.columns.length;
      const checkRows = (rows, label) => rows.forEach((r, i) => {
        if (!Array.isArray(r) || r.length !== w) err(where, `${label} row ${i + 1} must have ${w} cells`);
      });
      checkRows(vis.rows, 'table');
      if (vis.compare_rows) {
        if (vis.compare_rows.length !== vis.rows.length) err(where, 'compare_rows must have as many rows as rows');
        checkRows(vis.compare_rows, 'compare_rows');
      }
      break;
    }
    case 'text':
      if (typeof vis.text !== 'string' && !(isObj(vis.text) && typeof vis.text.ka === 'string' && typeof vis.text.en === 'string')) {
        err(where, 'text visual needs "text" (a string, or {ka, en})');
      }
      break;
    default:
      err(where, `unknown visual type "${vis.type}" (grids, shapes, pairs, table, text)`);
  }
}

// ---------------------------------------------------------------- verify: dispatch

function runVerify(where, q) {
  const v = q.verify;
  if (!isObj(v)) return err(where, '"verify" must be an object');
  switch (v.type) {
    case 'numeric':
      if (typeof v.expr !== 'string') return err(where, 'numeric verify needs "expr"');
      return expectAnswer(where, q, v, sandbox(where, v.expr));
    case 'compute':
      if (typeof v.fn !== 'string') return err(where, 'compute verify needs "fn"');
      return expectAnswer(where, q, v, sandbox(where, `(${v.fn})(q)`, { q }));
    case 'series': return verifySeries(where, q, v);
    case 'ordering': return verifyOrdering(where, q, v);
    case 'syllogism': return verifySyllogism(where, q, v);
    case 'propositional': return verifyPropositional(where, q, v);
    case 'visual': return verifyVisual(where, q, v);
    default: return err(where, `unknown verify type "${v.type}"`);
  }
}

// ---------------------------------------------------------------- per-question checks

function checkQuestion(q, mod, i, patterns, seenIds) {
  const where = `${mod.id}/${q?.id ?? `#${i + 1}`}`;
  if (!isObj(q)) return err(where, 'question must be an object');
  const before = errors.length;

  for (const f of REQUIRED_FIELDS) if (q[f] === undefined) err(where, `missing field "${f}"`);
  for (const f of Object.keys(q)) if (!KNOWN_FIELDS.has(f)) warn(where, `unknown field "${f}" (ignored by the app)`);

  if (typeof q.id !== 'string' || !new RegExp(`^${mod.prefix}-\\d{3}$`).test(q.id)) err(where, `id must look like ${mod.prefix}-001`);
  else if (seenIds.has(q.id)) err(where, 'duplicate id');
  seenIds.add(q.id);
  if (q.module !== mod.id) err(where, `"module" is "${q.module}" but the file is ${mod.id}.json`);
  if (![1, 2, 3].includes(q.difficulty)) err(where, 'difficulty must be 1, 2 or 3');
  const kind = FORMATS[q.format];
  if (!kind) err(where, `unknown format "${q.format}" (see docs/QUESTION_FORMAT.md)`);
  if (q.pattern_tag !== undefined && !patterns[q.pattern_tag]) err(where, `pattern_tag "${q.pattern_tag}" is not defined in data/patterns/*.json`);

  for (const f of ['question_ka', 'question_en', 'explanation_ka', 'explanation_en']) {
    if (typeof q[f] !== 'string' || !q[f].trim()) err(where, `${f} must be non-empty text`);
  }
  if (typeof q.question_ka === 'string' && !hasGeorgian(q.question_ka)) err(where, 'question_ka contains no Georgian');
  if (typeof q.explanation_ka === 'string' && !hasGeorgian(q.explanation_ka)) err(where, 'explanation_ka contains no Georgian');
  if (typeof q.explanation_en === 'string' && (q.explanation_en.match(/[ა-ჿ]/g) || []).length > q.explanation_en.length / 3) {
    err(where, 'explanation_en looks like Georgian text');
  }

  if (!Array.isArray(q.options)) {
    err(where, '"options" must be an array');
  } else {
    const n = q.options.length;
    if (n === 3) {
      q.options.forEach((o, j) => {
        if (optText(o, 'en') !== TFC[j].en || optText(o, 'ka') !== TFC[j].ka) {
          err(where, `3-option questions must use exactly: ${TFC.map(t => `{"ka":"${t.ka}","en":"${t.en}"}`).join(', ')}`);
        }
      });
    } else if (n !== 4) {
      err(where, `needs 4 options (or 3 for True/False/Cannot say); has ${n}`);
    }
    if (q.format === 'tfc_passage' && n !== 3) err(where, 'tfc_passage questions use the 3 True/False/Cannot say options');
    q.options.forEach((o, j) => {
      if (typeof o === 'string') {
        if (!o.trim()) err(where, `option ${letter(j)} is empty`);
      } else if (isObj(o)) {
        if (typeof o.ka !== 'string' || !o.ka.trim() || typeof o.en !== 'string' || !o.en.trim()) err(where, `option ${letter(j)} needs non-empty "ka" and "en"`);
        else if (!hasGeorgian(o.ka) && /[A-Za-z]{4,}/.test(o.ka) && o.ka !== o.en) warn(where, `option ${letter(j)} "ka" text has no Georgian — untranslated?`);
      } else {
        err(where, `option ${letter(j)} must be a string or {"ka", "en"}`);
      }
    });
    for (const lang of ['en', 'ka']) {
      const texts = q.options.map(o => norm(optText(o, lang) ?? ''));
      if (new Set(texts).size !== texts.length) err(where, `two options have the same ${lang} text`);
    }
  }
  if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= (q.options?.length ?? 0)) err(where, '"correct" must be a 0-based option index');

  // Numbers must match between the two languages, or one of them asks a different question.
  const report = kind === 'required' ? err : warn;
  if (typeof q.question_ka === 'string' && typeof q.question_en === 'string'
      && sortedKey(numbersIn(q.question_ka)) !== sortedKey(numbersIn(q.question_en))) {
    report(where, `numbers differ between languages — ka [${numbersIn(q.question_ka)}] vs en [${numbersIn(q.question_en)}]`);
  }
  if (Array.isArray(q.options)) {
    q.options.forEach((o, j) => {
      if (isObj(o) && sortedKey(numbersIn(o.ka ?? '')) !== sortedKey(numbersIn(o.en ?? ''))) {
        report(where, `option ${letter(j)}: numbers differ between ka and en`);
      }
    });
  }
  if (typeof q.explanation_ka === 'string' && typeof q.explanation_en === 'string'
      && sortedKey(numbersIn(q.explanation_ka)) !== sortedKey(numbersIn(q.explanation_en))) {
    warn(where, 'explanation: numbers differ between ka and en');
  }

  if (q.visual !== undefined) checkVisual(where, q.visual);
  if (['visual_grid', 'visual_shapes', 'table_compare'].includes(q.format) && q.visual === undefined) {
    err(where, `format "${q.format}" needs a "visual" block`);
  }

  if (q.verify === undefined) {
    if (kind === 'required') err(where, `format "${q.format}" needs a "verify" block so the answer can be recomputed`);
  } else if (errors.length === before) {
    runVerify(where, q); // only once the structure is sound, so failures are meaningful
  }
}

// ---------------------------------------------------------------- main

const config = readJson(path.join(dataDir, 'modules.json'));
if (!config) finish();

const patterns = {};
const patternDir = path.join(dataDir, 'patterns');
for (const file of fs.existsSync(patternDir) ? fs.readdirSync(patternDir).filter(f => f.endsWith('.json')).sort() : []) {
  const data = readJson(path.join(patternDir, file));
  if (!isObj(data)) continue;
  for (const [tag, p] of Object.entries(data)) {
    const where = `patterns/${file} ${tag}`;
    if (patterns[tag]) err(where, `tag defined twice (also in ${patterns[tag].file})`);
    if (!/^[a-z0-9_]+$/.test(tag)) err(where, 'tag must be lower_snake_case');
    for (const f of ['name_ka', 'name_en', 'rule_ka', 'rule_en']) {
      if (typeof p?.[f] !== 'string' || !p[f].trim()) err(where, `missing "${f}"`);
    }
    if (p?.name_ka && !hasGeorgian(p.name_ka)) err(where, 'name_ka contains no Georgian');
    if (p?.rule_ka && !hasGeorgian(p.rule_ka)) err(where, 'rule_ka contains no Georgian');
    patterns[tag] = { ...p, file };
  }
}

const moduleIds = new Set(config.modules.map(m => m.id));
for (const exam of config.exams) {
  for (const m of exam.modules) if (!moduleIds.has(m)) err(`modules.json exam ${exam.id}`, `unknown module "${m}"`);
}
for (const m of onlyModules) if (!moduleIds.has(m)) err('arguments', `unknown module "${m}"`);

const selected = config.modules.filter(m => !onlyModules.length || onlyModules.includes(m.id));
const seenIds = new Set();
const tagUse = {};
const textSeen = new Map();
const rows = [];

for (const mod of selected) {
  const file = path.join(dataDir, 'questions', `${mod.id}.json`);
  if (!fs.existsSync(file)) { err(mod.id, `missing file questions/${mod.id}.json`); continue; }
  const list = readJson(file);
  if (!Array.isArray(list)) { if (list) err(mod.id, 'file must contain a JSON array of questions'); continue; }

  list.forEach((q, i) => {
    checkQuestion(q, mod, i, patterns, seenIds);
    if (q?.pattern_tag) tagUse[q.pattern_tag] = (tagUse[q.pattern_tag] ?? 0) + 1;
    const key = norm(q?.question_en ?? '');
    if (key && textSeen.has(key)) err(`${mod.id}/${q.id}`, `same question text as ${textSeen.get(key)}`);
    else if (key) textSeen.set(key, q.id);
  });

  if (list.length < minPerModule) err(mod.id, `has ${list.length} questions; at least ${minPerModule} required`);
  if (list.length < 12) err(mod.id, 'needs at least 12 questions to fill one module run');

  const diff = [1, 2, 3].map(d => list.filter(q => q?.difficulty === d).length);
  const verified = list.filter(q => q?.verify).length;
  const four = list.filter(q => q?.options?.length === 4);
  const pos = [0, 1, 2, 3].map(k => four.filter(q => q.correct === k).length);
  if (four.length >= 12 && Math.max(...pos) > four.length * 0.4) {
    warn(mod.id, `correct answers lean on one position (A/B/C/D = ${pos.join('/')}); spread them out`);
  }
  rows.push([mod.id, list.length, diff.join('/'), `${verified}/${list.length}`, list.length - verified, pos.join('/')]);
}

if (!onlyModules.length) {
  for (const [tag, p] of Object.entries(patterns)) {
    if (!tagUse[tag]) warn(`patterns/${p.file} ${tag}`, 'defined but not used by any question');
  }
}
for (const [tag, n] of Object.entries(tagUse)) {
  if (n < 2 && patterns[tag]) warn(`pattern ${tag}`, 'used by only 1 question — Weak-spots practice works best with 3+');
}

finish();

function finish() {
  if (rows.length) {
    const head = ['module', 'questions', 'difficulty 1/2/3', 'auto-verified', 'manual', 'answer A/B/C/D'];
    const widths = head.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i]).length)));
    const line = r => r.map((c, i) => String(c).padEnd(widths[i])).join('  ');
    console.log(line(head));
    console.log(widths.map(w => '-'.repeat(w)).join('  '));
    rows.forEach(r => console.log(line(r)));
    console.log();
  }
  if (warnings.length) {
    console.log(`Warnings (${warnings.length}):`);
    (verbose ? warnings : warnings.slice(0, 40)).forEach(w => console.log(`  ! ${w}`));
    if (!verbose && warnings.length > 40) console.log(`  … ${warnings.length - 40} more (run with --verbose)`);
    console.log();
  }
  if (errors.length) {
    console.log(`ERRORS (${errors.length}):`);
    errors.forEach(e => console.log(`  ✗ ${e}`));
    console.log(`\n✗ Validation FAILED with ${errors.length} error(s).`);
    process.exit(1);
  }
  console.log(`✓ Validation passed — ${seenIds.size} questions, 0 errors, ${warnings.length} warning(s).`);
  process.exit(0);
}
