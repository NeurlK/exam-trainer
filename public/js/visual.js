// Draws a question's optional `visual` block (grids, shapes, string pairs, tables, text).
import { t, loc } from './i18n.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function gridSvg(grid) {
  const rows = grid.length, cols = grid[0].length;
  const c = Math.max(22, Math.min(34, Math.floor(200 / Math.max(rows, cols))));
  const w = cols * c, h = rows * c;
  let body = '';
  grid.forEach((row, r) => row.forEach((v, k) => {
    const x = k * c, y = r * c, cx = x + c / 2, cy = y + c / 2;
    body += `<rect class="cell" x="${x}" y="${y}" width="${c}" height="${c}"/>`;
    if (v === 1) body += `<rect class="ink" x="${x + c * 0.14}" y="${y + c * 0.14}" width="${c * 0.72}" height="${c * 0.72}" rx="2"/>`;
    if (v === 2) body += `<circle class="ink" cx="${cx}" cy="${cy}" r="${c * 0.32}"/>`;
    if (v === 3) {
      const d = c * 0.28;
      body += `<path class="stroke" stroke-width="${Math.max(2, c * 0.11)}" d="M${cx - d} ${cy - d}L${cx + d} ${cy + d}M${cx + d} ${cy - d}L${cx - d} ${cy + d}"/>`;
    }
    if (v === 4) {
      const d = c * 0.38;
      body += `<polygon class="ink" points="${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}"/>`;
    }
  }));
  return `<svg class="grid-svg" viewBox="-1 -1 ${w + 2} ${h + 2}" width="${w + 2}" height="${h + 2}" role="img">${body}</svg>`;
}

function starPoints(cx, cy, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

const SHAPE_PATHS = {
  circle: '<circle cx="18" cy="18" r="13"/>',
  square: '<rect x="6" y="6" width="24" height="24"/>',
  triangle: '<polygon points="18,5 31,29 5,29"/>',
  diamond: '<polygon points="18,3 33,18 18,33 3,18"/>',
  star: `<polygon points="${starPoints(18, 19, 15, 6.5)}"/>`,
  arrow: '<polygon points="4,14 19,14 19,7 33,18 19,29 19,22 4,22"/>',
};

function shapeSvg(s) {
  const fill = s.fill === 'outline' ? 'outline' : 'solid';
  return `<svg class="shape sh-${esc(s.color ?? 'black')} ${fill}" viewBox="0 0 36 36" width="36" height="36" role="img">`
    + `<g transform="rotate(${Number(s.rotate) || 0} 18 18)">${SHAPE_PATHS[s.shape] ?? ''}</g></svg>`;
}

function tableHtml(columns, rows, caption) {
  return `<table class="data-table">
    ${caption ? `<caption>${esc(caption)}</caption>` : ''}
    <thead><tr><th>#</th>${columns.map(c => `<th>${esc(loc(c))}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r, i) => `<tr><td class="num">${i + 1}</td>${r.map(c => `<td class="data">${esc(loc(c))}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;
}

export function renderVisual(v) {
  if (!v) return '';
  switch (v.type) {
    case 'grids': {
      const figs = [];
      if (v.reference) figs.push(`<figure class="fig ref">${gridSvg(v.reference)}<figcaption>${t('reference')}</figcaption></figure>`);
      v.grids.forEach((g, i) => figs.push(`<figure class="fig">${gridSvg(g)}<figcaption>${v.grids.length > 1 || v.reference ? `${t('grid')} ${i + 1}` : ''}</figcaption></figure>`));
      return `<div class="visual grids">${figs.join('')}</div>`;
    }
    case 'shapes': {
      const row = (shapes, label, cls = '') => `<div class="shape-row ${cls}"><span class="row-label">${label}</span><span class="shapes">${shapes.map(shapeSvg).join('')}</span></div>`;
      return `<div class="visual shape-rows">
        ${v.reference ? row(v.reference, t('reference'), 'ref') : ''}
        ${v.rows.map((r, i) => row(r, `${t('row')} ${i + 1}`)).join('')}
      </div>`;
    }
    case 'pairs':
      return `<div class="visual"><table class="data-table pairs">
        <thead><tr><th>#</th><th>${t('pair_left')}</th><th>${t('pair_right')}</th></tr></thead>
        <tbody>${v.pairs.map(([a, b], i) => `<tr><td class="num">${i + 1}</td><td class="data">${esc(a)}</td><td class="data">${esc(b)}</td></tr>`).join('')}</tbody>
      </table></div>`;
    case 'table':
      if (v.compare_rows) {
        return `<div class="visual tables-compare">${tableHtml(v.columns, v.rows, t('original'))}${tableHtml(v.columns, v.compare_rows, t('copy'))}</div>`;
      }
      return `<div class="visual">${tableHtml(v.columns, v.rows)}</div>`;
    case 'text':
      return `<div class="visual"><div class="data-text">${esc(loc(v.text))}</div></div>`;
    default:
      return '';
  }
}

// Question text: escaped, then `code`, **bold**, paragraphs and line breaks.
export function richText(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .split(/\n{2,}/)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}
