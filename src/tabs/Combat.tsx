import { useState } from 'react';
import { Card } from '../components/ui';
import { gmDie, lvl, mod, PB, parseDice, resList, runeDC, setUsed, sg, used } from '../lib/calc';
import { d, d20, rollN, show, sum } from '../lib/dice';
import { getSheet, update, useSheet } from '../lib/store';
import type { Sheet } from '../data/default';

function heal(d0: Sheet, x: number) {
  d0.state.hp = Math.min(+d0.combat.hpMax, d0.state.hp + x);
  if (d0.state.hp > 0) d0.state.ds = [0, 0, 0, 0, 0, 0];
}

/** Gasta um uso do recurso. Devolve false se não tiver mais. */
export function spend(id: string) {
  const D = getSheet();
  const r = resList(D).find((x) => x.id === id);
  if (!r) return true;
  if (used(D, id) >= r.max) { show(r.name, 'Sem usos', 'espere o descanso', 'fail'); return false; }
  update((x) => setUsed(x, id, used(x, id) + 1));
  return true;
}

export function toggleGiant() {
  const D = getSheet();
  if (D.state.giant) {
    update((x) => { x.state.giant = false; });
    show('Poder do Gigante', 'Encerrado', 'as runas se apagam como brasa no fim da noite');
    return;
  }
  if (!spend('gm')) return;
  update((x) => { x.state.giant = true; });
  show('⛰️ Poder do Gigante', 'GIGANTE!', `Grande · vantagem em FOR · +1d${gmDie(D)} uma vez por turno`, 'giant');
}

