import { t, field, loc, optionLetter, getLang, setLang, locale } from './i18n.js';
import * as store from './store.js';
import { loadBank, optionOrder, computeStats, weakPatterns, pickForModule, pickWeak } from './bank.js';
import { renderVisual, richText, esc } from './visual.js';

const app = document.getElementById('app');
const params = new URLSearchParams(location.search);

let bank = null;
let run = null;               // the run in progress; mirrored to localStorage on every change
let view = { name: 'home' };  // home | run | history | results
let modal = null;             // 'finish' while the finish-module dialog is open

// ---------------------------------------------------------------- helpers

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const fmtDate = ts => new Date(ts).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' });
const moduleName = id => (id === 'weak' ? t('mode_weak') : field(bank.modules.get(id), 'name'));
const examName = id => field(bank.exams.find(e => e.id === id), 'name');
const patternName = tag => field(bank.patterns[tag], 'name') || tag;
const cur = () => run.modules[run.index];
const persist = () => store.saveRun(run);

function runLabel(r) {
  if (r.mode === 'mock') return `${t('mode_name_mock')} · ${examName(r.exam)}`;
  if (r.mode === 'weak') return t('mode_name_weak');
  return moduleName(r.modules[0].moduleId);
}

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), 4500);
}

// ---------------------------------------------------------------- run lifecycle

function moduleBlock(moduleId, qids) {
  const orders = Object.fromEntries(qids.map(id => [id, optionOrder(bank.byId.get(id))]));
  return { moduleId, qids, orders, answers: {}, flags: {}, current: 0, startedAt: null, deadline: null, endedAt: null, timedOut: false };
}

function startRun(mode, opts = {}) {
  if (run && !confirm(t('replace_run_confirm'))) return;
  const stats = computeStats(store.loadHistory());
  const n = bank.settings.questions_per_module;
  let modules;
  if (mode === 'module') {
    modules = [moduleBlock(opts.moduleId, pickForModule(bank, opts.moduleId, n, stats))];
  } else if (mode === 'mock') {
    const exam = bank.exams.find(e => e.id === opts.exam);
    modules = exam.modules.map(id => moduleBlock(id, pickForModule(bank, id, n, stats)));
  } else {
    const filter = opts.exam ? bank.exams.find(e => e.id === opts.exam).modules : null;
    const { qids } = pickWeak(bank, stats, n, filter);
    if (!qids.length) return toast(t('weak_none'));
    modules = [moduleBlock('weak', qids)];
  }
  run = {
    id: uid(),
    mode,
    exam: opts.exam ?? null,
    createdAt: Date.now(),
    modules: modules.filter(m => m.qids.length),
    index: 0,
    phase: 'intro',
    breakUsedMs: 0,
    breakStartedAt: null,
    moduleMs: (Number(params.get('moduleSeconds')) || bank.settings.module_seconds) * 1000,
    breakMs: (Number(params.get('breakSeconds')) || bank.settings.break_budget_seconds) * 1000,
  };
  if (!run.modules.length) { run = null; return; }
  persist();
  view = { name: 'run' };
  render();
}

// The module timer starts here and nowhere else.
function startModule(at = Date.now()) {
  const m = cur();
  m.startedAt = at;
  m.deadline = m.startedAt + run.moduleMs;
  run.phase = 'active';
  persist();
  render();
  window.scrollTo(0, 0);
}

function endModule(timedOut) {
  const m = cur();
  m.timedOut = timedOut;
  m.endedAt = timedOut ? m.deadline : Date.now();
  modal = null;
  if (run.index < run.modules.length - 1) {
    run.index++;
    if (timedOut) toast(t('time_up'));
    // Official rule: the break clock starts on its own when a module ends and runs until the
    // next module is started. With no break left, the next module starts straight away.
    if (breakLeft() > 0) {
      run.phase = 'break';
      run.breakStartedAt = m.endedAt;
      persist();
      render();
      window.scrollTo(0, 0);
    } else {
      startModule(m.endedAt);
    }
  } else {
    finishRun(timedOut);
  }
}

