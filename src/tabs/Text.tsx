import { Card, Rich } from '../components/ui';
import { update, useSheet } from '../lib/store';

export function Powers() {
  const D = useSheet();
  return (
    <section>
      <Card title="Habilidades"><Rich text={D.features} runes /></Card>
      <Card title="Proficiências e idiomas"><Rich text={D.profs} /></Card>
      <Card title="Personalidade">
        <Rich text={`Traços: ${D.pers.traits}\nIdeais: ${D.pers.ideals}\nVínculos: ${D.pers.bonds}\nDefeitos: ${D.pers.flaws}`} />
      </Card>
    </section>
  );
}

export function Story() {
  const D = useSheet();
  const i = D.info;
  const facts = [i.age && i.age + ' anos', i.height, i.weight, i.eyes && 'olhos ' + i.eyes, i.skin && 'pele ' + i.skin, i.hair].filter(Boolean);
  return (
    <section>
      <div className="story-hero">
        <img src="./retrato.jpg" alt="Sebastião e o Torresmin" />
      </div>
      <Card title="Aparência"><p className="muted">{facts.join(' · ')}</p><Rich text={D.appearance} /></Card>
      <Card title="História" className="lore"><Rich text={D.lore} /></Card>
      <Card title="Aliados"><Rich text={D.allies} /></Card>
    </section>
  );
}

const COINS: [keyof ReturnType<typeof useSheet>['coins'], string][] = [['cp', 'PC'], ['sp', 'PP'], ['ep', 'PE'], ['gp', 'PO'], ['pp', 'PL']];

export function Bag() {
  const D = useSheet();
  const gpTotal = D.coins.cp / 100 + D.coins.sp / 10 + D.coins.ep / 2 + D.coins.gp + D.coins.pp * 10;
  const area = (k: 'equipment' | 'treasure' | 'notes', rows: number, ph = '') => (
    <textarea rows={rows} value={D[k]} placeholder={ph} onChange={(e) => update((x) => { x[k] = e.target.value; })} />
  );
  return (
    <section>
      <Card title="Bolsa de moedas" right={`≈ ${Math.round(gpTotal * 100) / 100} PO`}>
        <div className="coins">
          {COINS.map(([k, l]) => (
            <label key={k}>{l}
              <input type="number" inputMode="numeric" value={D.coins[k]} onChange={(e) => update((x) => { x.coins[k] = +e.target.value || 0; })} />
              <span className="coinbtns">
                <button onClick={() => update((x) => { x.coins[k] = Math.max(0, x.coins[k] - 1); })}>−</button>
                <button onClick={() => update((x) => { x.coins[k] += 1; })}>+</button>
              </span>
            </label>
          ))}
        </div>
      </Card>
      <Card title="Equipamento">{area('equipment', 5)}</Card>
      <Card title="Tesouro">{area('treasure', 3)}</Card>
      <Card title="Anotações da sessão">{area('notes', 9, 'NPCs, pistas, quem deve o quê pro Seu Lauro...')}</Card>
    </section>
  );
}
