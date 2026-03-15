/**
 * Wordle: full word list for validation. Re-exports daily puzzle helpers.
 * Valid guesses = winning words + common dictionary words.
 */
import { WORD_LEN as WL, WORDLE_WORDS as DAILY_WORDS, getWordForDate as getWordForDateDaily } from '~/utils/wordleDaily'

export const WORDLE_WORDS = DAILY_WORDS
export const WORD_LEN = WL
export const getWordForDate = getWordForDateDaily

/** Common 5-letter dictionary words – valid as guesses but never the answer. */
const COMMON_FIVE_LETTER_WORDS: string[] = [
  'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ADAPT', 'ADMIT', 'ADULT', 'AFTER', 'AGAIN', 'AGENT',
  'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIKE', 'ALIVE', 'ALLOW', 'ALONE', 'ALONG',
  'ALTER', 'AMONG', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY', 'ARENA', 'ARGUE',
  'ARISE', 'ARRAY', 'ASIDE', 'ASSET', 'AVOID', 'AWARD', 'AWARE', 'BADLY', 'BAKER', 'BANKS',
  'BASES', 'BASIC', 'BASIN', 'BASIS', 'BEACH', 'BEGAN', 'BEGIN', 'BEGUN', 'BEING', 'BELOW',
  'BENCH', 'BILLY', 'BIRTH', 'BLACK', 'BLADE', 'BLAME', 'BLANK', 'BLAST', 'BLEED', 'BLESS',
  'BLIND', 'BLOCK', 'BLOOD', 'BLOWN', 'BOARD', 'BOAST', 'BOOTH', 'BOUND', 'BRAIN', 'BRAND',
  'BRASS', 'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRICK', 'BRIDE', 'BRIEF', 'BRING', 'BROAD',
  'BROKE', 'BROWN', 'BUILD', 'BUILT', 'BUNCH', 'BURST', 'BUYER', 'CABLE', 'CALIF', 'CARRY',
  'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEST', 'CHIEF',
  'CHILD', 'CHINA', 'CHOSE', 'CIVIL', 'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLIMB', 'CLOCK',
  'CLOSE', 'CLOTH', 'CLOUD', 'COACH', 'COAST', 'COULD', 'COUNT', 'COURT', 'COVER', 'CRACK',
  'CRAFT', 'CRASH', 'CRAZY', 'CREAM', 'CRIME', 'CROSS', 'CROWD', 'CROWN', 'CURVE', 'CYCLE',
  'DAILY', 'DANCE', 'DATED', 'DEATH', 'DEBUT', 'DELAY', 'DELTA', 'DENSE', 'DEPTH', 'DOUBT',
  'DOZEN', 'DRAFT', 'DRAMA', 'DRANK', 'DRAWN', 'DREAM', 'DRIVE', 'DROVE', 'DRUGS', 'DRUNK',
  'DYING', 'EAGER', 'EARLY', 'EARTH', 'EIGHT', 'ELDER', 'ELECT', 'EMPTY', 'ENEMY', 'ENJOY',
  'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH',
  'FALSE', 'FANCY', 'FARMS', 'FAULT', 'FAVOR', 'FEARS', 'FEVER', 'FEWER', 'FIBER', 'FIELD',
  'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED', 'FLAME', 'FLASH', 'FLEET', 'FLOOR',
  'FLUID', 'FOCUS', 'FORCE', 'FORGE', 'FORTH', 'FORTY', 'FORUM', 'FOUND', 'FRAME', 'FRANK',
  'FRESH', 'FRONT', 'FRUIT', 'FULLY', 'GIVEN', 'GLASS', 'GLOBE', 'GLORY', 'GRAIN', 'GRAND',
  'GRANT', 'GRASS', 'GREAT', 'GREEN', 'GROSS', 'GROUP', 'GROWN', 'GUARD', 'GUESS', 'GUEST',
  'GUIDE', 'GUILT', 'HABIT', 'HAPPY', 'HARSH', 'HEART', 'HEAVY', 'HENCE', 'HORSE', 'HOTEL',
  'HOUSE', 'HUMAN', 'IDEAL', 'IMAGE', 'IMPLY', 'INDEX', 'INNER', 'INPUT', 'ISSUE', 'JAPAN',
  'JOINT', 'JONES', 'JUDGE', 'JUICE', 'KNOWN', 'LABEL', 'LARGE', 'LASER', 'LATER', 'LAUGH',
  'LAYER', 'LEARN', 'LEAST', 'LEAVE', 'LEGAL', 'LEMON', 'LEVEL', 'LIGHT', 'LIMIT', 'LOCAL',
  'LOGIC', 'LOOSE', 'LOVED', 'LOVER', 'LOWER', 'LOYAL', 'LUCKY', 'LUNCH', 'LYING', 'MAGIC',
  'MAJOR', 'MAKER', 'MARCH', 'MARRY', 'MATCH', 'MAYBE', 'MAYOR', 'MEANT', 'MEDIA', 'METAL',
  'METER', 'MIDST', 'MIGHT', 'MINOR', 'MINUS', 'MIXED', 'MODEL', 'MONEY', 'MONTH', 'MORAL',
  'MOTOR', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVIE', 'MUSIC', 'NAMED', 'NAVAL', 'NEEDS', 'NERVE',
  'NEVER', 'NEWLY', 'NIGHT', 'NOBLE', 'NOISE', 'NORTH', 'NOTED', 'NURSE', 'OCCUR', 'OCEAN',
  'OFFER', 'OFTEN', 'ORDER', 'OTHER', 'OUGHT', 'OUTER', 'OWNER', 'PAINT', 'PANEL', 'PAPER',
  'PARTY', 'PEACE', 'PENNY', 'PERCH', 'PHASE', 'PHONE', 'PHOTO', 'PIANO', 'PIECE', 'PILOT',
  'PITCH', 'PLACE', 'PLAIN', 'PLANE', 'PLANT', 'PLATE', 'PLAZA', 'POINT', 'POUND', 'POWER',
  'PRESS', 'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PRIZE', 'PROOF', 'PROUD', 'PROVE',
  'PUPIL', 'QUICK', 'QUIET', 'QUITE', 'QUOTE', 'RADIO', 'RAISE', 'RALLY', 'RANCH', 'RANGE',
  'RAPID', 'RATIO', 'REACH', 'READY', 'REFER', 'RIGHT', 'RIVAL', 'RIVER', 'ROBOT', 'ROMAN',
  'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL', 'SALAD', 'SCALE', 'SCENE', 'SCOPE', 'SENSE',
  'SERVE', 'SEVEN', 'SHALL', 'SHAPE', 'SHARE', 'SHARP', 'SHEET', 'SHELF', 'SHELL', 'SHIFT',
  'SHIRT', 'SHOCK', 'SHOOT', 'SHORT', 'SHOUT', 'SIGHT', 'SINCE', 'SIXTH', 'SIXTY', 'SIZED',
  'SKILL', 'SLEEP', 'SLICE', 'SLIDE', 'SMALL', 'SMART', 'SMILE', 'SMITH', 'SMOKE', 'SOLID',
  'SOLVE', 'SORRY', 'SOUND', 'SOUTH', 'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT',
  'SPLIT', 'SPOKE', 'SPORT', 'SPOTS', 'SPRAY', 'SQUAD', 'STACK', 'STAFF', 'STAGE', 'STAKE',
  'STAMP', 'STAND', 'STARS', 'START', 'STATE', 'STAYS', 'STEAM', 'STEEL', 'STICK', 'STILL',
  'STOCK', 'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STRIP', 'STUCK', 'STUDY', 'STUFF',
  'STYLE', 'SUGAR', 'SUITE', 'SUPER', 'SWEET', 'TABLE', 'TAKEN', 'TASTE', 'TAXES', 'TEACH',
  'TEETH', 'TERMS', 'THANK', 'THEFT', 'THEIR', 'THEME', 'THERE', 'THESE', 'THICK', 'THIEF',
  'THING', 'THINK', 'THIRD', 'THOSE', 'THREE', 'THREW', 'THROW', 'TIGER', 'TIGHT', 'TIMES',
  'TITLE', 'TODAY', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TRACK', 'TRADE', 'TRAIL', 'TRAIN',
  'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRIED', 'TRIES', 'TROOP', 'TRUCK', 'TRULY',
  'TRUNK', 'TRUST', 'TRUTH', 'TWICE', 'UNDER', 'UNION', 'UNITY', 'UNTIL', 'UPPER', 'URBAN',
  'USUAL', 'VALID', 'VALUE', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VIVID', 'VOCAL', 'VOICE',
  'WAGON', 'WAIST', 'WASTE', 'WATCH', 'WATER', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE',
  'WHOLE', 'WHOSE', 'WOMAN', 'WOMEN', 'WORDS', 'WORKS', 'WORLD', 'WORRY', 'WORSE', 'WORST',
  'WORTH', 'WOULD', 'WOUND', 'WRITE', 'WRONG', 'WROTE', 'YIELD', 'YOUNG', 'YOURS', 'ZONES',
]

const VALID_WORDS = DAILY_WORDS.filter((w) => w.length === WL).map((w) => w.toUpperCase().slice(0, WL))
const WORD_SET = new Set(VALID_WORDS)
export const WORDS = Array.from(WORD_SET)

const commonUpper = COMMON_FIVE_LETTER_WORDS.filter((w) => w.length === WL).map((w) => w.toUpperCase())
const ALLOWED_GUESS_SET = new Set([...Array.from(WORD_SET), ...commonUpper])

export function getRandomWord(): string {
  if (WORDS.length === 0) return 'BHAKT'
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

export function isValidWord(word: string): boolean {
  return word.length === WL && ALLOWED_GUESS_SET.has(word.toUpperCase())
}