function breakLeft() {
  const live = run.phase === 'break' ? Date.now() - run.breakStartedAt : 0;
  return Math.max(0, run.breakMs - run.breakUsedMs - live);
}

// Ends the break and starts the next module at the moment the break really ended.
function endBreak(auto) {
  const end = Math.min(Date.now(), run.breakStartedAt + run.breakMs - run.breakUsedMs);
  run.breakUsedMs += end - run.breakStartedAt;
  run.breakStartedAt = null;
  if (auto) toast(t('break_over'));
  startModule(end);
}

function finishRun(timedOut) {
  const now = Date.now();
  const attempt = {
    id: run.id,
    mode: run.mode,
    exam: run.exam,
    startedAt: run.createdAt,
    finishedAt: now,
    breakUsedSec: Math.round(run.breakUsedMs / 1000),
    modules: run.modules.map(m => ({
      moduleId: m.moduleId,
      timeUsedSec: Math.round(Math.min(run.moduleMs, (m.endedAt ?? now) - (m.startedAt ?? now)) / 1000),
      timeLimitSec: run.moduleMs / 1000,
      timedOut: m.timedOut,
      items: m.qids.map(qid => {
        const q = bank.byId.get(qid);
        const answer = m.answers[qid] ?? null;
        return {
          qid, module: q.module, pattern: q.pattern_tag, format: q.format, difficulty: q.difficulty,
          order: m.orders[qid], answer, correct: q.correct, isCorrect: answer === q.correct, flagged: !!m.flags[qid],
        };
      }),
    })),
  };
  store.saveAttempt(attempt);
  store.clearRun();
  run = null;
  view = { name: 'results', id: attempt.id, onlyMistakes: false };
  if (timedOut) toast(t('time_up'));
  render();
  window.scrollTo(0, 0);
}

function abandonRun() {
  if (!confirm(t('abandon_confirm'))) return;
  store.clearRun();
  run = null;
  modal = null;
  view = { name: 'home' };
  render();
}

// Timers compare against wall-clock deadlines, so they stay exact in background tabs and across reloads.
function tick() {
  if (!run) return;
  if (run.phase === 'active') {
    const left = cur().deadline - Date.now();
    if (left <= 0) return endModule(true);
    const el = document.getElementById('clock');
    if (el) {
      el.textContent = fmtTime(left);
      el.closest('.clock').classList.toggle('warn', left < 120000);
      el.closest('.clock').classList.toggle('danger', left < 60000);
    }
  } else if (run.phase === 'break') {
    const left = breakLeft();
    if (left <= 0) return endBreak(true);
    const el = document.getElementById('break-clock');
    if (el) el.textContent = fmtTime(left);
  }
}

// ---------------------------------------------------------------- screens

function renderHeader() {
  const locked = run && view.name === 'run' && (run.phase === 'active' || run.phase === 'break');
  return `<header class="topbar">
    ${locked ? `<span class="brand">${t('app_title')}</span>` : `<button class="brand" data-action="home">${t('app_title')}</button>`}
    <nav>
      ${locked ? '' : `<button class="link" data-action="history">${t('nav_history')}</button>`}
      <button class="lang" data-action="lang" lang="${getLang() === 'ka' ? 'en' : 'ka'}">${t('lang_switch')}</button>
    </nav>
  </header>`;
}

