import { useSyncExternalStore } from 'react';
import { getSheet } from './store';
import { sg } from './calc';

export const d = (n: number) => 1 + Math.floor(Math.random() * n);
export const rollN = (c: number, n: number) => Array.from({ length: c }, () => d(n));
export const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export type RollKind = '' | 'crit' | 'fail' | 'fire' | 'cloud' | 'good' | 'giant';
export interface Roll { id: number; label: string; total: string | number; detail: string; kind: RollKind; d20: boolean }

let current: Roll | null = null;
let log: Roll[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const useRoll = () => useSyncExternalStore(subscribe, () => current);
export const useLog = () => useSyncExternalStore(subscribe, () => log);
export const clearLog = () => { log = []; emit(); };
export const dismiss = () => { current = null; emit(); };

export function show(label: string, total: string | number, detail = '', kind: RollKind = '', d20 = false) {
  current = { id: ++seq, label, total, detail, kind, d20 };
  log = [current, ...log].slice(0, 60);
  emit();
}

export function d20(label: string, bonus: number, o: { adv?: boolean; dis?: boolean } = {}) {
  const mode = getSheet().state.mode;
  const adv = mode === 1 || !!o.adv;
  const dis = mode === -1 || !!o.dis;
  const a = d(20), b = d(20);
  let r = a, txt = 'd20: ' + a;
  if (adv && !dis) { r = Math.max(a, b); txt = `vantagem: ${a} e ${b}`; }
  else if (dis && !adv) { r = Math.min(a, b); txt = `desvantagem: ${a} e ${b}`; }
  show(label, r + bonus, `${txt} ${sg(bonus)}${r === 20 ? ' · 20 natural!' : r === 1 ? ' · 1 natural' : ''}`, r === 20 ? 'crit' : r === 1 ? 'fail' : '', true);
  return { nat: r, tot: r + bonus };
}

export function rollExpr(ex: string) {
  const t = ex.replace(/\s/g, '').toLowerCase().match(/[+-]?[^+-]+/g);
  if (!t) return null;
  let tot = 0;
  const parts: string[] = [];
  for (const p of t) {
    const s = p[0] === '-' ? -1 : 1;
    const q = p.replace(/^[+-]/, '');
    const m = q.match(/^(\d*)d(\d+)$/);
    if (m) {
      const rs = rollN(Math.min(+(m[1] || 1), 100), +m[2]);
      tot += s * sum(rs);
      parts.push((s < 0 ? '-' : '') + '[' + rs.join(',') + ']');
    } else if (/^\d+$/.test(q)) {
      tot += s * +q;
      parts.push((s < 0 ? '-' : '+') + q);
    } else return null;
  }
  return { tot, det: parts.join(' ') };
}
