import { useEffect, useRef, useState } from 'react';
import { lvl } from '../lib/calc';
import { useSheet, useSync } from '../lib/store';

export type Tab = 'jogo' | 'testes' | 'mochila' | 'ficha' | 'editar';
export const TABS: [Tab, string][] = [
  ['jogo', '⚔️ Jogo'], ['testes', '🎲 Testes'], ['mochila', '🎒 Itens'], ['ficha', '📖 Ficha'], ['editar', '✏️ Editar'],
];

export function Header({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const D = useSheet();
  const sync = useSync();
  const [zoom, setZoom] = useState(false);
  const [hurt, setHurt] = useState(0);
  const prev = useRef(D.state.hp + D.state.temp);
  const hp = D.state.hp, max = +D.combat.hpMax || 1;

  useEffect(() => {
    const now = D.state.hp + D.state.temp;
    if (now < prev.current) setHurt((h) => h + 1);
    prev.current = now;
  }, [D.state.hp, D.state.temp]);

  const state = D.state.giant ? 'giant' : hp <= 0 ? 'down' : hp / max < 0.34 ? 'low' : '';

  return (
    <>
      <header className="wrap hdr">
        <button className={`portrait ${state}`} key={hurt} data-hurt={hurt > 0 ? 1 : 0} onClick={() => setZoom(true)} aria-label="Ver retrato">
          <img src="./retrato.jpg" alt="" />
        </button>
        <div className="hdr-text">
          <h1>{D.info.name}</h1>
          <p className="sub">{D.info.race} · {D.info.cls} {lvl(D)}{D.info.sub ? ` · ${D.info.sub}` : ''}</p>
        </div>
        <button className={'pill ' + sync.kind} title={sync.text} onClick={() => setTab('editar')}>{sync.text.split(' ')[0]}</button>
      </header>

      <div className={'sticky' + (D.state.giant ? ' giant' : '')}>
        <div className="wrap">
          <nav>
            {TABS.map(([id, label]) => (
              <button key={id} className={tab === id ? 'on' : ''} onClick={() => { setTab(id); window.scrollTo({ top: 0 }); }}>{label}</button>
            ))}
          </nav>
          {tab !== 'jogo' && (
            <div className="quick">
              <span>❤️ <b>{hp}/{max}</b>{D.state.temp ? <b className="tmp"> +{D.state.temp}</b> : null}</span>
              <span>🛡️ <b>{D.combat.ac}</b></span>
              {D.state.giant && <span className="q-giant">⛰️ GIGANTE</span>}
            </div>
          )}
        </div>
      </div>

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(false)}>
          <img src="./retrato.jpg" alt="Sebastião e o Torresmin" />
        </div>
      )}
    </>
  );
}
