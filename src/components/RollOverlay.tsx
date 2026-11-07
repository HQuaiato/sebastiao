import { useEffect, useState } from 'react';
import { dismiss, useRoll } from '../lib/dice';

/** O d20 animado que aparece embaixo da tela a cada rolagem. */
export function D20Icon({ spin, value }: { spin?: boolean; value?: string | number }) {
  return (
    <svg className={'d20' + (spin ? ' spin' : '')} viewBox="0 0 100 100" aria-hidden>
      <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" className="d20-out" />
      <polygon points="50,24 76,66 24,66" className="d20-in" />
      <path d="M50 4L50 24M92 28L76 66M8 28L24 66M50 96L24 66M50 96L76 66M8 72L24 66M92 72L76 66M8 28L50 24L92 28" className="d20-edge" />
      {value !== undefined && (
        <text x="50" y="56" textAnchor="middle" dominantBaseline="middle" className="d20-num">{value}</text>
      )}
    </svg>
  );
}

export function RollOverlay() {
  const r = useRoll();
  const [phase, setPhase] = useState<'spin' | 'show'>('show');
  const [flicker, setFlicker] = useState(1);

  useEffect(() => {
    if (!r) return;
    setPhase('spin');
    const iv = setInterval(() => setFlicker(1 + Math.floor(Math.random() * 20)), 60);
    const t1 = setTimeout(() => { clearInterval(iv); setPhase('show'); }, r.d20 ? 420 : 200);
    const t2 = setTimeout(dismiss, 4200);
    return () => { clearInterval(iv); clearTimeout(t1); clearTimeout(t2); };
  }, [r]);

  if (!r) return null;
  const spinning = phase === 'spin';
  return (
    <div className={`roll ${r.kind} ${spinning ? 'rolling' : 'done'}`} onClick={dismiss} role="status">
      <D20Icon spin={spinning} value={spinning ? flicker : undefined} />
      <div className="roll-body">
        <div className="roll-l">{r.label}</div>
        <div className="roll-r">{spinning ? '…' : r.total}</div>
        {!spinning && r.extra && <div className="roll-x">{r.extra}</div>}
        <div className="roll-d">{spinning ? 'rolando' : r.detail}</div>
      </div>
      {!spinning && (r.kind === 'crit' || r.kind === 'giant') && (
        <div className="sparks" aria-hidden>{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ ['--i' as string]: i }} />)}</div>
      )}
    </div>
  );
}