function renderHome() {
  const weak = weakPatterns(computeStats(store.loadHistory()));
  const modules = [...bank.modules.values()];
  return `
  ${run ? `<div class="banner">
      <span>${t('resume_banner')} <strong>${esc(runLabel(run))}</strong></span>
      <span class="spacer"></span>
      <button class="btn primary" data-action="resume">${t('resume')}</button>
      <button class="btn ghost" data-action="abandon">${t('abandon')}</button>
    </div>` : ''}
  <section class="hero">
    <h1>${t('app_title')}</h1>
    <p class="muted">${t('app_tagline')}</p>
  </section>

  <section class="card">
    <h2>${t('mode_mock')}</h2>
    <p class="muted">${t('mode_mock_desc')}</p>
    <div class="exam-buttons">
      ${bank.exams.map(e => `<button class="tile" data-action="start-mock" data-exam="${e.id}">
        <strong>${esc(field(e, 'name'))}</strong>
        <span class="muted">${e.modules.map(id => esc(moduleName(id))).join(' · ')}</span>
      </button>`).join('')}
    </div>
  </section>

  <section class="card">
    <h2>${t('mode_single')}</h2>
    <p class="muted">${t('mode_single_desc')}</p>
    <div class="module-grid">
      ${modules.map(m => {
        const count = bank.questions[m.id].length;
        const exams = bank.exams.filter(e => e.modules.includes(m.id)).map(e => esc(field(e, 'name'))).join(', ');
        return `<button class="tile" data-action="start-single" data-module="${m.id}" ${count ? '' : 'disabled'}>
          <strong>${esc(field(m, 'name'))}</strong>
          <span class="muted">${t('questions_count', { n: count })} · ${exams}</span>
        </button>`;
      }).join('')}
    </div>
  </section>

  <section class="card">
    <h2>${t('mode_weak')}</h2>
    <p class="muted">${t('mode_weak_desc')}</p>
    ${weak.length ? `
      <ul class="chips">${weak.slice(0, 10).map(p => `<li class="chip">${esc(patternName(p.tag))} <span class="count">×${p.mistakes}</span></li>`).join('')}</ul>
      <div class="actions">
        <label class="select-label">${t('exam_label')}
          <select id="weak-exam">
            <option value="">${t('all_modules')}</option>
            ${bank.exams.map(e => `<option value="${e.id}">${esc(field(e, 'name'))}</option>`).join('')}
          </select>
        </label>
        <button class="btn primary" data-action="start-weak">${t('weak_start')}</button>
      </div>` : `<p class="note">${t('weak_none')}</p>`}
  </section>`;
}

function renderIntro() {
  const m = cur();
  const isMock = run.mode === 'mock';
  const tags = run.mode === 'weak' ? [...new Set(m.qids.map(id => bank.byId.get(id).pattern_tag))] : [];
  const minutes = +(run.moduleMs / 60000).toFixed(1);
  return `<section class="card intro">
    <div class="eyebrow">${isMock ? `${esc(examName(run.exam))} · ${t('module_of', { i: run.index + 1, n: run.modules.length })}` : t(`mode_name_${run.mode}`)}</div>
    <h1>${esc(moduleName(m.moduleId))}</h1>
    ${isMock && run.index > 0 ? `<p class="note ok">✓ ${t('prev_done')}</p>` : ''}
    <h2>${t('rules_title')}</h2>
    <ul class="rules">
      <li>${t('rule_count', { q: m.qids.length, m: minutes })}</li>
      <li>${t('rule_skip')}</li>
      ${isMock ? `<li>${t('rule_noreturn')}</li>` : ''}
      <li>${t('rule_timeout')}</li>
      <li><strong>${t('rule_timer_start')}</strong></li>
    </ul>
    ${tags.length ? `<p>${t('rule_weak')}</p><ul class="chips">${tags.map(tag => `<li class="chip">${esc(patternName(tag))}</li>`).join('')}</ul>` : ''}
    <div class="actions">
      <button class="btn primary big" data-action="start-module">${t('start')}</button>
      <span class="spacer"></span>
      <button class="link danger" data-action="abandon">${t('abandon')}</button>
    </div>
  </section>`;
}

