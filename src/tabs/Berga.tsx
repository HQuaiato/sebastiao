import { useState } from 'react';
import { Card, Mugs } from '../components/ui';
import { mod, toolProf } from '../lib/calc';
import { d, d20, show } from '../lib/dice';
import { getSheet, update, useSheet } from '../lib/store';

const CATS: { k: string; e: string; o: string[] }[] = [
  { k: 'Malte', e: '🌾', o: ['Pilsen claro', 'Âmbar', 'Torrado', 'Trigo'] },
  { k: 'Lúpulo', e: '🌿', o: ['Nenhum', 'Pouco', 'Médio', 'Muito'] },
  { k: 'Bergamota', e: '🍊', o: ['Casca', 'Suco', 'Casca e suco', 'Folhas'] },
  { k: 'Fervura', e: '🔥', o: ['30 min', '60 min', '90 min'] },
  { k: 'Fermentação', e: '🛢️', o: ['Fria (porão)', 'Ambiente', 'Quente (forno)'] },
  { k: 'Runa na tampa', e: 'ᚱ', o: ['Nenhuma', 'Fogo', 'Nuvem'] },
];
const DC = 14;

const TASTE = [
  'Isso nem parece cerveja. O Torresmin se recusa a lamber.',
  'Bebível. Mas não tem nada dela aqui.',
  'Tem alguma coisa... um eco distante.',
  'Metade do caminho. O amargo está quase lá.',
  'Ele para de beber no meio. Quase. Quase.',
  'Os olhos dele enchem d’água. Falta só um detalhe.',
];

function ensureTarget() {
  if (getSheet().game.target) return;
  update((x) => { x.game.target = CATS.map((c) => d(c.o.length) - 1); x.game.revealed = []; x.game.hint = false; });
}

