import { useState } from 'react';
import { gmDie, lvl, mod, PB, parseDice, resList, runeDC, setUsed, sg, used } from '../lib/calc';
import { d, d20, rollN, show, sum } from '../lib/dice';
import { getSheet, update, useSheet } from '../lib/store';
import type { Sheet } from '../data/default';

const heal = (x: Sheet, n: number) => {
  x.state.hp = Math.min(+x.combat.hpMax, x.state.hp + n);
  if (x.state.hp > 0) x.state.ds = [0, 0, 0, 0, 0, 0];
};

/** Aplica dano: tira primeiro do temporário; oferece a Resistência Implacável ao chegar a 0. */
function damage(n: number) {
  const D = getSheet();
  const fromTemp = Math.min(D.state.temp, n);
  const after = D.state.hp - (n - fromTemp);
  const max = +D.combat.hpMax;
  if (after > 0) { update((x) => { x.state.temp -= fromTemp; x.state.hp = after; }); return; }
  if (after <= -max) {
    update((x) => { x.state.temp -= fromTemp; x.state.hp = 0; x.state.giant = false; });
    show('Morte instantânea', '💀', 'o dano que sobrou passou do PV máximo', 'fail');
    return;
  }
  const canRe = D.resources.some((r) => r.id === 're') && used(D, 're') < 1;
  if (canRe && confirm('Caiu a 0. Usar Resistência Implacável e ficar com 1 PV?')) {
    update((x) => { x.state.temp -= fromTemp; x.state.hp = 1; setUsed(x, 're', 1); });
    show('Resistência Implacável', '1 PV', 'ainda de pé', 'good');
    return;
  }
  update((x) => { x.state.temp -= fromTemp; x.state.hp = 0; x.state.giant = false; });
  show('Caiu!', '0 PV', 'role os testes contra a morte', 'fail');
}

/** O que acontece quando você toca em "usar" num poder. */
function usePower(id: string) {
  const D = getSheet();
  const r = resList(D).find((x) => x.id === id)!;
  if (id === 'gm' && D.state.giant) { update((x) => { x.state.giant = false; }); show('Poder do Gigante', 'Encerrado', 'as runas se apagam'); return; }
  if (used(D, id) >= r.max) { show(r.name, 'Sem usos', 'espere o descanso', 'fail'); return; }
  update((x) => setUsed(x, id, used(x, id) + 1));
  if (id === 'sw') { const v = d(10); update((x) => heal(x, v + lvl(x))); show('Retomar o Fôlego', `+${v + lvl(D)} PV`, `[${v}]+${lvl(D)}`, 'good'); }
  else if (id === 'hd') { const v = d(+D.combat.hitDie), n = Math.max(1, v + mod(D, 'CON')); update((x) => heal(x, n)); show('Dado de Vida', `+${n} PV`, `[${v}]${sg(mod(D, 'CON'))}`, 'good'); }
  else if (id === 'gm') { update((x) => { x.state.giant = true; }); show('⛰️ Poder do Gigante', 'Ativo', `Grande · vantagem em FOR · +1d${gmDie(D)} de dano 1x por turno`, 'giant'); }
  else if (id === 'fr') { const rs = rollN(2, 6); show('🔥 Runa de Fogo', `+${sum(rs)} fogo`, `[${rs.join(',')}] · alvo: salvaguarda de FOR CD ${runeDC(D)} ou fica impedido (2d6 por turno)`, 'fire'); }
  else if (id === 'cr') show('☁️ Runa de Nuvem', 'Desviado', 'o ataque vai para outra criatura a até 9 m, mesma rolagem', 'cloud');
  else if (id === 'as') show('Surto de Ação', 'Ação extra', 'mais uma ação neste turno', 'giant');
  else if (id === 're') show('Resistência Implacável', 'Usada', 'fica com 1 PV');
  else show(r.name, 'Usado', r.desc);
}