function renderBreak() {
  const next = cur();
  return `<section class="card break">
    <div class="eyebrow">${esc(examName(run.exam))}</div>
    <p class="note ok">✓ ${t('prev_done')}</p>
    <h1>${t('break_title')}</h1>
    <p class="muted">${t('break_left')}</p>
    <div class="big-clock" id="break-clock">${fmtTime(breakLeft())}</div>
    <p>${t('break_note')}</p>
    <p class="muted">${t('module_of', { i: run.index + 1, n: run.modules.length })}: ${esc(moduleName(next.moduleId))}</p>
    <button class="btn primary big" data-action="end-break">${t('end_break')}</button>
  </section>`;
}

function renderQuestion() {
  const m = cur();
  const n = m.qids.length;
  const qid = m.qids[m.current];
  const q = bank.byId.get(qid);
  const ans = m.answers[qid];
  const answered = m.qids.filter(id => m.answers[id] != null).length;
  const last = m.current === n - 1;
  return `<section class="exam">
    <div class="exam-bar">
      <div class="exam-title">
        ${run.mode === 'mock' ? `<span class="muted">${t('module_of', { i: run.index + 1, n: run.modules.length })}</span>` : ''}
        <strong>${esc(moduleName(m.moduleId))}</strong>
      </div>
      <div class="clock"><span class="clock-label">${t('time_left')}</span><span id="clock">${fmtTime(m.deadline - Date.now())}</span></div>
    </div>
    <nav class="qnav" aria-label="questions">
      ${m.qids.map((id, i) => `<button class="qnum${i === m.current ? ' current' : ''}${m.answers[id] != null ? ' answered' : ''}${m.flags[id] ? ' flagged' : ''}" data-action="goto" data-i="${i}" aria-label="${t('question_of', { i: i + 1, n })}">${i + 1}</button>`).join('')}
    </nav>
    <article class="card question">
      <div class="q-meta">${t('question_of', { i: m.current + 1, n })}${m.flags[qid] ? ' · <span class="flag-mark">⚑</span>' : ''}</div>
      <div class="q-text">${richText(field(q, 'question'))}</div>
      ${renderVisual(q.visual)}
      <div class="options" role="radiogroup">
        ${m.orders[qid].map((oi, pos) => `<button class="option${ans === oi ? ' selected' : ''}" role="radio" aria-checked="${ans === oi}" data-action="answer" data-oi="${oi}">
          <span class="letter">${optionLetter(pos)}</span><span class="opt-text">${esc(loc(q.options[oi]))}</span>
        </button>`).join('')}
      </div>
    </article>
    <div class="exam-actions">
      <button class="btn" data-action="prev" ${m.current === 0 ? 'disabled' : ''}>${t('prev')}</button>
      <button class="btn ghost" data-action="flag">${m.flags[qid] ? t('unflag') : `⚑ ${t('flag')}`}</button>
      <span class="spacer"></span>
      ${last ? '' : `<button class="btn primary" data-action="next">${ans != null ? t('next') : t('skip')}</button>`}
      <button class="btn${last ? ' primary' : ''}" data-action="ask-finish">${t('finish_module')}</button>
    </div>
    <div class="exam-foot muted">
      <span>${t('answered_n', { a: answered, n })}</span>
      <span class="keys">${t('keys_hint')}</span>
      <button class="link danger" data-action="abandon">${t('abandon')}</button>
    </div>
  </section>`;
}

function renderModal() {
  if (modal !== 'finish' || !run) return '';
  const m = cur();
  const unanswered = m.qids.filter(id => m.answers[id] == null).length;
  const flagged = m.qids.filter(id => m.flags[id]).length;
  return `<div class="modal-backdrop" data-action="close-modal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">${t('finish_title')}</h2>
      ${unanswered ? `<p class="warn-text">${t('finish_unanswered', { n: unanswered })}</p>` : ''}
      ${flagged ? `<p>${t('finish_flagged', { n: flagged })}</p>` : ''}
      <p>${t('finish_noreturn')}</p>
      <div class="modal-actions">
        <button class="btn" data-action="close-modal">${t('cancel')}</button>
        <button class="btn primary" data-action="confirm-finish" autofocus>${t('finish')}</button>
      </div>
    </div>
  </div>`;
}

