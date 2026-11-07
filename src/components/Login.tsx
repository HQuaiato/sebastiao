import { useState } from 'react';
import { getSheet, setRole } from '../lib/store';

/** Só o hash da senha do jogador fica no código, nunca a senha em si. */
const PLAYER_HASH = 'a25976fd118c1023c3e1e93d1553cdc218c363e4330eacf25259c6c39ee3afb9';

export async function hashPass(p: string) {
  const norm = p.trim().normalize('NFC').toLowerCase();
  const data = new TextEncoder().encode('sebastiao-bariga:' + norm);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function Login() {
  const [step, setStep] = useState<'choose' | 'pass'>('choose');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const D = getSheet();

  const enter = async () => {
    if ((await hashPass(pass)) !== PLAYER_HASH) { setErr('Senha errada.'); return; }
    setRole('player');
  };

  return (
    <div className="login">
      <div className="login-card">
        <img className="login-img" src="./retrato.jpg" alt="Sebastião e o Torresmin" />
        <h1 className="cz">{D.info.name}</h1>
        <p className="muted">{D.info.race} · {D.info.cls} · {D.info.sub}</p>

        {step === 'choose' ? (
          <div className="login-btns">
            <button className="primary big-btn" onClick={() => setStep('pass')}>🎲 Sou o jogador</button>
            <button className="big-btn" onClick={() => setRole('visitor')}>👀 Entrar como visitante</button>
            <p className="muted small">O visitante vê vida, CA e atributos ao vivo, mas não vê a história nem edita nada.</p>
          </div>
        ) : (
          <form className="login-btns" onSubmit={(e) => { e.preventDefault(); enter(); }}>
            <input type="password" autoFocus placeholder="senha do jogador" value={pass} onChange={(e) => { setPass(e.target.value); setErr(''); }} />
            {err && <p className="bad-t">{err}</p>}
            <button className="primary big-btn" disabled={!pass}>Entrar</button>
            <button type="button" className="mini" onClick={() => setStep('choose')}>voltar</button>
          </form>
        )}
      </div>
    </div>
  );
}
