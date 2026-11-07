import { useSyncExternalStore } from 'react';
import { DEFAULT, type Sheet } from '../data/default';

/**
 * A ficha vive aqui. Salva sempre no aparelho (localStorage) e, se houver
 * token do GitHub, também no ficha.json do repositório, para abrir igual em qualquer lugar.
 */
const REPO = 'HQuaiato/sebastiao';
const FILE = 'ficha.json';
const LS = 'sebastiao-ficha-v3';
const LS_OLD = 'sebastiao-ficha-v2';
const LS_TOK = 'sebastiao-gh-token';

const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

/** Completa campos novos da ficha padrão sem perder o que o jogador já mudou. */
function merge(base: unknown, over: unknown): unknown {
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (base && typeof base === 'object') {
    if (!over || typeof over !== 'object') return base;
    const o: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const k in over as Record<string, unknown>) {
      const ov = (over as Record<string, unknown>)[k];
      o[k] = k in o ? merge(o[k], ov) : ov;
    }
    return o;
  }
  return over === undefined || over === null ? base : over;
}
export const fromAny = (x: unknown) => merge(clone(DEFAULT), x) as Sheet;

const lsGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* aba anônima */ }
};

function loadLocal(): Sheet | null {
  const raw = lsGet(LS) ?? lsGet(LS_OLD);
  if (!raw) return null;
  try { return fromAny(JSON.parse(raw)); } catch { return null; }
}

const LS_ROLE = 'sebastiao-role';
export type Role = 'player' | 'visitor' | null;
const urlVisitor = typeof location !== 'undefined' && /[?&]visitante\b/.test(location.search);
export const getRole = (): Role => (urlVisitor ? 'visitor' : ((lsGet(LS_ROLE) as Role) || null));
export function setRole(r: Role) {
  lsSet(LS_ROLE, r);
  if (urlVisitor && r !== 'visitor') { location.href = location.pathname; return; }
  location.reload();
}
/** Visitante só lê: nada é salvo no aparelho nem na nuvem. */
const readonly = getRole() === 'visitor';
export const isReadonly = () => readonly;

let D: Sheet = readonly ? clone(DEFAULT) : loadLocal() ?? clone(DEFAULT);
let loaded = !readonly;
export const isLoaded = () => loaded;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export const getSheet = () => D;
export const useSheet = () => useSyncExternalStore(subscribe, () => D);

export function update(fn: (d: Sheet) => void) {
  if (readonly) return;
  const n = clone(D);
  fn(n);
  n.updatedAt = Date.now();
  D = n;
  lsSet(LS, JSON.stringify(D));
  emit();
  scheduleCloud();
}
export function replace(n: Sheet, touch = true) {
  if (readonly) return;
  D = n;
  if (touch) D.updatedAt = Date.now();
  lsSet(LS, JSON.stringify(D));
  emit();
  if (touch) scheduleCloud();
}
export const resetSheet = () => replace(clone(DEFAULT));

/* ---------- nuvem (GitHub) ---------- */
export type SyncKind = 'ok' | 'warn' | 'err';
let sync: { text: string; kind: SyncKind } = { text: '💾 carregando…', kind: 'warn' };
export const useSync = () => useSyncExternalStore(subscribe, () => sync);
const setSync = (text: string, kind: SyncKind) => { sync = { text, kind }; emit(); };

let tok = lsGet(LS_TOK) || '';
export const getToken = () => tok;
let sha: string | null = null;
let dirty = false;
let timer: ReturnType<typeof setTimeout> | undefined;

const b64e = (s: string) => btoa(unescape(encodeURIComponent(s)));
const b64d = (s: string) => decodeURIComponent(escape(atob(s.replace(/\n/g, ''))));

export async function cloudGet(): Promise<Sheet | null> {
  const h: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (tok) h.Authorization = 'Bearer ' + tok;
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}?ref=main&t=${Date.now()}`, { headers: h, cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  sha = j.sha;
  return fromAny(JSON.parse(b64d(j.content)));
}

export async function cloudSave() {
  if (!tok) return;
  try {
    try { await cloudGet(); } catch { /* sem sha: arquivo novo */ }
    const body: Record<string, string> = {
      message: 'Atualiza a ficha do Sebastião',
      content: b64e(JSON.stringify(D, null, 1)),
      branch: 'main',
    };
    if (sha) body.sha = sha;
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      throw new Error(r.status === 401 ? 'token inválido' : r.status === 403 || r.status === 404 ? 'token sem permissão de escrita' : 'HTTP ' + r.status);
    }
    sha = (await r.json()).content.sha;
    dirty = false;
    setSync('☁️ salvo na nuvem', 'ok');
  } catch (e) {
    setSync('⚠️ não salvou: ' + (e as Error).message, 'err');
  }
}

function scheduleCloud() {
  if (!tok) { setSync('💾 só neste aparelho', 'warn'); return; }
  dirty = true;
  setSync('⏳ salvando…', 'warn');
  clearTimeout(timer);
  timer = setTimeout(cloudSave, 4000);
}

export async function setToken(t: string) {
  tok = t.trim();
  lsSet(LS_TOK, tok || null);
  if (!tok) { setSync('💾 só neste aparelho', 'warn'); return; }
  setSync('⏳ testando o token…', 'warn');
  dirty = true;
  await cloudSave();
}

/** Puxa a versão mais nova da nuvem, se ela for mais recente que a do aparelho. */
export async function pullIfNewer() {
  if (dirty) return;
  try {
    const remote = await cloudGet();
    if (remote && (remote.updatedAt || 0) > (D.updatedAt || 0)) replace(remote, false);
    if (tok) {
      if (!remote || (D.updatedAt || 0) > (remote.updatedAt || 0)) { dirty = true; await cloudSave(); }
      else setSync('☁️ sincronizado', 'ok');
    } else setSync('💾 só neste aparelho', 'warn');
  } catch {
    setSync(tok ? '📴 sem internet, salvo no aparelho' : '💾 só neste aparelho', 'warn');
  }
}

async function visitorPull() {
  try {
    const r = await cloudGet();
    if (r) { D = r; loaded = true; setSync('👀 ao vivo', 'ok'); }
    else setSync('A ficha ainda não foi enviada para a nuvem pelo jogador.', 'err');
  } catch { setSync(loaded ? '📴 sem conexão' : 'Sem conexão com o GitHub. Tente de novo em instantes.', 'warn'); }
  emit();
}

export function startSync() {
  if (readonly) {
    visitorPull();
    setInterval(() => { if (document.visibilityState === 'visible') visitorPull(); }, 15000);
    return;
  }
  lsSet(LS, JSON.stringify(D));
  pullIfNewer();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') pullIfNewer();
    else if (dirty) { clearTimeout(timer); cloudSave(); }
  });
}
