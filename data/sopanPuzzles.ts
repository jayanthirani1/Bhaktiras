import type { SopanPuzzle } from '~/types'

type Seed = [title: string, top: string, middle: Array<[word: string, clue: string]>, bottom: string, endsClue: string]

/**
 * Starter ladders. The words are everyday English so a seven-step ladder can
 * exist at all; the satsang lives in the clues. Any clue that states something
 * about the shastras must hold for the Bhuj texts (see data/SATSANG_WORD_BANK.md).
 */
const SEEDS: Seed[] = [
  ['Aarti', 'LAMP', [
    ['LAME', 'Unable to walk without a limp'],
    ['TAME', 'Gentle and calm; not wild'],
    ['TALE', 'A story, like one told at katha'],
    ['TALL', 'Like a mandir shikhar, rising high'],
    ['TELL', 'Recount or narrate']
  ], 'BELL', 'At aarti, one is lit and the other is rung'],
  ['Kheer', 'MILK', [
    ['MILE', 'About 1.6 kilometres'],
    ['MINE', '“I” and “___” — the ego and attachment a devotee lets go of'],
    ['FINE', 'Perfectly all right'],
    ['NINE', 'The number of forms of navdha bhakti'],
    ['NICE', 'Pleasant and kind']
  ], 'RICE', 'Simmered together with sugar to make kheer'],
  ['Daily reading', 'READ', [
    ['HEAD', 'Bowed before the murti'],
    ['HEAT', 'Summer warmth'],
    ['BEAT', 'The dhol keeps it during kirtan'],
    ['BOAT', 'It carries you across a river'],
    ['BOOT', 'Footwear left outside the mandir']
  ], 'BOOK', 'You ___ the Shikshapatri every day; the Vachnamrut is a holy ___'],
  ['Within', 'MIND', [
    ['FIND', 'Discover'],
    ['FOND', 'Having affection (for)'],
    ['FOOD', 'Offered to Bhagvan as thal before it is eaten'],
    ['FOOL', 'A silly person'],
    ['FOUL', 'A rule break in a match']
  ], 'SOUL', 'The restless one must be controlled; the other is the eternal atma'],
  ['Growth', 'SEED', [
    ['NEED', 'Require'],
    ['FEED', 'What you do for the cows at a gaushala'],
    ['FLED', 'Ran away'],
    ['FLEE', 'Run from danger'],
    ['FREE', 'Liberated — or costing nothing']
  ], 'TREE', 'A tiny ___ can grow into a great ___, like a little daily seva'],
  ['The flame', 'WAVE', [
    ['HAVE', 'Possess'],
    ['GAVE', 'Donated'],
    ['GIVE', 'Offer, as with daan'],
    ['FIVE', 'The number of ingredients in panchamrut'],
    ['FINE', 'Thin and delicate, like silk thread']
  ], 'FIRE', 'At aarti, you ___ the lamp with its sacred ___'],
  ['Night sky', 'MOON', [
    ['MOOR', 'Tie up a boat'],
    ['POOR', 'In need of daan'],
    ['POUR', 'Do this with water during abhishek'],
    ['SOUR', 'Like an unripe mango'],
    ['SOAR', 'Fly high, like a kite at Uttarayan']
  ], 'STAR', 'Chandra is the ___; a tara is a ___'],
  ['Rishi', 'SAGE', [
    ['SAME', 'Identical'],
    ['SOME', 'A few'],
    ['COME', 'Arrive — “___ for darshan!”'],
    ['HOME', 'Where a ghar mandir is kept'],
    ['HOLE', 'A gap or opening']
  ], 'HOLY', 'A rishi is a wise ___; a tirth is a ___ place'],
  ['Strung', 'ROSE', [
    ['NOSE', 'It catches the scent of agarbatti'],
    ['NONE', 'Not a single one'],
    ['BONE', 'Part of a skeleton'],
    ['BOND', 'A close tie between people'],
    ['BEND', 'Bow or flex']
  ], 'BEAD', 'Strung on a thread: a ___ for a garland, a ___ for a mala'],
  ['Pranam', 'FEET', [
    ['MEET', 'Gather, as for a Sunday sabha'],
    ['MEAT', 'The Shikshapatri forbids eating it'],
    ['BEAT', 'Defeat; win against'],
    ['BEAR', 'Endure; put up with'],
    ['HEAR', 'What you do attentively at katha']
  ], 'HEAD', 'Bow your ___ at Bhagvan’s lotus ___'],
  ['Joined palms', 'HAND', [
    ['HARD', 'Difficult'],
    ['WARD', 'A room in a hospital'],
    ['WORD', 'Vachan, as in Vachnamrut'],
    ['WOOD', 'Timber'],
    ['FOOD', 'Prasad is blessed ___']
  ], 'FOLD', 'In pranam, palm meets palm: one ___ to the other as you ___ them together'],
  ['Snan', 'BATH', [
    ['BASH', 'A big party'],
    ['CASH', 'Notes and coins'],
    ['CASE', 'A container, or a matter for a court'],
    ['CARE', 'Look after'],
    ['CURE', 'A remedy for an illness']
  ], 'PURE', 'A morning ___ before puja leaves you clean and ___'],
  ['Early rising', 'WAKE', [
    ['MAKE', 'Create'],
    ['MATE', 'Friend — or checkmate'],
    ['DATE', 'A sweet fruit, or a day on the calendar'],
    ['DARE', 'Challenge someone'],
    ['DARN', 'Mend a hole in a sock']
  ], 'DAWN', 'The Shikshapatri asks devotees to ___ before ___'],
  ['Bhakti', 'LORD', [
    ['WORD', 'A unit of speech'],
    ['WORE', 'Had on, as clothes'],
    ['CORE', 'The centre of an apple'],
    ['MORE', 'Extra; additional'],
    ['MOVE', 'Shift position']
  ], 'LOVE', 'Bhakti is ___ for the ___'],
  ['Monsoon', 'RAIN', [
    ['RAIL', 'A train runs on it'],
    ['TAIL', 'A cow swishes it'],
    ['TALL', 'High; lofty'],
    ['TOLL', 'A charge to use a road or bridge'],
    ['TOOL', 'A hammer or a spanner']
  ], 'COOL', 'Monsoon ___ leaves the air ___'],
  ['Seva', 'GOOD', [
    ['MOOD', 'A state of mind'],
    ['FOOD', 'Something to eat'],
    ['FOND', 'Loving; affectionate'],
    ['FEND', '“___ for yourself” — look after yourself'],
    ['FEED', 'Give a meal to']
  ], 'DEED', 'Every act of seva is a ___ ___'],
  ['Dhyan', 'CALM', [
    ['CALL', 'Phone someone'],
    ['WALL', 'Side of a room'],
    ['WILL', 'Determination — or a legal document'],
    ['WILD', 'Untamed'],
    ['WIND', 'A strong breeze']
  ], 'MIND', 'Dhyan brings a ___ ___'],
  ['Kirtan', 'SING', [
    ['SONG', 'A bhajan is a devotional one'],
    ['LONG', 'Not short'],
    ['LONE', 'Solitary'],
    ['GONE', 'Departed'],
    ['TONE', 'A musical sound or pitch']
  ], 'TUNE', 'In kirtan, you ___ along in ___ with the harmonium'],
  ['The climb', 'HILL', [
    ['HELL', 'Narak, in English'],
    ['HEAL', 'Make well again'],
    ['HEAR', 'Listen'],
    ['WEAR', 'Put on, as satsangis do a tulsi kanthi'],
    ['WEAK', 'Lacking strength']
  ], 'PEAK', 'Climb the ___ to reach its ___'],
  ['Shringar', 'GOLD', [
    ['BOLD', 'Brave; daring'],
    ['BOND', 'A strong tie'],
    ['BAND', 'A group of musicians'],
    ['BANG', 'A sudden loud noise'],
    ['RANG', 'Sounded, like the aarti bell']
  ], 'RING', 'A precious metal, and the band often made from it']
]

export const DEFAULT_SOPAN_PUZZLES: SopanPuzzle[] = SEEDS.map(([title, top, middle, bottom, endsClue]) => ({
  id: `sopan-${top.toLowerCase()}-${bottom.toLowerCase()}`,
  title,
  dateId: null,
  top,
  bottom,
  endsClue,
  rungs: middle.map(([word, clue]) => ({ word, clue })),
  published: true
}))
