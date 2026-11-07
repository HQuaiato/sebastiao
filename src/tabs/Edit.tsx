import { useRef, useState } from 'react';
import { Card, Field } from '../components/ui';
import { ABN, ABS, mod, PB, sg, SKILLS } from '../lib/calc';
import { show } from '../lib/dice';
import { cloudGet, cloudSave, fromAny, getToken, replace, resetSheet, setToken, update, useSheet } from '../lib/store';
import type { Ab } from '../data/default';

const AB_OPTS = ABS.map((a) => [a, a] as [string, string]);

export function Edit() {
  const D = useSheet();
  const [tok, setTok] = useState(getToken());
  const file = useRef<HTMLInputElement>(null);

  const pull = async () => {
    try {
      const r = await cloudGet();
      if (!r) { show('Nuvem', 'Vazia', 'ainda não tem ficha.json no repositório', 'fail'); return; }
      if (!confirm('Trocar a ficha deste aparelho pela que está na nuvem?')) return;
      replace(r, false);
      show('Nuvem', 'Ficha puxada', '', 'good');
    } catch (e) { show('Nuvem', 'Erro', (e as Error).message, 'fail'); }
  };
  const exportJson = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(D, null, 1)], { type: 'application/json' }));
    a.download = 'ficha-sebastiao.json';
    a.click();
  };
  const importJson = async (f?: File) => {
    if (!f) return;
    try { replace(fromAny(JSON.parse(await f.text()))); show('Backup', 'Importado', f.name, 'good'); }
    catch { show('Backup', 'Arquivo inválido', '', 'fail'); }
  };

  return (
    <section className="ed">
      <p className="muted" style={{ margin: '0 0 10px' }}>Toque num bloco para abrir. Tudo salva na hora.</p>
      <Card fold open={!getToken()} title="☁️ Salvar na nuvem (GitHub)">
        <p>A ficha é salva neste aparelho sozinha. Para ela ser <b>a mesma em qualquer lugar</b>, cole um token do GitHub. Toda mudança passa a ser gravada no <code>ficha.json</code> do repositório <b>HQuaiato/sebastiao</b>.</p>
        <div className="field"><label>Token do GitHub (fica só neste navegador)</label>
          <form className="exprrow" onSubmit={(e) => { e.preventDefault(); setToken(tok); }}>
            <input type="password" value={tok} placeholder="github_pat_..." autoComplete="off" onChange={(e) => setTok(e.target.value)} />
            <button>Salvar</button>
          </form>
        </div>
        <p className="help">Como gerar: GitHub → Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b> → Generate new token. Em "Repository access", escolha só <b>sebastiao</b>. Em "Permissions", ache <b>Contents</b> e escolha <b>Read and write</b>. Faça isso uma vez em cada aparelho.</p>
        <div className="btns">
          <button onClick={pull}>⬇️ Puxar da nuvem</button>
          <button onClick={() => { if (!getToken()) show('Nuvem', 'Sem token', 'cole o token primeiro', 'fail'); else cloudSave(); }}>⬆️ Enviar agora</button>
          <button onClick={exportJson}>💾 Baixar backup</button>
          <button onClick={() => file.current?.click()}>📂 Importar backup</button>
          <input ref={file} type="file" accept=".json,application/json" hidden onChange={(e) => { importJson(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      </Card>

      <Card fold open title="Identidade">
        <Field path="info.name" label="Nome" />
        <div className="two">
          <Field path="info.player" label="Jogador" />
          <Field path="info.race" label="Raça" />
          <Field path="info.cls" label="Classe" />
          <Field path="info.sub" label="Subclasse" />
          <Field path="info.level" label="Nível" kind="number" />
          <Field path="info.background" label="Antecedente" />
          <Field path="info.alignment" label="Tendência" />
          <Field path="info.age" label="Idade" />
          <Field path="info.height" label="Altura" />
          <Field path="info.weight" label="Peso" />
          <Field path="info.eyes" label="Olhos" />
          <Field path="info.skin" label="Pele" />
        </div>
        <Field path="info.hair" label="Cabelo" />
        <p className="help">O bônus de proficiência sai do nível sozinho (agora {sg(PB(D))}).</p>
      </Card>

      <Card fold title="Atributos" right="valor, não modificador">
        <div className="six">
          {ABS.map((a) => (
            <div className="field" key={a}>
              <label>{a} ({sg(mod(D, a))})</label>
              <input type="number" inputMode="numeric" value={D.scores[a]} onChange={(e) => update((x) => { x.scores[a] = +e.target.value || 0; })} />
            </div>
          ))}
        </div>
        <label className="lbl">Salvaguardas com proficiência</label>
        <div className="wrapchk">
          {ABS.map((a) => (
            <label className="chk" key={a}>
              <input type="checkbox" checked={D.saves.includes(a)} onChange={(e) => update((x) => { x.saves = e.target.checked ? [...x.saves, a] : x.saves.filter((s) => s !== a); })} /> {ABN[a]}
            </label>
          ))}
        </div>
      </Card>

      <Card fold title="Combate">
        <div className="three">
          <Field path="combat.ac" label="CA" kind="number" />
          <Field path="combat.hpMax" label="PV máximo" kind="number" />
          <Field path="combat.speed" label="Deslocamento" />
          <Field path="combat.initBonus" label="Bônus de iniciativa" kind="number" />
          <Field path="combat.hitDie" label="Dado de vida" kind="number" options={[['6', 'd6'], ['8', 'd8'], ['10', 'd10'], ['12', 'd12']]} />
          <Field path="combat.runeAb" label="Atributo das runas" options={AB_OPTS} />
        </div>
        <Field path="combat.savage" kind="check" label="Ataques Selvagens (dado extra no crítico)" />
        <Field path="combat.toolDouble" kind="check" label="Runa de Fogo: dobra proficiência com ferramentas" />
        <Field path="combat.cloudAdv" kind="check" label="Runa de Nuvem: vantagem em Prestidigitação e Enganação" />
        <Field path="combat.stealthDis" kind="check" label="Armadura dá desvantagem em Furtividade" />
      </Card>

      <Card fold title="Armas" right={<button className="mini" onClick={() => update((x) => { x.weapons.push({ name: 'Nova arma', ab: 'FOR', dice: '1d6', type: '', bonus: 0, note: '' }); })}>+ arma</button>}>
        {D.weapons.map((_, i) => (
          <div className="item" key={i}>
            <div className="two">
              <Field path={`weapons.${i}.name`} label="Nome" />
              <Field path={`weapons.${i}.type`} label="Tipo de dano" />
            </div>
            <div className="three">
              <Field path={`weapons.${i}.dice`} label="Dado" placeholder="1d8" />
              <Field path={`weapons.${i}.ab`} label="Atributo" options={AB_OPTS} />
              <Field path={`weapons.${i}.bonus`} label="Bônus mágico" kind="number" />
            </div>
            <Field path={`weapons.${i}.note`} label="Observação" />
            <div className="right"><button className="mini del" onClick={() => confirm('Remover essa arma?') && update((x) => { x.weapons.splice(i, 1); })}>remover</button></div>
          </div>
        ))}
      </Card>

      <Card fold title="Recursos" right={<button className="mini" onClick={() => update((x) => { x.resources.push({ id: 'r' + Date.now(), name: 'Novo recurso', desc: '', max: 1, reset: 'long' }); })}>+ recurso</button>}>
        {D.resources.map((_, i) => (
          <div className="item" key={D.resources[i].id}>
            <div className="two">
              <Field path={`resources.${i}.name`} label="Nome" />
              <Field path={`resources.${i}.desc`} label="Descrição" />
            </div>
            <div className="three">
              <Field path={`resources.${i}.max`} label="Usos" kind="number" />
              <Field path={`resources.${i}.reset`} label="Volta no" options={[['short', 'descanso curto'], ['long', 'descanso longo']]} />
              <div className="field"><label>&nbsp;</label><button className="mini del" onClick={() => confirm('Remover esse recurso?') && update((x) => { x.resources.splice(i, 1); })}>remover</button></div>
            </div>
          </div>
        ))}
        <p className="help">"Curto" volta no descanso curto e no longo. "Longo" volta só no longo.</p>
      </Card>

      <Card fold title="Perícias">
        {SKILLS.map(([n, ab]) => (
          <div className="skillrow" key={n}>
            <span>{n} <span className="tag">{ab as Ab}</span></span>
            <select value={D.skills[n] || 0} onChange={(e) => update((x) => { const v = +e.target.value; if (v) x.skills[n] = v; else delete x.skills[n]; })}>
              <option value={0}>—</option><option value={1}>Proficiente</option><option value={2}>Especialista</option>
            </select>
          </div>
        ))}
      </Card>

      <Card fold title="Textos">
        <p className="help">Formatação: <code>## Título</code> vira título, <code>Nome: texto</code> deixa o nome em destaque e <code>- item</code> vira lista.</p>
        <Field path="toolsText" label="Ferramentas (uma por linha)" kind="area" rows={3} />
        <Field path="features" label="Habilidades e características" kind="area" rows={14} />
        <Field path="profs" label="Proficiências e idiomas" kind="area" rows={4} />
        <Field path="pers.traits" label="Traços de personalidade" kind="area" rows={3} />
        <Field path="pers.ideals" label="Ideais" kind="area" rows={2} />
        <Field path="pers.bonds" label="Vínculos" kind="area" rows={2} />
        <Field path="pers.flaws" label="Defeitos" kind="area" rows={3} />
        <Field path="appearance" label="Aparência" kind="area" rows={6} />
        <Field path="lore" label="História" kind="area" rows={16} />
        <Field path="allies" label="Aliados e organizações" kind="area" rows={3} />
      </Card>

      <Card fold title="Zona de perigo">
        <button className="del" onClick={() => confirm('Apagar tudo e voltar à ficha original?') && resetSheet()}>Voltar a ficha ao original</button>
        <p className="help">Apaga as mudanças e volta para a ficha que veio no app.</p>
      </Card>
    </section>
  );
}
