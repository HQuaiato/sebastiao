import type { ReactNode } from 'react';
import { Rich } from '../components/ui';
import { update, useSheet } from '../lib/store';

const Sec = ({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) => (
  <details className="card sec" open={open}>
    <summary>{title}</summary>
    <div className="sec-body">{children}</div>
  </details>
);

type CoinKey = 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
const COINS: [CoinKey, string][] = [['cp', 'PC'], ['sp', 'PP'], ['ep', 'PE'], ['gp', 'PO'], ['pp', 'PL']];

export function Bag() {
  const D = useSheet();
  return (
    <section>
      <div className="card">
        <h2>Moedas</h2>
        <div className="coins">
          {COINS.map(([k, l]) => (
            <label key={k}>{l}
              <input type="number" inputMode="numeric" value={D.coins[k]} onChange={(e) => update((x) => { x.coins[k] = +e.target.value || 0; })} />
            </label>
          ))}
        </div>
      </div>
      <div className="card">
        <h2>Equipamento</h2>
        <textarea rows={4} value={D.equipment} onChange={(e) => update((x) => { x.equipment = e.target.value; })} />
      </div>
      <div className="card">
        <h2>Anotações</h2>
        <textarea rows={8} value={D.notes} placeholder="NPCs, pistas, o que aconteceu na sessão..." onChange={(e) => update((x) => { x.notes = e.target.value; })} />
      </div>
    </section>
  );
}

export function Info() {
  const D = useSheet();
  const i = D.info;
  return (
    <section>
      <Sec title="Habilidades" open><Rich text={D.features} runes /></Sec>
      <Sec title="Proficiências e idiomas"><Rich text={D.profs} /></Sec>
      <Sec title="Personalidade">
        <Rich text={`Traços: ${D.pers.traits}\nIdeais: ${D.pers.ideals}\nVínculos: ${D.pers.bonds}\nDefeitos: ${D.pers.flaws}`} />
      </Sec>
      <Sec title="Aparência">
        <p className="muted">{[i.age && i.age + ' anos', i.height, i.weight, i.eyes && 'olhos ' + i.eyes, i.skin && 'pele ' + i.skin].filter(Boolean).join(' · ')}</p>
        <Rich text={D.appearance} />
      </Sec>
      <Sec title="História"><div className="lore"><Rich text={D.lore} /></div></Sec>
      <Sec title="Aliados"><Rich text={D.allies} /></Sec>
      <Sec title="Tesouro"><textarea rows={3} value={D.treasure} onChange={(e) => update((x) => { x.treasure = e.target.value; })} /></Sec>
    </section>
  );
}
