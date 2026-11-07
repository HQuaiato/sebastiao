import { ABN, ABS, gmDie, lvl, mod, PB, parseDice, resList, runeDC, sg, skillBonus, SKILLS, used } from '../lib/calc';
import { isLoaded, setRole, useSheet, useSync } from '../lib/store';

/** O que o visitante vê: só números, ao vivo. Sem história, personalidade, anotações nem edição. */
export function Visitor() {
  const D = useSheet();
  const sync = useSync();
  const s = D.state, max = +D.combat.hpMax || 1;
  if (!isLoaded()) return <div className="wrap"><p className="muted" style={{ padding: 30, textAlign: 'center' }}>{sync.text.startsWith('💾') ? 'Carregando a ficha…' : sync.text}</p></div>;

  return (
    <div className={'app' + (s.giant ? ' is-giant' : '') + (s.hp <= 0 ? ' is-down' : '')}>
      <header className="wrap hdr">
        <span className={'portrait ' + (s.giant ? 'giant' : s.hp <= 0 ? 'down' : '')}><img src="./retrato.jpg" alt="" /></span>
        <div className="hdr-text">
          <h1>{D.info.name}</h1>
          <p className="sub">{D.info.race} · {D.info.cls} {lvl(D)}{D.info.sub ? ` · ${D.info.sub}` : ''}</p>
        </div>
        <span className={'pill ' + sync.kind}>{sync.text}</span>
      </header>
      <main className="wrap">
        <section>
          <div className="card hpcard">
            <div className="hpnum"><b>{s.hp}</b><span>/ {max}</span>{s.temp > 0 && <em>+{s.temp} temp</em>}</div>
            <div className="bar"><i style={{ width: Math.max(0, Math.min(100, (s.hp / max) * 100)) + '%' }} /></div>
            {s.hp <= 0 && <p className="bad-t" style={{ textAlign: 'center' }}>💀 Caído</p>}
            {s.giant && <p className="giant-t">⛰️ Poder do Gigante ativo</p>}
          </div>

          <div className="big">
            <div className="shield"><div className="n">CA</div><div className="m">{D.combat.ac}</div></div>
            <div><div className="n">Iniciativa</div><div className="m">{sg(mod(D, 'DES') + (+D.combat.initBonus || 0))}</div></div>
            <div><div className="n">Desloc.</div><div className="m sm">{D.combat.speed}</div></div>
            <div><div className="n">Profic.</div><div className="m">{sg(PB(D))}</div></div>
          </div>

          <div className="card">
            <h2>Atributos</h2>
            <div className="grid g6">
              {ABS.map((a) => (
                <div className="stat" key={a}>
                  <div className="stat-main" style={{ textAlign: 'center' }}><div className="n">{a}</div><div className="m">{sg(mod(D, a))}</div><div className="s">{D.scores[a]}</div></div>
                  <div className={'save' + (D.saves.includes(a) ? ' prof' : '')} style={{ textAlign: 'center' }} title={ABN[a]}>salv. {sg(mod(D, a) + (D.saves.includes(a) ? PB(D) : 0))}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Perícias <small>Percepção passiva {10 + skillBonus(D, 'Percepção', 'SAB')}</small></h2>
            <div className="skills">
              {SKILLS.map(([n, ab]) => (
                <div key={n} className={'skill' + (D.skills[n] ? ' prof' : '')}><span>{n}</span><b>{sg(skillBonus(D, n, ab))}</b></div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Ataques <small>CD das runas {runeDC(D)}</small></h2>
            {D.weapons.map((w, i) => {
              const p = parseDice(w.dice);
              return (
                <div className="line static" key={i}>
                  <span className="line-main"><b>{w.name}</b></span>
                  <span className="line-num">{sg(mod(D, w.ab) + PB(D) + (+w.bonus || 0))}<small>{p.c}d{p.n}{sg(mod(D, w.ab) + (+w.bonus || 0))}{s.giant ? ` +1d${gmDie(D)}` : ''}</small></span>
                </div>
              );
            })}
          </div>

          <div className="card">
            <h2>Poderes</h2>
            {resList(D).map((r) => (
              <div className="power" key={r.id}>
                <div className="power-info"><b>{r.name}</b></div>
                <span className="muted">{r.max - used(D, r.id)}/{r.max}</span>
              </div>
            ))}
          </div>

          <p className="muted small center">Atualiza sozinha a cada 15 segundos. <button className="mini" onClick={() => setRole(null)}>sou o jogador</button></p>
        </section>
      </main>
    </div>
  );
}
