import type { Sheet } from './default';
import { gmDie, lvl, mod, PB, runeDC, sg } from '../lib/calc';

export interface PowerInfo { what: string; tech: string[]; tip?: string; scene: string }

/** Explicação dos poderes, com os números calculados a partir da ficha atual. */
export function powerInfo(id: string, D: Sheet): PowerInfo | null {
  const dc = runeDC(D);
  switch (id) {
    case 'sw': return {
      what: 'Recupera vida no meio da luta, sozinho, sem depender do bardo.',
      tech: ['Ação bônus', `Cura 1d10 + nível de guerreiro (1d10${sg(lvl(D))})`, '1 uso · volta no descanso curto ou longo'],
      tip: 'Use quando estiver abaixo da metade e ainda tiver a ação livre para atacar no mesmo turno.',
      scene: 'No meio da briga, o Sebastião dá um passo para trás, puxa o barrilzinho das costas, toma um gole longo e solta um arroto que faz o goblin hesitar. Ele limpa a boca no avental e volta para a frente.',
    };
    case 'as': return {
      what: 'Ganha uma ação a mais no seu turno: atacar de novo, correr, ajudar alguém, pegar um item.',
      tech: ['Não gasta ação (é no seu turno)', '1 ação extra, além da ação normal e da ação bônus', '1 uso · volta no descanso curto ou longo'],
      tip: 'Combina bem com o Gigante e com a Runa de Fogo no mesmo turno, para acabar logo com o inimigo mais perigoso.',
      scene: 'O bandido acha que acabou. O Sebastião larga o martelo no primeiro, e antes que alguém respire, já agarrou o segundo pela gola e o arremessou contra os barris.',
    };
    case 'gm': return {
      what: 'As runas da tampa acendem e ele cresce de verdade. Fica mais forte e bate mais.',
      tech: [
        'Ação bônus · dura 1 minuto (10 rodadas)',
        'Fica Grande, se houver espaço',
        'Vantagem em testes e salvaguardas de Força (inclui Atletismo para agarrar e empurrar)',
        `+1d${gmDie(D)} de dano, uma vez por turno, num ataque com arma`,
        `Usos = bônus de proficiência (${PB(D)}) · volta no descanso longo`,
      ],
      tip: 'Ative no primeiro turno da luta. Grande e com vantagem em Atletismo, ele agarra e empurra inimigos para longe do grupo.',
      scene: 'Ele vê a lâmina indo na direção do bardo e algo nele trava. As marcas na tampa do barril brilham laranja, como brasa de brassagem, e a luz sobe pelos braços. Os ossos estalam, as costuras do avental arrebentam, e de repente ele bate a cabeça na viga da taverna.',
    };
    case 'fr': return {
      what: 'Correntes de brasa saem da tampa e prendem o inimigo no chão, queimando.',
      tech: [
        'Sem ação: usa quando acerta um ataque com arma',
        '+2d6 de dano de fogo',
        `O alvo faz salvaguarda de Força CD ${dc}. Se falhar, fica impedido por 1 minuto`,
        'Impedido: deslocamento 0, ataques contra ele têm vantagem, os dele têm desvantagem',
        'Enquanto preso, toma 2d6 de fogo no início de cada turno dele e repete a salvaguarda no fim',
        '1 uso · volta no descanso curto ou longo',
        'Passivo: dobra a proficiência em testes com ferramentas',
      ],
      tip: 'Use num inimigo grande ou perigoso. Preso, ele dá vantagem para todo mundo, e o ladino ganha o ataque furtivo.',
      scene: 'O martelo acerta, e por um instante as runas da tampa brilham como o fundo do caldeirão. Correntes de brasa saem do chão e se enrolam nas pernas do ogro. Cheira a cevada queimada.',
    };
    case 'cr': return {
      what: 'Desvia um ataque que ia acertar um aliado para outra criatura.',
      tech: [
        'Reação · quando uma criatura que ele vê a até 9 m é atingida por um ataque',
        'Escolhe outra criatura a até 9 m dele (não pode ser o atacante)',
        'O ataque passa a mirar essa criatura, com a mesma rolagem',
        '1 uso · volta no descanso curto ou longo',
        'Passivo: vantagem em Prestidigitação e Enganação',
      ],
      tip: 'Guarde para um golpe forte ou um crítico no aliado mais frágil, e mande o ataque para outro inimigo.',
      scene: 'A flecha está a um palmo do pescoço do bardo quando um vapor quente, com cheiro de mosto, sobe da tampa. Ela faz uma curva no ar e crava no ombro do outro bandido. O Sebastião só diz: "Desculpa".',
    };
    case 're': return {
      what: 'O meio-orc se recusa a cair.',
      tech: ['Quando cai a 0 PV e não morre na hora', 'Fica com 1 PV em vez de 0', 'Não gasta ação', '1 uso · volta no descanso longo', 'O app pergunta sozinho quando você chega a 0'],
      scene: 'O golpe derruba ele de joelhos. O mundo fica escuro, e no escuro tem o gosto de bergamota. Ele cospe sangue, apoia o martelo no chão e se levanta de novo.',
    };
    case 'hd': return {
      what: 'Cura durante um descanso curto, gastando os dados de vida.',
      tech: [
        'Só no descanso curto (1 hora)',
        `Cada dado cura 1d${D.combat.hitDie} ${sg(mod(D, 'CON'))} (CON)`,
        `Total de dados = nível (${lvl(D)}) · gaste quantos quiser`,
        'O descanso longo devolve metade dos dados',
      ],
      scene: 'Ele senta num barril virado, tira a cota de malha, enfaixa os braços com um pano limpo e divide o resto do pão com o Torresmin.',
    };
    default: return null;
  }
}
