import { useEffect, useState } from 'react';
import { Header, TABS, type Tab } from './components/Header';
import { RollOverlay } from './components/RollOverlay';
import { Berga } from './tabs/Berga';
import { Combat } from './tabs/Combat';
import { Edit } from './tabs/Edit';
import { Tests } from './tabs/Tests';
import { Bag, Powers, Story } from './tabs/Text';
import { Torresmin } from './tabs/Torresmin';
import { useSheet } from './lib/store';

const LS_TAB = 'sebastiao-tab';
const firstTab = (): Tab => {
  try {
    const t = localStorage.getItem(LS_TAB) as Tab | null;
    if (t && TABS.some(([id]) => id === t)) return t;
  } catch { /* ignore */ }
  return 'combate';
};

export default function App() {
  const [tab, setTab] = useState<Tab>(firstTab);
  const D = useSheet();
  useEffect(() => { try { localStorage.setItem(LS_TAB, tab); } catch { /* ignore */ } }, [tab]);
  useEffect(() => { document.title = D.info.name.replace(/"[^"]*"\s*/, ''); }, [D.info.name]);

  return (
    <div className={'app' + (D.state.giant ? ' is-giant' : '') + (D.state.hp <= 0 ? ' is-down' : '')}>
      <Header tab={tab} setTab={setTab} />
      <main className="wrap">
        {tab === 'combate' && <Combat />}
        {tab === 'testes' && <Tests />}
        {tab === 'poderes' && <Powers />}
        {tab === 'torresmin' && <Torresmin />}
        {tab === 'berga' && <Berga />}
        {tab === 'mochila' && <Bag />}
        {tab === 'historia' && <Story />}
        {tab === 'editar' && <Edit />}
      </main>
      <RollOverlay />
    </div>
  );
}