export function Combat() {
  const D = useSheet();
  const [val, setVal] = useState('');
  const [gmNext, setGmNext] = useState(true);
  const max = +D.combat.hpMax || 1;
  const s = D.state;

  const damage = () => {
    let v = +val;
    if (!(v > 0)) return;
    setVal('');
    const t = Math.min(s.temp, v);
    v -= t;
    let after = s.hp - v;
    if (after <= 0) {
      const hasRe = D.resources.some((r) => r.id === 're') && used(D, 're') < 1;
      if (after <= -max) {
        update((x) => { x.state.temp -= t; x.state.hp = 0; });
        show('Morte instantânea', '💀', 'o dano que sobrou passou do PV máximo', 'fail');
        return;
      }
      if (hasRe && confirm('Usar Resistência Implacável e ficar com 1 PV?')) {
        update((x) => { x.state.temp -= t; x.state.hp = 1; setUsed(x, 're', 1); });
        show('Resistência Implacável', '1 PV', 'o meio-orc se recusa a cair', 'good');
        return;
      }
      after = 0;
      update((x) => { x.state.temp -= t; x.state.hp = 0; x.state.giant = false; });
      show('Caiu!', '0 PV', 'role os testes contra a morte', 'fail');
      return;
    }
    update((x) => { x.state.temp -= t; x.state.hp = after; });
    show('Dano recebido', '-' + (t + v), t ? `${t} saiu do PV temporário` : '', 'fail');
  };
  const doHeal = () => { const v = +val; if (v > 0) { setVal(''); update((x) => heal(x, v)); show('Cura', '+' + v + ' PV', '', 'good'); } };
  const doTemp = () => { if (val === '') return; const v = +val; setVal(''); update((x) => { x.state.temp = Math.max(x.state.temp, v); }); };

  const deathRoll = () => {
    const r = d(20);
    const mark = (x: Sheet, f: number, n: number) => { for (let k = 0; k < n; k++) { const j = x.state.ds.slice(f, f + 3).indexOf(0); if (j >= 0) x.state.ds[f + j] = 1; } };
    if (r === 20) { update((x) => heal(x, 1)); show('Contra a morte', '20!', 'levanta com 1 PV', 'crit'); return; }
    update((x) => { if (r === 1) mark(x, 3, 2); else mark(x, r >= 10 ? 0 : 3, 1); });
    show('Contra a morte', r, r === 1 ? 'duas falhas' : r >= 10 ? 'sucesso' : 'falha', r >= 10 ? 'good' : 'fail');
  };
  const ok = sum(s.ds.slice(0, 3)), bad = sum(s.ds.slice(3));

  const attack = (i: number, k: 'hit' | 'dmg' | 'crit') => {
    const w = D.weapons[i], p = parseDice(w.dice);
    const atk = mod(D, w.ab) + PB(D) + (+w.bonus || 0), dm = mod(D, w.ab) + (+w.bonus || 0);
    if (k === 'hit') { d20('Ataque · ' + w.name, atk); return; }
    const crit = k === 'crit';
    const c = p.c * (crit ? 2 : 1) + (crit && D.combat.savage ? 1 : 0);
    const rs = rollN(c, p.n);
    let tot = sum(rs) + dm, det = `[${rs.join(',')}]${sg(dm)}`;
    if (s.giant && gmNext) {
      const g = rollN(crit ? 2 : 1, gmDie(D));
      tot += sum(g); det += ` + gigante [${g.join(',')}]`;
      setGmNext(false);
    }
    show((crit ? 'Crítico · ' : 'Dano · ') + w.name, tot, det + (crit && D.combat.savage ? ' · com Ataques Selvagens' : ''), crit ? 'crit' : s.giant ? 'giant' : '');
  };

  const pip = (id: string, i: number) => {
    const u = used(D, id);
    const nu = i < u ? i : i + 1;
    update((x) => setUsed(x, id, nu));
    if (nu <= u) return;
    if (id === 'sw') { const r = d(10), x0 = r + lvl(D); update((x) => heal(x, x0)); show('Retomar o Fôlego', '+' + x0 + ' PV', `[${r}]+${lvl(D)} · ele respira fundo e se levanta`, 'good'); }
    if (id === 'hd') { const r = d(+D.combat.hitDie), x0 = Math.max(1, r + mod(D, 'CON')); update((x) => heal(x, x0)); show('Dado de Vida', '+' + x0 + ' PV', `[${r}]${sg(mod(D, 'CON'))}`, 'good'); }
    if (id === 'as') show('Surto de Ação', 'Mais uma ação!', 'neste turno', 'giant');
    if (id === 'gm' && !s.giant) { update((x) => { x.state.giant = true; }); setGmNext(true); show('⛰️ Poder do Gigante', 'GIGANTE!', `+1d${gmDie(D)} uma vez por turno`, 'giant'); }
  };

  const shortRest = () => {
    update((x) => x.resources.filter((r) => r.reset === 'short').forEach((r) => setUsed(x, r.id, 0)));
    show('☕ Descanso curto', 'Feito', 'runas, Fôlego e Surto voltaram · toque nos Dados de Vida para curar', 'good');
  };
  const longRest = () => {
    if (!confirm('Fazer descanso longo?')) return;
    update((x) => {
      x.resources.forEach((r) => setUsed(x, r.id, 0));
      x.state.hdUsed = Math.max(0, (x.state.hdUsed || 0) - Math.max(1, Math.floor(lvl(x) / 2)));
      Object.assign(x.state, { hp: +x.combat.hpMax, temp: 0, giant: false, ds: [0, 0, 0, 0, 0, 0] });
    });
    show('🛏️ Descanso longo', 'PV cheio', 'tudo recarregado · metade dos Dados de Vida volta', 'good');
  };
  const gm = D.resources.find((r) => r.id === 'gm');

  return (
    <section>
      <Card title="Pontos de vida" right={`dados de vida ${lvl(D) - (s.hdUsed || 0)}/${lvl(D)} d${D.combat.hitDie}`}>
        <div className="hp"><span>{s.hp}</span><small>/ {max}</small>{s.temp ? <small className="tmp">+{s.temp}</small> : null}</div>
        <div className="bar"><i style={{ width: Math.max(0, Math.min(100, (s.hp / max) * 100)) + '%' }} /></div>
        <div className="hpctl">
          <input type="number" inputMode="numeric" placeholder="valor" value={val} onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && damage()} />
          <button className="bad" onClick={damage}>Dano</button>
          <button className="good" onClick={doHeal}>Cura</button>
          <button className="cloudc" onClick={doTemp}>Temp</button>
        </div>
        {s.hp <= 0 && (
          <div className="death">
            <div>
              <span className="muted">Sucessos</span>
              {[0, 1, 2].map((i) => <button key={i} className={'ds ok' + (s.ds[i] ? ' on' : '')} onClick={() => update((x) => { x.state.ds[i] = x.state.ds[i] ? 0 : 1; })} />)}
              <span className="muted" style={{ marginLeft: 10 }}>Falhas</span>
              {[3, 4, 5].map((i) => <button key={i} className={'ds no' + (s.ds[i] ? ' on' : '')} onClick={() => update((x) => { x.state.ds[i] = x.state.ds[i] ? 0 : 1; })} />)}
            </div>
            <button onClick={deathRoll}>🎲 Teste contra a morte</button>
            {ok >= 3 && <p className="good-t">Estabilizado. Fica com 0 PV, mas não morre.</p>}
            {bad >= 3 && <p className="bad-t">Três falhas... fala com o mestre.</p>}
          </div>
        )}
      </Card>

      <div className="big">
        <div className="shield"><div className="n">CA</div><div className="m">{D.combat.ac}</div></div>
        <button onClick={() => d20('Iniciativa', mod(D, 'DES') + (+D.combat.initBonus || 0))}><div className="n">Iniciativa 🎲</div><div className="m">{sg(mod(D, 'DES') + (+D.combat.initBonus || 0))}</div></button>
        <div><div className="n">Desloc.</div><div className="m sm">{D.combat.speed}</div></div>
        <div><div className="n">Profic.</div><div className="m">{sg(PB(D))}</div></div>
      </div>

      <Card title="Rolagem do d20">
        <div className="mode">
          {[[0, 'Normal'], [1, 'Vantagem'], [-1, 'Desvantagem']].map(([m, t]) => (
            <button key={m} className={s.mode === m ? 'on' : ''} onClick={() => update((x) => { x.state.mode = m as number; })}>{t}</button>
          ))}
        </div>
        <p className="muted">Vale para todos os d20 até você trocar. As vantagens das runas e do Gigante entram sozinhas.</p>
      </Card>

      <Card title="Poder do Gigante" right={gm ? `${gm.max - used(D, 'gm')}/${gm.max} usos` : ''} className={s.giant ? 'giant-card' : ''}>
        <button className={'giant-btn' + (s.giant ? ' on' : '')} onClick={() => { if (!s.giant) setGmNext(true); toggleGiant(); }}>
          {s.giant ? '⛰️ GIGANTE ATIVO · toque para encerrar' : `Ativar o Gigante (+1d${gmDie(D)})`}
        </button>
        {s.giant && (
          <label className="chk"><input type="checkbox" checked={gmNext} onChange={(e) => setGmNext(e.target.checked)} /> somar o +1d{gmDie(D)} no próximo dano (uma vez por turno)</label>
        )}
        <p className="muted">Ação bônus, 1 minuto. As runas da tampa acendem e ele cresce: fica Grande e ganha vantagem em testes e salvaguardas de FOR.</p>
      </Card>

      <Card title="Ataques">
        {D.weapons.length === 0 && <p className="muted">Nenhuma arma. Adicione em ✏️ Editar.</p>}
        {D.weapons.map((w, i) => {
          const p = parseDice(w.dice);
          const atk = mod(D, w.ab) + PB(D) + (+w.bonus || 0), dm = mod(D, w.ab) + (+w.bonus || 0);
          return (
            <div className="atk" key={i}>
              <div className="t"><b>{w.name}</b><span className="muted">{sg(atk)} · {p.c}d{p.n}{sg(dm)} {w.type}</span></div>
              {w.note && <div className="muted small">{w.note}</div>}
              <div className="btns">
                <button onClick={() => attack(i, 'hit')}>🎯 Ataque</button>
                <button onClick={() => attack(i, 'dmg')}>💥 Dano</button>
                <button onClick={() => attack(i, 'crit')}>⭐ Crítico</button>
              </div>
            </div>
          );
        })}
      </Card>

      <Card title="Runas da tampa" right={'CD ' + runeDC(D)}>
        <div className="btns" style={{ marginTop: 0 }}>
          <button className="firec" onClick={() => { if (D.resources.some((r) => r.id === 'fr') && !spend('fr')) return; const rs = rollN(2, 6); show('🔥 Runa de Fogo', '+' + sum(rs) + ' fogo', `[${rs.join(',')}] · alvo: salvaguarda de FOR CD ${runeDC(D)} ou fica preso em correntes de brasa`, 'fire'); }}>🔥 Runa de Fogo</button>
          <button className="firec" onClick={() => { const rs = rollN(2, 6); show('🔥 Correntes de brasa', sum(rs), `[${rs.join(',')}] · o alvo repete a salvaguarda CD ${runeDC(D)} no fim do turno dele`, 'fire'); }}>🔥 Queima 2d6</button>
          <button className="cloudc" onClick={() => { if (D.resources.some((r) => r.id === 'cr') && !spend('cr')) return; show('☁️ Runa de Nuvem', 'Desviado!', 'vapor do mosto: o ataque vai para outra criatura a até 9 m, com a mesma rolagem', 'cloud'); }}>☁️ Runa de Nuvem</button>
        </div>
        <p className="muted"><b className="fire-t">Fogo:</b> ao acertar, +2d6 de fogo e salvaguarda de FOR, ou o alvo fica impedido. Toma 2d6 no início de cada turno dele. <b className="cloud-t">Nuvem:</b> reação, desvia um ataque que acertaria um aliado.</p>
      </Card>

      <Card title="Recursos">
        {resList(D).map((r) => (
          <div className="res" key={r.id}>
            <div><b>{r.name}</b><span>{r.desc} · {r.reset === 'long' ? 'descanso longo' : r.reset === 'hd' ? 'metade volta no longo' : 'descanso curto'}</span></div>
            <div className="pips">
              {Array.from({ length: r.max }, (_, i) => (
                <button key={i} className={'pip' + (i < used(D, r.id) ? ' used' : '')} onClick={() => pip(r.id, i)} aria-label={r.name} />
              ))}
            </div>
          </div>
        ))}
        <div className="btns">
          <button onClick={shortRest}>☕ Descanso curto</button>
          <button onClick={longRest}>🛏️ Descanso longo</button>
        </div>
      </Card>
    </section>
  );
}
