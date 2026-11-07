import { ABN, ABS, mod, PB, sg, skillBonus, skillFlags, SKILLS, toolProf, tools } from '../lib/calc';
import { d, d20, show } from '../lib/dice';
import { useSheet } from '../lib/store';

export function Checks() {
  const D = useSheet();
  const giant = (a: string) => a === 'FOR' && D.state.giant;
  const tp = toolProf(D);

  return (
    <section>
      <div className="card">
        <h2>Atributos <small>toque: teste · embaixo: salvaguarda</small></h2>
        <div className="grid g6">
          {ABS.map((a) => {
            const prof = D.saves.includes(a);
            const sv = mod(D, a) + (prof ? PB(D) : 0);
            return (
              <div className="stat" key={a}>
                <button className="stat-main" onClick={() => d20('Teste de ' + ABN[a], mod(D, a), { adv: giant(a) })}>
                  <div className="n">{a}</div><div className="m">{sg(mod(D, a))}</div><div className="s">{D.scores[a]}</div>
                </button>
                <button className={'save' + (prof ? ' prof' : '')} onClick={() => d20('Salvaguarda de ' + ABN[a], sv, { adv: giant(a) })}>salv. {sg(sv)}</button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2>Perícias <small>Percepção passiva {10 + skillBonus(D, 'Percepção', 'SAB')}</small></h2>
        <div className="skills">
          {SKILLS.map(([n, ab]) => {
            const p = D.skills[n] || 0, f = skillFlags(D, n, ab);
            return (
              <button key={n} className={'skill' + (p ? ' prof' : '')} onClick={() => d20(n, skillBonus(D, n, ab), f)}>
                <span>{n}{f.adv && <i className="adv"> ▲</i>}{f.dis && <i className="dis"> ▼</i>}</span>
                <b>{sg(skillBonus(D, n, ab))}</b>
              </button>
            );
          })}
        </div>
        <p className="muted small">Douradas: proficiente. ▲ vantagem e ▼ desvantagem automáticas.</p>
      </div>

      <div className="card">
        <h2>Ferramentas <small>{D.combat.toolDouble ? `proficiência dobrada (+${tp})` : ''}</small></h2>
        {tools(D).map((t) => (
          <div className="toolrow" key={t}>
            <span>{t}</span>
            <span className="btns tight">
              {(['INT', 'SAB', 'DES', 'FOR'] as const).map((a) => (
                <button key={a} onClick={() => d20(`${t} (${a})`, mod(D, a) + tp)}>{a} {sg(mod(D, a) + tp)}</button>
              ))}
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Dados</h2>
        <div className="dice">
          {[4, 6, 8, 10, 12, 20, 100].map((n) => (
            <button key={n} onClick={() => { const r = d(n); show('d' + n, r, '', n === 20 && r === 20 ? 'crit' : n === 20 && r === 1 ? 'fail' : '', n === 20); }}>d{n}</button>
          ))}
          <button onClick={() => show('Moeda', d(2) === 1 ? 'Cara' : 'Coroa')}>moeda</button>
        </div>
      </div>
    </section>
  );
}
