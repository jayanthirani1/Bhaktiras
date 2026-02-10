/**
 * Wordle: 5-letter words only. Uppercase for consistent comparison.
 *
 * - SOLUTION_WORDS: only these can be the winning (target) word.
 * - ALLOWED_GUESSES: solution words + common dictionary words; any guess must be in this set.
 */

/** Winning words – the answer is always chosen from this list. */
export const SOLUTION_WORDS: string[] = [
  "AARTI", "AMRUT", "ATMAA", "BHAKT", "BHUMI", "BRAHM", "DHOTI", "DHVAJ", "DHYAN", "DIVYA",
  "GOPIS", "KARMA", "KATHA", "KUTCH", "LEELA", "MOKSH", "MUKTA", "MUKTI", "MUNIS", "MURTI",
  "NITYA", "PADMA", "POOJA", "RAJAS", "SABHA", "SADHU", "SANTS", "SATYA", "SHIVA", "SHLOK",
  "SURYA", "SWAMI", "TAMAS", "THAAL", "TILAK", "TIRTH", "TYAGI", "VARNA", "VIDYA", "VIVEK",
  "YOGIS",
];

/** Common 5-letter dictionary words – valid as guesses but never the answer. */
const COMMON_FIVE_LETTER_WORDS: string[] = [
  "ABOUT", "ABOVE", "ABUSE", "ACTOR", "ADAPT", "ADMIT", "ADULT", "AFTER", "AGAIN", "AGENT",
  "AGREE", "AHEAD", "ALARM", "ALBUM", "ALERT", "ALIKE", "ALIVE", "ALLOW", "ALONE", "ALONG",
  "ALTER", "AMONG", "ANGER", "ANGLE", "ANGRY", "APART", "APPLE", "APPLY", "ARENA", "ARGUE",
  "ARISE", "ARRAY", "ASIDE", "ASSET", "AVOID", "AWARD", "AWARE", "BADLY", "BAKER", "BANKS",
  "BASES", "BASIC", "BASIN", "BASIS", "BEACH", "BEGAN", "BEGIN", "BEGUN", "BEING", "BELOW",
  "BENCH", "BILLY", "BIRTH", "BLACK", "BLADE", "BLAME", "BLANK", "BLAST", "BLEED", "BLESS",
  "BLIND", "BLOCK", "BLOOD", "BLOWN", "BOARD", "BOAST", "BOOTH", "BOUND", "BRAIN", "BRAND",
  "BRASS", "BRAVE", "BREAD", "BREAK", "BREED", "BRICK", "BRIDE", "BRIEF", "BRING", "BROAD",
  "BROKE", "BROWN", "BUILD", "BUILT", "BUNCH", "BURST", "BUYER", "CABLE", "CALIF", "CARRY",
  "CATCH", "CAUSE", "CHAIN", "CHAIR", "CHART", "CHASE", "CHEAP", "CHECK", "CHEST", "CHIEF",
  "CHILD", "CHINA", "CHOSE", "CIVIL", "CLAIM", "CLASS", "CLEAN", "CLEAR", "CLIMB", "CLOCK",
  "CLOSE", "CLOTH", "CLOUD", "COACH", "COAST", "COULD", "COUNT", "COURT", "COVER", "CRACK",
  "CRAFT", "CRASH", "CRAZY", "CREAM", "CRIME", "CROSS", "CROWD", "CROWN", "CURVE", "CYCLE",
  "DAILY", "DANCE", "DATED", "DEATH", "DEBUT", "DELAY", "DELTA", "DENSE", "DEPTH", "DOUBT",
  "DOZEN", "DRAFT", "DRAMA", "DRANK", "DRAWN", "DREAM", "DRIVE", "DROVE", "DRUGS", "DRUNK",
  "DYING", "EAGER", "EARLY", "EARTH", "EIGHT", "ELDER", "ELECT", "EMPTY", "ENEMY", "ENJOY",
  "ENTER", "ENTRY", "EQUAL", "ERROR", "EVENT", "EVERY", "EXACT", "EXIST", "EXTRA", "FAITH",
  "FALSE", "FANCY", "FARMS", "FAULT", "FAVOR", "FEARS", "FEVER", "FEWER", "FIBER", "FIELD",
  "FIFTH", "FIFTY", "FIGHT", "FINAL", "FIRST", "FIXED", "FLAME", "FLASH", "FLEET", "FLOOR",
  "FLUID", "FOCUS", "FORCE", "FORGE", "FORTH", "FORTY", "FORUM", "FOUND", "FRAME", "FRANK",
  "FRESH", "FRONT", "FRUIT", "FULLY", "GIVEN", "GLASS", "GLOBE", "GLORY", "GRAIN", "GRAND",
  "GRANT", "GRASS", "GREAT", "GREEN", "GROSS", "GROUP", "GROWN", "GUARD", "GUESS", "GUEST",
  "GUIDE", "GUILT", "HABIT", "HAPPY", "HARSH", "HEART", "HEAVY", "HENCE", "HORSE", "HOTEL",
  "HOUSE", "HUMAN", "IDEAL", "IMAGE", "IMPLY", "INDEX", "INNER", "INPUT", "ISSUE", "JAPAN",
  "JOINT", "JONES", "JUDGE", "JUICE", "KNOWN", "LABEL", "LARGE", "LASER", "LATER", "LAUGH",
  "LAYER", "LEARN", "LEAST", "LEAVE", "LEGAL", "LEMON", "LEVEL", "LIGHT", "LIMIT", "LOCAL",
  "LOGIC", "LOOSE", "LOVED", "LOVER", "LOWER", "LOYAL", "LUCKY", "LUNCH", "LYING", "MAGIC",
  "MAJOR", "MAKER", "MARCH", "MARRY", "MATCH", "MAYBE", "MAYOR", "MEANT", "MEDIA", "METAL",
  "METER", "MIDST", "MIGHT", "MINOR", "MINUS", "MIXED", "MODEL", "MONEY", "MONTH", "MORAL",
  "MOTOR", "MOUNT", "MOUSE", "MOUTH", "MOVIE", "MUSIC", "NAMED", "NAVAL", "NEEDS", "NERVE",
  "NEVER", "NEWLY", "NIGHT", "NOBLE", "NOISE", "NORTH", "NOTED", "NURSE", "OCCUR", "OCEAN",
  "OFFER", "OFTEN", "ORDER", "OTHER", "OUGHT", "OUTER", "OWNER", "PAINT", "PANEL", "PAPER",
  "PARTY", "PEACE", "PENNY", "PERCH", "PHASE", "PHONE", "PHOTO", "PIANO", "PIECE", "PILOT",
  "PITCH", "PLACE", "PLAIN", "PLANE", "PLANT", "PLATE", "PLAZA", "POINT", "POUND", "POWER",
  "PRESS", "PRICE", "PRIDE", "PRIME", "PRINT", "PRIOR", "PRIZE", "PROOF", "PROUD", "PROVE",
  "PUPIL", "QUICK", "QUIET", "QUITE", "QUOTE", "RADIO", "RAISE", "RALLY", "RANCH", "RANGE",
  "RAPID", "RATIO", "REACH", "READY", "REFER", "RIGHT", "RIVAL", "RIVER", "ROBOT", "ROMAN",
  "ROUGH", "ROUND", "ROUTE", "ROYAL", "RURAL", "SALAD", "SCALE", "SCENE", "SCOPE", "SENSE",
  "SERVE", "SEVEN", "SHALL", "SHAPE", "SHARE", "SHARP", "SHEET", "SHELF", "SHELL", "SHIFT",
  "SHIRT", "SHOCK", "SHOOT", "SHORT", "SHOUT", "SIGHT", "SINCE", "SIXTH", "SIXTY", "SIZED",
  "SKILL", "SLEEP", "SLICE", "SLIDE", "SMALL", "SMART", "SMILE", "SMITH", "SMOKE", "SOLID",
  "SOLVE", "SORRY", "SOUND", "SOUTH", "SPACE", "SPARE", "SPEAK", "SPEED", "SPEND", "SPENT",
  "SPLIT", "SPOKE", "SPORT", "SPOTS", "SPRAY", "SQUAD", "STACK", "STAFF", "STAGE", "STAKE",
  "STAMP", "STAND", "STARS", "START", "STATE", "STAYS", "STEAM", "STEEL", "STICK", "STILL",
  "STOCK", "STONE", "STOOD", "STORE", "STORM", "STORY", "STRIP", "STUCK", "STUDY", "STUFF",
  "STYLE", "SUGAR", "SUITE", "SUPER", "SWEET", "TABLE", "TAKEN", "TASTE", "TAXES", "TEACH",
  "TEETH", "TERMS", "THANK", "THEFT", "THEIR", "THEME", "THERE", "THESE", "THICK", "THIEF",
  "THING", "THINK", "THIRD", "THOSE", "THREE", "THREW", "THROW", "TIGER", "TIGHT", "TIMES",
  "TITLE", "TODAY", "TOTAL", "TOUCH", "TOUGH", "TOWER", "TRACK", "TRADE", "TRAIL", "TRAIN",
  "TREAT", "TREND", "TRIAL", "TRIBE", "TRICK", "TRIED", "TRIES", "TROOP", "TRUCK", "TRULY",
  "TRUNK", "TRUST", "TRUTH", "TWICE", "UNDER", "UNION", "UNITY", "UNTIL", "UPPER", "URBAN",
  "USUAL", "VALID", "VALUE", "VIDEO", "VIRUS", "VISIT", "VITAL", "VIVID", "VOCAL", "VOICE",
  "WAGON", "WAIST", "WASTE", "WATCH", "WATER", "WHEEL", "WHERE", "WHICH", "WHILE", "WHITE",
  "WHOLE", "WHOSE", "WOMAN", "WOMEN", "WORDS", "WORKS", "WORLD", "WORRY", "WORSE", "WORST",
  "WORTH", "WOULD", "WOUND", "WRITE", "WRONG", "WROTE", "YIELD", "YOUNG", "YOURS", "ZONES",
];

