# 🍺 Sebastião "Ugrak" Bariga

Meio-orc · Guerreiro 4 (Cavaleiro Rúnico) · Cervejeiro de Porão

## ▶️ [Abrir a ficha](https://hquaiato.github.io/sebastiao/)

<img src="public/retrato.jpg" width="260" alt="Sebastião e o Torresmin">

Ficha interativa feita em React + TypeScript + Vite, publicada no GitHub Pages pelo GitHub Actions a cada push (igual ao CellCare). Dá para instalar como app no celular.

## O que tem

- **⚔️ Combate:** PV com dano/cura/temporário, testes contra a morte, ataques com dano automático (Gigante e Ataques Selvagens), runas, recursos e descansos
- **🎲 Testes:** atributos, salvaguardas, perícias e ferramentas com vantagem/desvantagem automática, dados livres e histórico
- **🐷 Torresmin:** o porquinho, com fome e alegria que mudam com o tempo real
- **🍺 A Berga:** minijogo para recriar a cerveja de bergamota da mãe, mais o diário de brassagem
- **🎒 Mochila**, **📜 Poderes**, **📖 História**
- **✏️ Editar:** muda qualquer número ou texto da ficha; o resto se recalcula sozinho

## Salvar em qualquer aparelho

A ficha salva sozinha no aparelho. Para ficar igual em todos, abra **✏️ Editar** e cole um token do GitHub (fine-grained, só para o repositório `sebastiao`, com **Contents: Read and write**). Aí cada mudança é gravada no `ficha.json` deste repositório.

## Desenvolver

```bash
npm install
npm run dev
```

```
src/data/      ficha padrão
src/lib/       cálculos, dados, save/sincronização
src/components cabeçalho, d20 animado, Torresmin
src/tabs/      telas
```
