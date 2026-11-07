import { useState } from 'react';
import { Card } from '../components/ui';
import { ABN, ABS, mod, PB, sg, skillBonus, skillFlags, SKILLS, toolProf, tools } from '../lib/calc';
import { clearLog, d, d20, rollExpr, show, useLog } from '../lib/dice';
import { useSheet } from '../lib/store';
import type { Ab } from '../data/default';

export function Tests() {
  const D = useSheet();
  const log = useLog();
  const [expr, setExpr] = useState('');
  const giantFor = (a: Ab) => a === 'FOR' && D.state.giant;
  const tp = toolProf(D);

  return (
    <section>
      <Card title="Atributos" right="toque para testar">
        <div className="grid g6">
          {ABS.map((a) => (
            <button key={a} className="stat" onClick={() => d20('Teste de ' + ABN[a], mod(D, a), { adv: giantFor(a) })}>
              <div className="n">{a}</div><div className="m">{sg(mod(D, a))}</div><div className="s">{D.scores[a]}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Salvaguardas">
        {ABS.map((a) => {
          const p = D.saves.includes(a);
          const v = mod(D, a) + (p ? PB(D) : 0);
          return (
            <button className="row" key={a} onClick={() => d20('Salvaguarda de ' + ABN[a], v, { adv: giantFor(a) })}>
              <span><span className={'dot' + (p ? ' p' : '')} />{ABN[a]}{giantFor(a) && <span className="tag adv">vant. ⛰️</span>}</span>
              <span className="v">{sg(v)}</span>
            </button>
          );
        })}
      </Card>

      <Card title="Perícias" right={'Percepção passiva ' + (10 + skillBonus(D, 'Percepção', 'SAB'))}>
        {SKILLS.map(([n, ab]) => {
          const p = D.skills[n] || 0, f = skillFlags(D, n, ab);
          return (
            <button className="row" key={n} onClick={() => d20(n, skillBonus(D, n, ab), f)}>
              <span>
                <span className={'dot' + (p === 2 ? ' e' : p ? ' p' : '')} />{n}<span className="tag">{ab}</span>
                {f.adv && <span className="tag adv">vant.</span>}{f.dis && <span className="tag dis">desv.</span>}
              </span>
              <span className="v">{sg(skillBonus(D, n, ab))}</span>
            </button>
          );
        })}
      </Card>

      <Card title="Ferramentas">
        {tools(D).map((t) => (
          <div className="row static" key={t}>
            <span>{t}</span>
            <span className="btns tight">
              {(['INT', 'SAB', 'DES', 'FOR'] as Ab[]).map((a) => (
                <button key={a} onClick={() => d20(`${t} (${a})`, mod(D, a) + tp)}>{a} {sg(mod(D, a) + tp)}</button>
              ))}
            </span>
          </div>
        ))}
        <p className="muted">{D.combat.toolDouble ? `A Runa de Fogo dobra a proficiência (+${tp}). ` : ''}O mestre diz qual atributo usar.</p>
      </Card>

      <Card title="Dados livres">
        <div className="dice">
          {[4, 6, 8, 10, 12, 20, 100].map((n) => (
            <button key={n} onClick={() => { const r = d(n); show('d' + n, r, '', n === 20 && r === 20 ? 'crit' : n === 20 && r === 1 ? 'fail' : '', n === 20); }}>d{n}</button>
          ))}
          <button onClick={() => show('Moeda', d(2) === 1 ? 'Cara' : 'Coroa')}>moeda</button>
        </div>
        <form className="exprrow" onSubmit={(e) => { e.preventDefault(); const r = rollExpr(expr); if (r) show(expr, r.tot, r.det); else show('Expressão inválida', '—', 'use algo como 2d6+3', 'fail'); }}>
          <input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="ex: 2d6+3" />
          <button>Rolar</button>
        </form>
      </Card>

      <Card title="Histórico" right={<button className="mini" onClick={clearLog}>limpar</button>}>
        <div className="log">
          {log.length === 0 && <div>Nenhuma rolagem ainda.</div>}
          {log.map((r) => <div key={r.id}><b>{r.label}: {r.total}</b>{r.detail ? ' · ' + r.detail : ''}</div>)}
        </div>
      </Card>
    </section>
  );
}