function statusOf(it) {
  if (it.isCorrect) return 'correct';
  return it.answer == null ? 'blank' : 'wrong';
}

function reviewItem(it, n) {
  const q = bank.byId.get(it.qid);
  const status = statusOf(it);
  const icon = { correct: '✓', wrong: '✗', blank: '–' }[status];
  if (!q) return `<article class="card review ${status}"><p class="muted">#${n} · ${t('q_removed')}</p></article>`;
  const order = it.order?.length === q.options.length ? it.order : q.options.map((_, i) => i);
  const pattern = bank.patterns[q.pattern_tag];
  return `<article class="card review ${status}">
    <header class="review-head">
      <span class="badge ${status}">${icon} ${t(`${status}_mark`)}</span>
      <span class="muted">#${n} · ${esc(moduleName(q.module))} · ${t('difficulty')} ${'●'.repeat(q.difficulty)}${'○'.repeat(3 - q.difficulty)}</span>
    </header>
    <div class="q-text">${richText(field(q, 'question'))}</div>
    ${renderVisual(q.visual)}
    <ul class="review-options">
      ${order.map((oi, pos) => {
        const isCorrect = oi === q.correct;
        const isMine = oi === it.answer;
        return `<li class="${isCorrect ? 'is-correct' : ''}${isMine && !isCorrect ? ' is-wrong' : ''}">
          <span class="letter">${optionLetter(pos)}</span>
          <span class="opt-text">${esc(loc(q.options[oi]))}</span>
          ${isCorrect ? `<span class="tag ok">✓ ${t('correct_answer')}</span>` : ''}
          ${isMine ? `<span class="tag ${isCorrect ? 'ok' : 'bad'}">${isCorrect ? '' : '✗ '}${t('your_answer')}</span>` : ''}
        </li>`;
      }).join('')}
    </ul>
    ${it.answer == null ? `<p class="muted">${t('no_answer')}</p>` : ''}
    <div class="explain"><h4>${t('explanation')}</h4>${richText(field(q, 'explanation'))}</div>
    ${pattern ? `<div class="pattern-box"><h4>${t('pattern')}: ${esc(field(pattern, 'name'))}</h4>${richText(field(pattern, 'rule'))}</div>` : ''}
  </article>`;
}

function renderResults() {
  const attempt = store.loadHistory().find(a => a.id === view.id);
  if (!attempt) return `<p>${t('no_history')}</p>`;
  const items = attempt.modules.flatMap(m => m.items);
  const right = items.filter(i => i.isCorrect).length;
  const pct = items.length ? Math.round((right / items.length) * 100) : 0;
  const label = attempt.mode === 'mock' ? `${t('mode_name_mock')} · ${examName(attempt.exam)}`
    : attempt.mode === 'weak' ? t('mode_name_weak') : t('mode_name_module');
  let n = 0;
  const reviewBlocks = attempt.modules.map(m => {
    const shown = m.items.map(it => ({ it, n: ++n })).filter(x => !view.onlyMistakes || !x.it.isCorrect);
    if (!shown.length) return '';
    return `${attempt.modules.length > 1 ? `<h3 class="review-module">${esc(moduleName(m.moduleId))}</h3>` : ''}
      ${shown.map(x => reviewItem(x.it, x.n)).join('')}`;
  }).join('');

  return `<section class="card results">
    <div class="eyebrow">${esc(label)} · ${fmtDate(attempt.finishedAt)}</div>
    <h1>${t('results_title')}</h1>
    <div class="hero-score"><span class="big">${right} / ${items.length}</span><span class="muted">${pct}%</span></div>
    <table class="data-table summary">
      <thead><tr><th></th><th>${t('score')}</th><th>${t('time_used')}</th></tr></thead>
      <tbody>
        ${attempt.modules.map(m => {
          const r = m.items.filter(i => i.isCorrect).length;
          return `<tr>
            <td>${esc(moduleName(m.moduleId))}</td>
            <td><strong>${r} / ${m.items.length}</strong></td>
            <td>${fmtTime(m.timeUsedSec * 1000)} / ${fmtTime(m.timeLimitSec * 1000)}${m.timedOut ? ` <span class="tag bad">${t('timed_out')}</span>` : ''}</td>
          </tr>`;
        }).join('')}
      </tbody>
      ${attempt.mode === 'mock' ? `<tfoot>
        <tr><td>${t('time_no_breaks')}</td><td></td><td>${fmtTime(attempt.modules.reduce((s, m) => s + m.timeUsedSec, 0) * 1000)}</td></tr>
        <tr><td>${t('break_used')}</td><td></td><td>${fmtTime(attempt.breakUsedSec * 1000)}</td></tr>
      </tfoot>` : ''}
    </table>
    <div class="actions">
      <button class="btn primary" data-action="home">${t('back_home')}</button>
      ${items.some(i => !i.isCorrect) ? `<button class="btn" data-action="start-weak">${t('practice_weak')}</button>` : ''}
    </div>
  </section>
  <div class="review-bar">
    <h2>${t('review')}</h2>
    <label class="toggle"><input type="checkbox" data-action="toggle-mistakes" ${view.onlyMistakes ? 'checked' : ''}> ${t('only_mistakes')}</label>
  </div>
  ${reviewBlocks}`;
}