const WORD_LENGTH = 5;

// Winning words only (for getRandomWord)
const SOLUTION_SET = new Set(
  SOLUTION_WORDS.filter((w) => w.length === WORD_LENGTH).map((w) => w.toUpperCase())
);
export const WORDS = Array.from(SOLUTION_SET);

// All valid guesses = solution words + common dictionary (for isValidWord)
const commonUpper = COMMON_FIVE_LETTER_WORDS.filter((w) => w.length === WORD_LENGTH).map((w) => w.toUpperCase());
const ALLOWED_GUESS_SET = new Set([...Array.from(SOLUTION_SET), ...commonUpper]);

/** @deprecated Use SOLUTION_WORDS */
export const WORDLE_WORDS = SOLUTION_WORDS;

if (WORDS.length === 0) {
  console.warn("wordleWords: No 5-letter solution words. Add words of length", WORD_LENGTH);
}

export const WORD_LEN = WORD_LENGTH;

/** Picks a random winning word (always from the devotional list). */
export function getRandomWord(): string {
  if (WORDS.length === 0) return "BHAKT";
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

/** True if the guess is allowed (solution words + common dictionary words). */
export function isValidWord(word: string): boolean {
  return word.length === WORD_LEN && ALLOWED_GUESS_SET.has(word.toUpperCase());
}
