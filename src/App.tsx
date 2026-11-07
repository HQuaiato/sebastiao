import { useEffect, useState } from 'react';
import { Header, TABS, type Tab } from './components/Header';
import { RollOverlay } from './components/RollOverlay';
import { Checks } from './tabs/Checks';
import { Edit } from './tabs/Edit';
import { Bag, Info } from './tabs/Info';
import { Play } from './tabs/Play';
import { getRole, useSheet } from './lib/store';
import { Login } from './components/Login';
import { Visitor } from './tabs/Visitor';

const LS_TAB = 'sebastiao-tab2';
const firstTab = (): Tab => {
  try {
    const t = localStorage.getItem(LS_TAB) as Tab | null;
    if (t && TABS.some(([id]) => id === t)) return t;
  } catch { /* ignore */ }
  return 'jogo';
};

export default function App() {
  const role = getRole();
  if (role === 'visitor') return <><Visitor /><RollOverlay /></>;
  if (role !== 'player') return <Login />;
  return <Player />;
}

function Player() {
  const [tab, setTab] = useState<Tab>(firstTab);
  const D = useSheet();
  useEffect(() => { try { localStorage.setItem(LS_TAB, tab); } catch { /* ignore */ } }, [tab]);
  useEffect(() => { document.title = D.info.name.replace(/"[^"]*"\s*/, ''); }, [D.info.name]);

  return (
    <div className={'app' + (D.state.giant ? ' is-giant' : '') + (D.state.hp <= 0 ? ' is-down' : '')}>
      <Header tab={tab} setTab={setTab} />
      <main className="wrap">
        {tab === 'jogo' && <Play />}
        {tab === 'testes' && <Checks />}
        {tab === 'mochila' && <Bag />}
        {tab === 'ficha' && <Info />}
        {tab === 'editar' && <Edit />}
      </main>
      <RollOverlay />
    </div>
  );
}
