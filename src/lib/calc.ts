import type { Ab, Sheet } from '../data/default';

export const ABS: Ab[] = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
export const ABN: Record<Ab, string> = {
  FOR: 'Força', DES: 'Destreza', CON: 'Constituição', INT: 'Inteligência', SAB: 'Sabedoria', CAR: 'Carisma',
};
export const SKILLS: [string, Ab][] = [
  ['Acrobacia', 'DES'], ['Arcanismo', 'INT'], ['Atletismo', 'FOR'], ['Atuação', 'CAR'], ['Enganação', 'CAR'],
  ['Furtividade', 'DES'], ['História', 'INT'], ['Intimidação', 'CAR'], ['Intuição', 'SAB'], ['Investigação', 'INT'],
  ['Lidar com Animais', 'SAB'], ['Medicina', 'SAB'], ['Natureza', 'INT'], ['Percepção', 'SAB'], ['Persuasão', 'CAR'],
  ['Prestidigitação', 'DES'], ['Religião', 'INT'], ['Sobrevivência', 'SAB'],
];

export const sg = (n: number) => (n >= 0 ? '+' : '') + n;
export const lvl = (D: Sheet) => Math.max(1, Math.min(20, +D.info.level || 1));
export const PB = (D: Sheet) => Math.ceil(lvl(D) / 4) + 1;
export const mod = (D: Sheet, a: Ab) => Math.floor(((+D.scores[a] || 10) - 10) / 2);
export const runeDC = (D: Sheet) => 8 + PB(D) + mod(D, D.combat.runeAb || 'CON');
export const gmDie = (D: Sheet) => (lvl(D) >= 18 ? 10 : lvl(D) >= 10 ? 8 : 6);
export const toolProf = (D: Sheet) => PB(D) * (D.combat.toolDouble ? 2 : 1);
export const skillBonus = (D: Sheet, name: string, ab: Ab) => mod(D, ab) + PB(D) * (D.skills[name] || 0);
export function skillFlags(D: Sheet, name: string, ab: Ab) {
  const adv = (D.combat.cloudAdv && (name === 'Enganação' || name === 'Prestidigitação')) || (ab === 'FOR' && D.state.giant);
  const dis = D.combat.stealthDis && name === 'Furtividade';
  return { adv: !!adv, dis: !!dis };
}
export function parseDice(s: string) {
  const m = String(s).trim().match(/^(\d*)d(\d+)$/i);
  return m ? { c: +(m[1] || 1), n: +m[2] } : { c: 1, n: 6 };
}
export const tools = (D: Sheet) => String(D.toolsText || '').split('\n').map((s) => s.trim()).filter(Boolean);

export interface Res { id: string; name: string; desc: string; max: number; reset: 'short' | 'long' | 'hd' }
export const resList = (D: Sheet): Res[] => [
  ...D.resources,
  { id: 'hd', name: `Dados de Vida (d${D.combat.hitDie})`, desc: `toque para gastar · 1d${D.combat.hitDie}${sg(mod(D, 'CON'))}`, max: lvl(D), reset: 'hd' },
];
export const used = (D: Sheet, id: string) => (id === 'hd' ? D.state.hdUsed || 0 : D.state.used[id] || 0);
export function setUsed(D: Sheet, id: string, v: number) {
  if (id === 'hd') D.state.hdUsed = v;
  else D.state.used[id] = v;
}

export const getP = (o: unknown, p: string): unknown =>
  p.split('.').reduce<unknown>((a, k) => (a == null ? undefined : (a as Record<string, unknown>)[k]), o);
export function setP(o: unknown, p: string, v: unknown) {
  const ks = p.split('.');
  let a = o as Record<string, unknown>;
  for (const k of ks.slice(0, -1)) a = (a[k] ??= {}) as Record<string, unknown>;
  a[ks[ks.length - 1]] = v;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/** Texto simples → HTML: "## título", "Nome: texto" em destaque, "- item" vira lista. */
export function rich(text: string, runeColors = false) {
  let h = '';
  let inList = false;
  for (const raw of String(text || '').split('\n')) {
    const l = raw.trim();
    if (l.startsWith('- ')) {
      if (!inList) { h += '<ul>'; inList = true; }
      h += '<li>' + esc(l.slice(2)) + '</li>';
      continue;
    }
    if (inList) { h += '</ul>'; inList = false; }
    if (!l) continue;
    if (l.startsWith('## ')) { h += '<h3>' + esc(l.slice(3)) + '</h3>'; continue; }
    const m = l.match(/^([^:]{2,42}):\s+(.+)$/);
    if (m) {
      const cls = runeColors && /fogo/i.test(m[1]) ? 'f' : runeColors && /nuvem/i.test(m[1]) ? 'c' : '';
      h += `<p class="${cls}"><b>${esc(m[1])}:</b> ${esc(m[2])}</p>`;
    } else h += '<p>' + esc(l) + '</p>';
  }
  if (inList) h += '</ul>';
  return h;
}