// One small line chart per module: score out of 12 per run, oldest → newest.
function sparkChart(points) {
  const W = 280, H = 120, L = 26, R = 12, T = 10, B = 20;
  const x = i => (points.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (points.length - 1));
  const y = v => T + (1 - v / 12) * (H - T - B);
  const grid = [0, 6, 12].map(v => `<line class="gridline" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('');
  const line = points.length > 1 ? `<polyline class="series" points="${points.map((p, i) => `${x(i)},${y(p.v)}`).join(' ')}"/>` : '';
  const dots = points.map((p, i) => `<g class="pt" data-tip="${esc(`${fmtDate(p.date)} — ${p.raw}`)}">
      <circle class="hit" cx="${x(i)}" cy="${y(p.v)}" r="11"/>
      <circle class="dot" cx="${x(i)}" cy="${y(p.v)}" r="4.5"/>
    </g>`).join('');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" role="img">${grid}${line}${dots}</svg>`;
}

function renderHistory() {
  const history = store.loadHistory();
  const tools = `<div class="actions">
    <button class="btn" data-action="export" ${history.length ? '' : 'disabled'}>${t('export')}</button>
    <button class="btn" data-action="import">${t('import')}</button>
    <input type="file" id="import-file" accept="application/json,.json" hidden>
    <span class="spacer"></span>
    ${history.length ? `<button class="link danger" data-action="clear-history">${t('clear_history')}</button>` : ''}
  </div>`;
  if (!history.length) return `<section class="card"><h1>${t('history_title')}</h1><p class="muted">${t('no_history')}</p>${tools}</section>`;

  const stats = computeStats(history);
  const items = history.flatMap(a => a.modules.flatMap(m => m.items));
  const accuracy = Math.round((items.filter(i => i.isCorrect).length / items.length) * 100);
  const weak = weakPatterns(stats).slice(0, 15);

  const charts = [...bank.modules.values()].map(mod => {
    const pts = [];
    for (const a of history) {
      if (a.mode === 'weak') continue;
      for (const m of a.modules) {
        if (m.moduleId !== mod.id || !m.items.length) continue;
        const r = m.items.filter(i => i.isCorrect).length;
        pts.push({ v: (r / m.items.length) * 12, raw: `${r} / ${m.items.length}`, date: a.finishedAt });
      }
    }
    const best = pts.length ? Math.max(...pts.map(p => p.v)) : 0;
    return `<figure class="chart-card">
      <figcaption><strong>${esc(field(mod, 'name'))}</strong>
        ${pts.length ? `<span class="muted">${t('last')} ${pts.at(-1).raw} · ${t('best')} ${Math.round(best)}</span>` : ''}</figcaption>
      ${pts.length ? sparkChart(pts) : `<div class="chart-empty muted">${t('no_data')}</div>`}
    </figure>`;
  }).join('');

  return `<section class="card">
    <h1>${t('history_title')}</h1>
    <div class="stat-row">
      <div class="stat"><span class="big">${history.length}</span><span class="muted">${t('stat_attempts')}</span></div>
      <div class="stat"><span class="big">${items.length}</span><span class="muted">${t('stat_questions')}</span></div>
      <div class="stat"><span class="big">${accuracy}%</span><span class="muted">${t('stat_accuracy')}</span></div>
    </div>
    ${tools}
  </section>

  <section class="card">
    <h2>${t('scores_over_time')}</h2>
    <p class="muted small">${t('scores_note')}</p>
    <div class="chart-grid">${charts}</div>
  </section>

  <section class="card">
    <h2>${t('frequent_mistakes')}</h2>
    ${weak.length ? `<table class="data-table mistakes">
      <thead><tr><th>${t('col_pattern')}</th><th class="num">${t('col_mistakes')}</th><th class="num">${t('col_seen')}</th><th class="num">${t('col_accuracy')}</th></tr></thead>
      <tbody>${weak.map(p => `<tr>
        <td><strong>${esc(patternName(p.tag))}</strong><div class="muted small">${esc(field(bank.patterns[p.tag], 'rule'))}</div></td>
        <td class="num">${p.mistakes}</td><td class="num">${p.seen}</td><td class="num">${Math.round(p.accuracy * 100)}%</td>
      </tr>`).join('')}</tbody>
    </table>
    <div class="actions"><button class="btn primary" data-action="start-weak">${t('practice_weak')}</button></div>` : `<p class="muted">—</p>`}
  </section>

  <section class="card">
    <h2>${t('attempts')}</h2>
    <table class="data-table attempts">
      <thead><tr><th>${t('col_date')}</th><th>${t('col_mode')}</th><th class="num">${t('col_score')}</th><th></th></tr></thead>
      <tbody>${[...history].reverse().map(a => {
        const its = a.modules.flatMap(m => m.items);
        const r = its.filter(i => i.isCorrect).length;
        return `<tr>
          <td>${fmtDate(a.finishedAt)}</td>
          <td>${esc(runLabel(a))}</td>
          <td class="num">${r} / ${its.length}</td>
          <td class="num"><button class="link" data-action="open-attempt" data-id="${a.id}">${t('open')}</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table>
  </section>`;
}

function render() {
  document.documentElement.lang = getLang();
  document.title = t('app_title');
  let main;
  if (view.name === 'run' && run) {
    main = run.phase === 'active' ? renderQuestion() : run.phase === 'break' ? renderBreak() : renderIntro();
  } else if (view.name === 'history') {
    main = renderHistory();
  } else if (view.name === 'results') {
    main = renderResults();
  } else {
    main = renderHome();
  }
  app.innerHTML = `${renderHeader()}<main class="container">${main}</main>${renderModal()}`;
}

// ---------------------------------------------------------------- events

function selectAnswer(oi) {
  const m = cur();
  const qid = m.qids[m.current];
  if (m.answers[qid] === oi) delete m.answers[qid]; // clicking the chosen option again clears it
  else m.answers[qid] = oi;
  persist();
  render();
}

function goTo(i) {
  const m = cur();
  if (i < 0 || i >= m.qids.length) return;
  m.current = i;
  persist();
  render();
  window.scrollTo(0, 0);
}

const actions = {
  lang: () => { setLang(getLang() === 'ka' ? 'en' : 'ka'); render(); },
  home: () => { view = { name: 'home' }; render(); },
  history: () => { view = { name: 'history' }; render(); window.scrollTo(0, 0); },
  resume: () => { view = { name: 'run' }; render(); },
  abandon: () => abandonRun(),
  'start-mock': el => startRun('mock', { exam: el.dataset.exam }),
  'start-single': el => startRun('module', { moduleId: el.dataset.module }),
  'start-weak': () => startRun('weak', { exam: document.getElementById('weak-exam')?.value || null }),
  'start-module': () => startModule(),
  'end-break': () => endBreak(false),
  answer: el => selectAnswer(Number(el.dataset.oi)),
  goto: el => goTo(Number(el.dataset.i)),
  prev: () => goTo(cur().current - 1),
  next: () => goTo(cur().current + 1),
  flag: () => {
    const m = cur();
    const qid = m.qids[m.current];
    m.flags[qid] = !m.flags[qid];
    persist();
    render();
  },
  'ask-finish': () => { modal = 'finish'; render(); },
  'close-modal': (el, e) => { if (e.target === el) { modal = null; render(); } },
  'confirm-finish': () => endModule(false),
  'open-attempt': el => { view = { name: 'results', id: el.dataset.id, onlyMistakes: false }; render(); window.scrollTo(0, 0); },
  'toggle-mistakes': el => { view.onlyMistakes = el.checked; render(); },
  export: () => store.exportHistory(),
  import: () => document.getElementById('import-file').click(),
  'clear-history': () => {
    if (!confirm(t('clear_confirm'))) return;
    store.clearHistory();
    render();
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (fn && el.dataset.action !== 'toggle-mistakes') fn(el, e);
});

document.addEventListener('change', async e => {
  if (e.target.dataset?.action === 'toggle-mistakes') actions['toggle-mistakes'](e.target);
  if (e.target.id === 'import-file' && e.target.files[0]) {
    try {
      toast(t('imported', { n: await store.importHistory(e.target.files[0]) }));
    } catch {
      toast(t('import_failed'));
    }
    render();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal) { modal = null; render(); return; }
  if (!run || view.name !== 'run' || run.phase !== 'active' || modal) return;
  if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  const m = cur();
  const order = m.orders[m.qids[m.current]];
  if (/^[1-4]$/.test(e.key) && Number(e.key) <= order.length) selectAnswer(order[Number(e.key) - 1]);
  else if (e.key === 'ArrowRight') goTo(m.current + 1);
  else if (e.key === 'ArrowLeft') goTo(m.current - 1);
  else if (e.key === 'f' || e.key === 'F' || e.key === 'ფ') actions.flag();
  else return;
  e.preventDefault();
});

// Chart tooltips
document.addEventListener('mouseover', e => {
  const pt = e.target.closest?.('.pt');
  let tip = document.getElementById('chart-tip');
  if (!pt) { tip?.remove(); return; }
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'chart-tip';
    tip.className = 'chart-tip';
    document.body.append(tip);
  }
  tip.textContent = pt.dataset.tip;
  const r = pt.querySelector('.dot').getBoundingClientRect();
  tip.style.left = `${r.left + r.width / 2 + window.scrollX}px`;
  tip.style.top = `${r.top + window.scrollY - 8}px`;
});

// ---------------------------------------------------------------- start

async function init() {
  setLang(getLang());
  app.innerHTML = `<p class="container loading">${t('loading')}</p>`;
  try {
    bank = await loadBank();
  } catch (e) {
    console.error(e);
    app.innerHTML = `<p class="container error">${esc(t('load_error'))}</p>`;
    return;
  }
  run = store.loadRun();
  if (run) {
    // Drop questions that were deleted from the bank since the run started.
    for (const m of run.modules) {
      m.qids = m.qids.filter(id => bank.byId.has(id));
      m.current = Math.min(m.current, Math.max(0, m.qids.length - 1));
    }
    if (run.modules.some(m => !m.qids.length)) { store.clearRun(); run = null; }
    else view = { name: 'run' };
  }
  render();
  tick();
  setInterval(tick, 250);
}

init();
