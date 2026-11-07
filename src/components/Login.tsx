import { useState } from 'react';
import { cloudGet, getSheet, replace, setRole, update } from '../lib/store';

export async function hashPass(p: string) {
  const data = new TextEncoder().encode('sebastiao-bariga:' + p.trim());
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Se a nuvem tem uma versão mais nova que a do aparelho, usa ela (para não apagar a ficha num aparelho novo). */
async function adoptNewer() {
  try {
    const r = await cloudGet();
    if (r && (r.updatedAt || 0) > (getSheet().updatedAt || 0)) replace(r, false);
  } catch { /* sem internet: fica com a do aparelho */ }
}

/** Descobre a senha salva: primeiro no aparelho, depois na nuvem. */
async function savedHash() {
  const local = getSheet().auth?.hash;
  if (local) return local;
  try { return (await cloudGet())?.auth?.hash || ''; } catch { return ''; }
}

export function Login() {
  const [step, setStep] = useState<'choose' | 'pass' | 'create'>('choose');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const D = getSheet();

  const startPlayer = async () => {
    setBusy(true);
    const h = await savedHash();
    setBusy(false);
    setErr('');
    setStep(h ? 'pass' : 'create');
  };

  const enter = async () => {
    setBusy(true);
    const h = await savedHash();
    const mine = await hashPass(pass);
    setBusy(false);
    if (mine !== h) { setErr('Senha errada.'); return; }
    if (!getSheet().auth?.hash) {
      await adoptNewer();
      if (!getSheet().auth?.hash) update((x) => { x.auth = { hash: h }; });
    }
    setRole('player');
  };

  const create = async () => {
    if (pass.trim().length < 4) { setErr('Use pelo menos 4 caracteres.'); return; }
    if (pass !== pass2) { setErr('As senhas não batem.'); return; }
    const h = await hashPass(pass);
    await adoptNewer();
    update((x) => { x.auth = { hash: h }; });
    setRole('player');
  };

  return (
    <div className="login">
      <div className="login-card">
        <img className="login-img" src="./retrato.jpg" alt="Sebastião e o Torresmin" />
        <h1 className="cz">{D.info.name}</h1>
        <p className="muted">{D.info.race} · {D.info.cls} · {D.info.sub}</p>

        {step === 'choose' && (
          <div className="login-btns">
            <button className="primary big-btn" disabled={busy} onClick={startPlayer}>🎲 Sou o jogador</button>
            <button className="big-btn" onClick={() => setRole('visitor')}>👀 Entrar como visitante</button>
            <p className="muted small">O visitante vê vida, CA e atributos ao vivo, mas não vê a história nem edita nada.</p>
          </div>
        )}

        {step === 'pass' && (
          <form className="login-btns" onSubmit={(e) => { e.preventDefault(); enter(); }}>
            <input type="password" autoFocus placeholder="senha do jogador" value={pass} onChange={(e) => { setPass(e.target.value); setErr(''); }} />
            {err && <p className="bad-t">{err}</p>}
            <button className="primary big-btn" disabled={busy || !pass}>Entrar</button>
            <button type="button" className="mini" onClick={() => setStep('choose')}>voltar</button>
          </form>
        )}

        {step === 'create' && (
          <form className="login-btns" onSubmit={(e) => { e.preventDefault(); create(); }}>
            <p style={{ margin: 0 }}>Primeira vez: crie a senha do jogador.</p>
            <input type="password" autoFocus placeholder="nova senha" value={pass} onChange={(e) => { setPass(e.target.value); setErr(''); }} />
            <input type="password" placeholder="repita a senha" value={pass2} onChange={(e) => { setPass2(e.target.value); setErr(''); }} />
            {err && <p className="bad-t">{err}</p>}
            <button className="primary big-btn">Criar e entrar</button>
            <button type="button" className="mini" onClick={() => setStep('choose')}>voltar</button>
          </form>
        )}
      </div>
    </div>
  );
}
