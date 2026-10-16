import { bar } from './geometry'
import generatedLevels from './levels.generated.json'
import type { LevelDef } from './types'

export const TINTS = ['#4fb8ff', '#ffb44f', '#7fdc5a', '#ff6f8e', '#a77bff', '#3fd9b8']

const tutorial: LevelDef[] = [
  {
    id: 'L1',
    name: 'tut1',
    startBit: 'phillips',
    switches: 0,
    boxQueue: ['red', 'blue'],
    plates: [
      bar('a', 0, [-2.5, 2], [2.5, 2], TINTS[0], [
        { t: 0, color: 'red', head: 'phillips' },
        { t: 1, color: 'blue', head: 'phillips' },
      ]),
      bar('b', 1, [-2.5, 3.5], [-2.5, 0], TINTS[1], [
        { t: 0, color: 'blue', head: 'phillips' },
        { t: 1, color: 'red', head: 'phillips' },
      ]),
      bar('c', 2, [-1, -3], [3.2, 3.5], TINTS[2], [
        { t: 0, color: 'red', head: 'phillips' },
        { t: 1, color: 'blue', head: 'phillips' },
      ]),
    ],
  },
  {
    id: 'L2',
    name: 'tut2',
    startBit: 'phillips',
    switches: 2,
    boxQueue: ['red', 'yellow', 'blue'],
    plates: [
      bar('a', 0, [-3, 3], [3, 3], TINTS[0], [
        { t: 0, color: 'red', head: 'phillips' },
        { t: 0.5, color: 'yellow', head: 'flat' },
        { t: 1, color: 'blue', head: 'phillips' },
      ]),
      bar('b', 1, [-3, 4], [-3, -1], TINTS[1], [
        { t: 0, color: 'yellow', head: 'flat' },
        { t: 1, color: 'red', head: 'flat' },
      ]),
      bar('c', 1, [3, 4], [3, -1], TINTS[2], [
        { t: 0, color: 'blue', head: 'flat' },
        { t: 1, color: 'yellow', head: 'phillips' },
      ]),
      bar('d', 2, [1.5, -3.5], [3.8, 0.5], TINTS[3], [
        { t: 0, color: 'red', head: 'phillips' },
        { t: 1, color: 'blue', head: 'flat' },
      ]),
    ],
  },
  {
    id: 'L3',
    name: 'tut3',
    startBit: 'flat',
    switches: 3,
    boxQueue: ['green', 'red', 'yellow', 'blue'],
    plates: [
      bar('a', 0, [-3, -3], [3, -3], TINTS[0], [
        { t: 0, color: 'green', head: 'phillips' },
        { t: 1, color: 'yellow', head: 'phillips' },
      ]),
      bar('b', 0, [-3, 1], [-1, 1], TINTS[1], [
        { t: 0, color: 'red', head: 'flat' },
        { t: 1, color: 'green', head: 'flat' },
      ]),
      bar('c', 1, [-2, 3.5], [2, 3.5], TINTS[2], [
        { t: 0, color: 'yellow', head: 'phillips' },
        { t: 1, color: 'red', head: 'phillips' },
      ]),
      bar('d', 2, [-0.5, -4], [1.5, 2], TINTS[3], [
        { t: 0, color: 'red', head: 'phillips' },
        { t: 1, color: 'blue', head: 'phillips' },
      ]),
      bar('e', 2, [2.5, 3], [2.5, -1.5], TINTS[4], [
        { t: 0, color: 'blue', head: 'flat' },
        { t: 1, color: 'green', head: 'phillips' },
      ]),
      bar('f', 3, [-3.5, 0.4], [-0.3, 1.4], TINTS[5], [
        { t: 0, color: 'yellow', head: 'flat' },
        { t: 1, color: 'blue', head: 'flat' },
      ]),
    ],
  },
]

export const tutorialLevels = tutorial

/** Tutorial levels are hand-made; the rest come from `npm run gen:levels` (shippable over OTA). */
export const LEVELS: LevelDef[] = [...tutorial, ...(generatedLevels as LevelDef[])]
export const LEVEL_COUNT = LEVELS.length

export const getLevel = (index: number): LevelDef => LEVELS[((index % LEVEL_COUNT) + LEVEL_COUNT) % LEVEL_COUNT]
