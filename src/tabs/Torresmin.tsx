import { useEffect, useState } from 'react';
import { Card } from '../components/ui';
import { Pig, type PigMood } from '../components/Pig';
import { skillBonus, skillFlags } from '../lib/calc';
import { d, d20, show } from '../lib/dice';
import { update, useSheet } from '../lib/store';
import type { Sheet } from '../data/default';

const HUNGER_PER_H = 10; // fome sobe 10 por hora real
const JOY_PER_H = 7;     // alegria cai 7 por hora real
const clamp = (n: number) => Math.max(0, Math.min(100, n));

function current(D: Sheet, now: number) {
  const ts = D.pet.ts || now;
  const h = Math.max(0, now - ts) / 3_600_000;
  return { hunger: clamp(D.pet.hunger + h * HUNGER_PER_H), joy: clamp(D.pet.joy - h * JOY_PER_H) };
}

const PLAY = [
  'corre em círculos atrás do próprio rabo',
  'rouba uma noz da mesa e foge',
  'se esconde atrás da tampa do barril',
  'rola na serragem do depósito',
  'empurra uma caneca vazia com o focinho',
  'tenta subir no barrigão do Sebastião',
];
const PET = ['fecha os olhos e grunhe baixinho', 'encosta a cabeça na mão enorme dele', 'abana o rabinho enrolado', 'deita de barriga pra cima'];
const SNACK = ['mastiga uma casca de cevada', 'devora um pedaço de maçã', 'come resto de pão da taverna', 'ganha um gole de mosto doce (só um)'];
const pick = <T,>(a: T[]) => a[d(a.length) - 1];

export function Torresmin() {
  const D = useSheet();
  const [now, setNow] = useState(Date.now());
  const [anim, setAnim] = useState<{ k: number; type: string; line: string }>({ k: 0, type: '', line: '' });
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 20_000); return () => clearInterval(iv); }, []);

  const { hunger, joy } = current(D, now);
  const hpFrac = D.state.hp / (+D.combat.hpMax || 1);
  const hour = new Date(now).getHours();

  let mood: PigMood = 'ok';
  let line = 'Torresmin fareja o ar, procurando cheiro de bergamota.';
  if (D.state.hp <= 0) { mood = 'worried'; line = 'Torresmin cutuca o Sebastião caído com o focinho e não sai do lado dele.'; }
  else if (hpFrac < 0.34) { mood = 'worried'; line = 'Ele guincha baixinho. O grandão está muito machucado.'; }
  else if (hunger > 70) { mood = 'hungry'; line = 'Ronc. A barriguinha dele está roncando mais alto que ele.'; }
  else if (joy < 30) { mood = 'sad'; line = 'Ele está jogado num canto, querendo atenção.'; }
  else if (hour >= 1 && hour < 6) { mood = 'sleep'; line = 'Zzz... dormindo enrolado no cachecol.'; }
  else if (joy > 60 && hunger < 50) { mood = 'happy'; line = D.state.giant ? 'Ele assiste o Sebastião gigante com orgulho de dono.' : 'Feliz da vida no ombro do Sebastião.'; }

  const act = (type: string, fn: (p: { hunger: number; joy: number }) => { hunger: number; joy: number }, l: string, extra?: (x: Sheet) => void) => {
    const n = fn({ hunger, joy });
    update((x) => { x.pet.hunger = clamp(n.hunger); x.pet.joy = clamp(n.joy); x.pet.ts = Date.now(); extra?.(x); });
    setNow(Date.now());
    setAnim((a) => ({ k: a.k + 1, type, line: l }));
  };

  const snack = () => {
    if (hunger < 8) { setAnim((a) => ({ k: a.k + 1, type: 'no', line: 'Ele vira a cara. Tá cheio.' })); return; }
    act('snack', (p) => ({ hunger: p.hunger - 30, joy: p.joy + 5 }), 'Torresmin ' + pick(SNACK) + '.', (x) => { x.pet.snacks = (x.pet.snacks || 0) + 1; });
  };
  const pet = () => act('love', (p) => ({ hunger: p.hunger, joy: p.joy + 20 }), 'Torresmin ' + pick(PET) + '.');
  const play = () => {
    const r = d(20);
    if (r === 20) {
      act('play', (p) => ({ hunger: p.hunger + 8, joy: p.joy + 20 }), 'Fuçando a terra, ele desenterra uma moeda de ouro!', (x) => { x.coins.gp += 1; });
      show('🐷 Torresmin achou algo!', '+1 PO', 'tirou 20 brincando', 'crit');
      return;
    }
    if (r === 1) { act('play', (p) => ({ hunger: p.hunger + 8, joy: p.joy + 6 }), 'Ele derruba uma caneca cheia no chão. O Seu Lauro não vai gostar.'); return; }
    act('play', (p) => ({ hunger: p.hunger + 8, joy: p.joy + 12 }), 'Torresmin ' + pick(PLAY) + '.');
  };
  const handle = () => {
    const f = skillFlags(D, 'Lidar com Animais', 'SAB');
    d20('Lidar com Animais (Torresmin)', skillBonus(D, 'Lidar com Animais', 'SAB'), f);
  };

  return (
    <section>
      <Card className="pet-card">
        <div className="bubble">{anim.line || line}</div>
        <div className={'pet-stage ' + anim.type} key={anim.k} onClick={pet}>
          <Pig mood={anim.type === 'love' ? 'happy' : anim.type === 'no' ? 'ok' : mood} size={190} />
          {anim.type === 'love' && <div className="hearts" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ ['--i' as string]: i }}>❤</i>)}</div>}
          {anim.type === 'snack' && <div className="crumbs" aria-hidden>🌰</div>}
        </div>
        <p className="pet-name cz">Torresmin</p>
        <div className="meters">
          <div><span>🍽️ Barriga cheia</span><div className="meter"><i style={{ width: 100 - hunger + '%' }} className={hunger > 70 ? 'low' : ''} /></div></div>
          <div><span>💛 Alegria</span><div className="meter"><i style={{ width: joy + '%' }} className={joy < 30 ? 'low' : ''} /></div></div>
        </div>
        <div className="btns center">
          <button onClick={snack}>🌰 Petisco</button>
          <button onClick={pet}>🤲 Carinho</button>
          <button onClick={play}>🎾 Brincar</button>
        </div>
      </Card>

      <Card title="Na mesa">
        <p style={{ margin: '0 0 8px' }}>Precisa que o Torresmin faça alguma coisa (distrair um guarda, achar uma trilha, ficar quieto)? Role Lidar com Animais e mostre para o mestre.</p>
        <button onClick={handle}>🐾 Lidar com Animais {skillBonus(D, 'Lidar com Animais', 'SAB') >= 0 ? '+' : ''}{skillBonus(D, 'Lidar com Animais', 'SAB')}</button>
        <p className="muted">Petiscos dados até hoje: {D.pet.snacks || 0}. A fome e a alegria mudam com o tempo real, mesmo com o app fechado.</p>
      </Card>
    </section>
  );
}