function attack(i: number) {
  const D = getSheet();
  const w = D.weapons[i], p = parseDice(w.dice);
  const atkB = mod(D, w.ab) + PB(D) + (+w.bonus || 0), dmgB = mod(D, w.ab) + (+w.bonus || 0);
  const r = d20('', atkB, { silent: true });
  const crit = r.nat === 20;
  const rs = rollN(p.c * (crit ? 2 : 1) + (crit && D.combat.savage ? 1 : 0), p.n);
  let dmg = sum(rs) + dmgB;
  let det = `[${rs.join(',')}]${sg(dmgB)}`;
  if (D.state.giant) { const g = rollN(crit ? 2 : 1, gmDie(D)); dmg += sum(g); det += ` + gigante [${g.join(',')}]`; }
  const kind = crit ? 'crit' : r.nat === 1 ? 'fail' : D.state.giant ? 'giant' : '';
  show(w.name, crit ? 'CRÍTICO' : r.nat === 1 ? `${r.tot} · 1 natural` : `${r.tot} para acertar`, `${r.txt} · dano ${det}${crit && D.combat.savage ? ' (com Ataques Selvagens)' : ''}`, kind, true,
    r.nat === 1 ? 'errou' : `💥 ${dmg} de dano ${w.type}`);
}

export function Play() {
  const D = useSheet();
  const s = D.state;
  const max = +D.combat.hpMax || 1;
  const [val, setVal] = useState('');
  const n = +val;

  const deathRoll = () => {
    const r = d(20);
    const mark = (x: Sheet, f: number, k: number) => { for (let i = 0; i < k; i++) { const j = x.state.ds.slice(f, f + 3).indexOf(0); if (j >= 0) x.state.ds[f + j] = 1; } };
    if (r === 20) { update((x) => heal(x, 1)); show('Contra a morte', '20!', 'levanta com 1 PV', 'crit'); return; }
    update((x) => (r === 1 ? mark(x, 3, 2) : mark(x, r >= 10 ? 0 : 3, 1)));
    show('Contra a morte', r, r === 1 ? 'duas falhas' : r >= 10 ? 'sucesso' : 'falha', r >= 10 ? 'good' : 'fail', true);
  };

  return (
    <section>
      {/* VIDA */}
      <div className="card hpcard">
        <div className="hp-top">
          <button className="hpstep" onClick={() => damage(1)} aria-label="Perder 1 PV">−</button>
          <div className="hpnum">
            <b>{s.hp}</b><span>/ {max}</span>
            {s.temp > 0 && <em>+{s.temp} temp</em>}
          </div>
          <button className="hpstep" onClick={() => update((x) => heal(x, 1))} aria-label="Ganhar 1 PV">+</button>
        </div>
        <div className="bar"><i style={{ width: Math.max(0, Math.min(100, (s.hp / max) * 100)) + '%' }} /></div>
        <div className="hpctl">
          <input type="number" inputMode="numeric" placeholder="quanto?" value={val} onChange={(e) => setVal(e.target.value)} />
          <button className="bad" disabled={!(n > 0)} onClick={() => { damage(n); setVal(''); }}>Dano</button>
          <button className="good" disabled={!(n > 0)} onClick={() => { update((x) => heal(x, n)); setVal(''); }}>Cura</button>
          <button className="cloudc" disabled={val === ''} onClick={() => { update((x) => { x.state.temp = Math.max(0, n); }); setVal(''); }}>Temp</button>
        </div>
        {s.hp <= 0 && (
          <div className="death">
            <span>✔</span>{[0, 1, 2].map((i) => <button key={i} className={'ds ok' + (s.ds[i] ? ' on' : '')} onClick={() => update((x) => { x.state.ds[i] ^= 1; })} />)}
            <span>✖</span>{[3, 4, 5].map((i) => <button key={i} className={'ds no' + (s.ds[i] ? ' on' : '')} onClick={() => update((x) => { x.state.ds[i] ^= 1; })} />)}
            <button onClick={deathRoll}>🎲 Contra a morte</button>
          </div>
        )}
      </div>

      {/* NÚMEROS */}
      <div className="big">
        <div className="shield"><div className="n">CA</div><div className="m">{D.combat.ac}</div></div>
        <button onClick={() => d20('Iniciativa', mod(D, 'DES') + (+D.combat.initBonus || 0))}><div className="n">Inic. 🎲</div><div className="m">{sg(mod(D, 'DES') + (+D.combat.initBonus || 0))}</div></button>
        <div><div className="n">Desloc.</div><div className="m sm">{D.combat.speed}</div></div>
        <div><div className="n">CD runas</div><div className="m">{runeDC(D)}</div></div>
      </div>

      <div className="seg">
        {([[0, 'Normal'], [1, 'Vantagem'], [-1, 'Desvantagem']] as const).map(([m, t]) => (
          <button key={m} className={s.mode === m ? 'on' : ''} onClick={() => update((x) => { x.state.mode = m; })}>{t}</button>
        ))}
      </div>

      {/* ATAQUES */}
      <div className="card">
        <h2>Ataques <small>um toque rola acerto e dano</small></h2>
        {D.weapons.map((w, i) => {
          const p = parseDice(w.dice);
          return (
            <button className="line" key={i} onClick={() => attack(i)}>
              <span className="line-main"><b>{w.name}</b><span className="muted">{w.note}</span></span>
              <span className="line-num">{sg(mod(D, w.ab) + PB(D) + (+w.bonus || 0))}<small>{p.c}d{p.n}{sg(mod(D, w.ab) + (+w.bonus || 0))}{s.giant ? ` +1d${gmDie(D)}` : ''}</small></span>
            </button>
          );
        })}
      </div>

      {/* PODERES */}
      <div className="card">
        <h2>Poderes</h2>
        {resList(D).map((r) => {
          const u = used(D, r.id), left = r.max - u;
          const active = r.id === 'gm' && s.giant;
          return (
            <div className={'power' + (active ? ' active' : '') + (left <= 0 && !active ? ' spent' : '')} key={r.id}>
              <div className="power-info">
                <b>{r.name}</b>
                <span className="pips">
                  {Array.from({ length: r.max }, (_, i) => (
                    <button key={i} className={'pip' + (i < u ? ' used' : '')} aria-label="marcar uso"
                      onClick={() => update((x) => setUsed(x, r.id, i < u ? i : i + 1))} />
                  ))}
                  <span className="muted small">{r.reset === 'short' ? 'curto' : r.reset === 'long' ? 'longo' : ''}</span>
                </span>
              </div>
              <button className={'use' + (active ? ' on' : '')} onClick={() => usePower(r.id)}>
                {active ? 'Encerrar' : r.id === 'hd' ? 'Curar' : 'Usar'}
              </button>
            </div>
          );
        })}
        <div className="btns">
          <button onClick={() => { update((x) => x.resources.filter((r) => r.reset === 'short').forEach((r) => setUsed(x, r.id, 0))); show('☕ Descanso curto', 'Feito', 'poderes de descanso curto recarregados', 'good'); }}>☕ Descanso curto</button>
          <button onClick={() => {
            if (!confirm('Fazer descanso longo?')) return;
            update((x) => {
              x.resources.forEach((r) => setUsed(x, r.id, 0));
              x.state.hdUsed = Math.max(0, (x.state.hdUsed || 0) - Math.max(1, Math.floor(lvl(x) / 2)));
              Object.assign(x.state, { hp: +x.combat.hpMax, temp: 0, giant: false, ds: [0, 0, 0, 0, 0, 0] });
            });
            show('🛏️ Descanso longo', 'PV cheio', 'tudo recarregado', 'good');
          }}>🛏️ Descanso longo</button>
        </div>
      </div>
    </section>
  );
}