export function Berga() {
  const D = useSheet();
  const g = D.game;
  const [pick, setPick] = useState<number[]>(() => CATS.map(() => 0));
  const [last, setLast] = useState<{ m: number; line: string } | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [form, setForm] = useState({ name: '', ing: '', obs: '', rating: 0 });
  const tp = toolProf(D);
  const best = Math.max(0, ...D.brews.filter((b) => !b.goal).map((b) => b.rating || 0));

  const brew = () => {
    ensureTarget();
    const t = getSheet().game.target!;
    const m = pick.reduce((n, v, i) => n + (v === t[i] ? 1 : 0), 0);
    const rating = Math.round((m * 5) / CATS.length);
    const ing = CATS.map((c, i) => `${c.k}: ${c.o[pick[i]]}`).join(' · ');
    const n = getSheet().game.tries + 1;
    update((x) => {
      x.game.tries = n;
      x.game.hint = false;
      if (m === CATS.length) x.game.solved = true;
      x.brews.unshift({ name: m === CATS.length ? `Leva nº ${n}: a berga da mãe!` : `Leva nº ${n}`, ing, obs: TASTE[Math.min(m, 5)], rating, goal: false, ts: Date.now() });
    });
    setLast({ m, line: m === CATS.length ? 'É ela.' : TASTE[Math.min(m, 5)] });
    if (m === CATS.length) setCelebrate(true);
    show('🍺 Leva nº ' + n, '🍺'.repeat(rating) || '—', `${m} de ${CATS.length} detalhes certos`, m === CATS.length ? 'crit' : m >= 4 ? 'good' : '');
  };

  const taste = () => {
    ensureTarget();
    const G = getSheet().game;
    if (G.hint) { show('Provar e julgar', 'Já provou', 'faça uma nova leva antes de provar de novo', 'fail'); return; }
    const r = d20(`Provar e julgar (SAB + cervejeiro) · CD ${DC}`, mod(D, 'SAB') + tp);
    const left = CATS.map((_, i) => i).filter((i) => !G.revealed.includes(i));
    if (r.tot >= DC && left.length) {
      const i = left[d(left.length) - 1];
      update((x) => { x.game.hint = true; x.game.revealed.push(i); });
      setTimeout(() => show('👃 Lembrança', `${CATS[i].e} ${CATS[i].o[G.target![i]]}`, `${CATS[i].k}: o gosto voltou. Era assim.`, 'good'), 1500);
    } else {
      update((x) => { x.game.hint = true; });
      if (r.tot < DC) setTimeout(() => show('👃 Provar e julgar', 'Nada', 'o gosto escapa. Tente outra leva.', 'fail'), 1500);
    }
  };

  const restart = () => {
    if (!confirm('Começar uma receita nova? O diário continua.')) return;
    update((x) => { x.game = { target: CATS.map((c) => d(c.o.length) - 1), revealed: [], hint: false, tries: 0, solved: false }; });
    setLast(null);
  };

  const addManual = () => {
    if (!form.name.trim()) return;
    update((x) => { x.brews.unshift({ ...form, name: form.name.trim(), goal: false, ts: Date.now() }); });
    setForm({ name: '', ing: '', obs: '', rating: 0 });
    show('Brassagem registrada', '🍺', form.name);
  };

  return (
    <section>
      <Card className="goal" title="A busca pela Berga perfeita" right={best ? 'melhor: ' + '🍺'.repeat(best) : 'nenhuma leva ainda'}>
        <p className="quote">"Clara, amarga, cítrica. Ela deixava eu provar na ponta do dedo."</p>
        <p className="muted">Minijogo: monte a receita e brasse. As canecas dizem o quão perto você chegou da cerveja da mãe. Provar e julgar (SAB + cervejeiro, CD {DC}) devolve a lembrança de um ingrediente. É só diversão; a receita de verdade quem decide é o mestre.</p>
      </Card>

      <Card title={`Caldeirão · leva nº ${g.tries + 1}`} right={g.solved ? '✅ receita descoberta' : ''}>
        {CATS.map((c, ci) => (
          <div className="cat" key={c.k}>
            <div className="cat-k">{c.e} {c.k}{g.target && g.revealed.includes(ci) && <span className="tag adv">lembra: {c.o[g.target[ci]]}</span>}</div>
            <div className="chips">
              {c.o.map((o, oi) => (
                <button key={o} className={'chip' + (pick[ci] === oi ? ' on' : '')} onClick={() => setPick((p) => p.map((v, i) => (i === ci ? oi : v)))}>{o}</button>
              ))}
            </div>
          </div>
        ))}
        <div className="btns">
          <button className="primary" onClick={brew}>🍺 Brassar</button>
          <button onClick={taste} disabled={g.hint}>👃 Provar e julgar</button>
          <button onClick={() => d20('Brassagem (INT + cervejeiro)', mod(D, 'INT') + tp)}>🧪 Teste de brassagem</button>
        </div>
        {last && (
          <div className="taste">
            <Mugs value={Math.round((last.m * 5) / CATS.length)} />
            <p>{last.line}</p>
          </div>
        )}
        {g.solved && <p className="muted">Ele já reencontrou o gosto. <button className="mini" onClick={restart}>nova receita</button></p>}
      </Card>

      <Card title="Registrar brassagem da mesa">
        <div className="field"><label>Nome da leva</label><input value={form.name} placeholder="ex: Berga com casca seca de Porto Triste" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label>Ingredientes e processo</label><textarea rows={2} value={form.ing} onChange={(e) => setForm({ ...form, ing: e.target.value })} /></div>
        <div className="field"><label>O que achou</label><input value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} /></div>
        <div className="row static"><Mugs value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} /><button onClick={addManual}>Registrar 🍺</button></div>
      </Card>

      <Card title="Diário de brassagem">
        {D.brews.map((b, i) => (
          <div className={'brew' + (b.goal ? ' goal' : '')} key={i}>
            <div className="t"><b>{b.goal ? '🎯 ' : ''}{b.name}</b>
              {b.goal ? <span>🍺🍺🍺🍺🍺</span> : <Mugs value={b.rating || 0} onChange={(n) => update((x) => { x.brews[i].rating = n; })} />}
            </div>
            {b.ing && <div className="muted small">{b.ing}</div>}
            {b.obs && <div>{b.obs}</div>}
            <div className="row static foot">
              <span className="muted small">{b.ts ? new Date(b.ts).toLocaleDateString('pt-BR') : b.goal ? 'a lembrança' : ''}</span>
              {!b.goal && <button className="mini del" onClick={() => confirm('Apagar essa leva?') && update((x) => { x.brews.splice(i, 1); })}>apagar</button>}
            </div>
          </div>
        ))}
      </Card>

      {celebrate && (
        <div className="celebrate" onClick={() => setCelebrate(false)}>
          <div className="celebrate-card">
            <div className="big-mugs">🍺</div>
            <h2 className="cz">É ela.</h2>
            <p>Clara, amarga, cítrica. Por um segundo, o depósito some e ele tem cinco anos de novo, provando cerveja na ponta do dedo da mãe.</p>
            <p className="muted">O Torresmin lambe o chão onde caiu uma gota. Toque para fechar.</p>
          </div>
        </div>
      )}
    </section>
  );
}
