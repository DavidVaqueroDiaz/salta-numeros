import type { LevelData } from './types'

// FASE FINAL DEL MUNDO 3: el REMOLINO. Flota en una arena aérea sobre lava.
// Su ataque te hace girar y te lanza fuera de la plataforma; hay que volver,
// subir por las plataformas para coger altura y caerle ENCIMA (pisotón) o
// darle con un cubo de Rubik. Rescata a Xiana al final.
// (generado con tools/gen-levels3.mjs; puede editarse a mano)
export const nivelFinal3: LevelData = {
  numero: 10,
  color: '#48cae4',
  tema: 'espacio',
  mapa: [
    '......................................................................................................................................................',
    '......................................................................................................................................................',
    '......................................................................................................................................................',
    '......................................................................#ooo............................................................................',
    '........................................###.....................................................#o#...................................................',
    '...................................o......................###...............................###.......................................................',
    '..................................###.........................................###.......................................###...........................',
    '..............................................#H#.....................................Y.............###...............................................',
    '...P............G.....R.###.....................................###...........................................###...............................X.....',
    '#########LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL################',
    '#########LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL################',
  ],
  puertas: { tipo: 'reto3', max: 12 },
  parMs: 200000,
  aviso: '🌀 ¡El REMOLINO te lanza por los aires! Sube alto y cáele encima',
}
