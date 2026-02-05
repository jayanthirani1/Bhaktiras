import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import {
  getRandomWord,
  isValidWord,
  WORD_LEN,
} from "@/data/wordleWords";

export type LetterStatus = "correct" | "present" | "absent" | "empty";

/**
 * Wordle feedback: green = correct position, yellow = in word wrong position, gray = not in word.
 * Handles duplicate letters correctly (only as many yellow/green as in solution).
 */
function getFeedback(guess: string, solution: string): LetterStatus[] {
  const result: LetterStatus[] = Array(WORD_LEN).fill("absent");
  const sol = solution.toUpperCase();
  const g = guess.toUpperCase().padEnd(WORD_LEN).slice(0, WORD_LEN);
  const remaining: Record<string, number> = {};
  for (let i = 0; i < WORD_LEN; i++) {
    const c = sol[i];
    remaining[c] = (remaining[c] ?? 0) + 1;
  }
  // First pass: correct (green)
  for (let i = 0; i < WORD_LEN; i++) {
    if (g[i] === sol[i]) {
      result[i] = "correct";
      remaining[g[i]]--;
    }
  }
  // Second pass: present (yellow)
  for (let i = 0; i < WORD_LEN; i++) {
    if (result[i] === "correct") continue;
    const c = g[i];
    if (c && remaining[c] > 0) {
      result[i] = "present";
      remaining[c]--;
    }
  }
  return result;
}

const ROWS = 6;
const KEYBOARD_TOP = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const KEYBOARD_MID = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
const KEYBOARD_BOT = ["Z", "X", "C", "V", "B", "N", "M"];

function useWordleGame() {
  const [solution, setSolution] = useState<string>(() => getRandomWord());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isWin = guesses.length > 0 && guesses[guesses.length - 1] === solution;
  const isLose = !isWin && guesses.length >= ROWS;

  const reset = useCallback(() => {
    setSolution(getRandomWord());
    setGuesses([]);
    setCurrentGuess("");
    setIsComplete(false);
    setMessage(null);
  }, []);

  const submitGuess = useCallback(() => {
    const trimmed = currentGuess.toUpperCase().trim();
    if (trimmed.length !== WORD_LEN) {
      setMessage("Enter 5 letters");
      return;
    }
    if (!isValidWord(trimmed)) {
      setMessage("Not in word list");
      return;
    }
    setMessage(null);
    setGuesses((g) => [...g, trimmed]);
    setCurrentGuess("");
    if (trimmed === solution) setIsComplete(true);
    else if (guesses.length + 1 >= ROWS) setIsComplete(true);
  }, [currentGuess, solution, guesses.length]);

  const addLetter = useCallback(
    (letter: string) => {
      if (isComplete) return;
      if (currentGuess.length < WORD_LEN) {
        setCurrentGuess((c) => c + letter.toUpperCase());
        setMessage(null);
      }
    },
    [currentGuess.length, isComplete]
  );

  const removeLetter = useCallback(() => {
    if (isComplete) return;
    setCurrentGuess((c) => c.slice(0, -1));
    setMessage(null);
  }, [isComplete]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isComplete) return;
      if (e.key === "Enter") {
        e.preventDefault();
        submitGuess();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        removeLetter();
      } else if (/^[A-Za-z]$/.test(e.key)) {
        e.preventDefault();
        addLetter(e.key);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isComplete, submitGuess, removeLetter, addLetter]);

  return {
    solution,
    guesses,
    currentGuess,
    isComplete,
    isWin,
    isLose,
    message,
    reset,
    submitGuess,
    addLetter,
    removeLetter,
  };
}

function Cell({
  letter,
  status,
  index,
}: {
  letter: string;
  status: LetterStatus;
  index: number;
}) {
  const bg =
    status === "correct"
      ? "bg-emerald-500 border-emerald-600 text-white"
      : status === "present"
        ? "bg-golden-400 border-golden-500 text-white"
        : status === "absent"
          ? "bg-stone-300 border-stone-400 text-stone-600"
          : "bg-white border-stone-200 text-foreground";
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-lg font-bold text-lg sm:text-xl uppercase ${bg}`}
    >
      {letter}
    </motion.div>
  );
}

function KeyboardKey({
  letter,
  status,
  onClick,
  wide,
}: {
  letter: string;
  status?: LetterStatus;
  onClick: () => void;
  wide?: boolean;
}) {
  const bg =
    status === "correct"
      ? "bg-emerald-500 text-white"
      : status === "present"
        ? "bg-golden-400 text-white"
        : status === "absent"
          ? "bg-stone-300 text-stone-600"
          : "bg-stone-200 text-foreground hover:bg-stone-300";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 sm:h-12 rounded-md font-semibold text-sm uppercase transition-colors ${wide ? "px-6" : "min-w-[1.75rem] px-2 sm:min-w-[2rem]"} ${bg}`}
    >
      {letter}
    </button>
  );
}

export default function PlayWordle() {
  const {
    solution,
    guesses,
    currentGuess,
    isComplete,
    isWin,
    isLose,
    message,
    reset,
    submitGuess,
    addLetter,
    removeLetter,
  } = useWordleGame();

  const keyStatus = new Map<string, LetterStatus>();
  guesses.forEach((g) => {
    const feedback = getFeedback(g, solution);
    for (let i = 0; i < g.length; i++) {
      const c = g[i];
      const s = feedback[i];
      if (s === "correct") keyStatus.set(c, "correct");
      else if (s === "present" && keyStatus.get(c) !== "correct")
        keyStatus.set(c, "present");
      else if (s === "absent" && !keyStatus.has(c)) keyStatus.set(c, "absent");
    }
  });

  return (
    <div className="min-h-screen bg-stone-50 pb-32 pt-8 md:pt-12 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href="/play"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to games
        </Link>

        <PageHeader
          title="Wordle"
          subtitle="Guess the devotional word in six tries."
        />

        {/* Grid */}
        <div className="flex flex-col gap-2 mb-8">
          {Array.from({ length: ROWS }, (_, row) => {
            const guess = guesses[row];
            const isCurrent = !guess && row === guesses.length;
            const word = isCurrent ? currentGuess : guess ?? "";
            const feedback = guess ? getFeedback(guess, solution) : [];
            return (
              <div
                key={row}
                className="grid grid-cols-5 gap-1.5 sm:gap-2 justify-center"
              >
                {Array.from({ length: WORD_LEN }, (_, i) => (
                  <Cell
                    key={i}
                    letter={word[i] ?? ""}
                    status={
                      isCurrent
                        ? "empty"
                        : (feedback[i] ?? "empty")
                    }
                    index={row * WORD_LEN + i}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {message && (
          <p className="text-center text-golden-700 font-medium mb-4">{message}</p>
        )}

        {/* Virtual keyboard */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-center gap-1">
            {KEYBOARD_TOP.map((k) => (
              <KeyboardKey
                key={k}
                letter={k}
                status={keyStatus.get(k)}
                onClick={() => addLetter(k)}
              />
            ))}
          </div>
          <div className="flex justify-center gap-1">
            {KEYBOARD_MID.map((k) => (
              <KeyboardKey
                key={k}
                letter={k}
                status={keyStatus.get(k)}
                onClick={() => addLetter(k)}
              />
            ))}
          </div>
          <div className="flex justify-center gap-1">
            <button
              type="button"
              onClick={submitGuess}
              className="h-11 sm:h-12 px-4 rounded-md font-semibold text-sm bg-primary text-white hover:opacity-90"
            >
              Enter
            </button>
            {KEYBOARD_BOT.map((k) => (
              <KeyboardKey
                key={k}
                letter={k}
                status={keyStatus.get(k)}
                onClick={() => addLetter(k)}
              />
            ))}
            <button
              type="button"
              onClick={removeLetter}
              className="h-11 sm:h-12 px-4 rounded-md font-semibold text-sm bg-stone-300 text-foreground hover:bg-stone-400"
            >
              ⌫
            </button>
          </div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
              onClick={() => {}}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 shadow-xl border border-golden-200 max-w-sm w-full text-center"
              >
                {isWin ? (
                  <>
                    <div className="text-4xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Well done!
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      You got it in {guesses.length} {guesses.length === 1 ? "try" : "tries"}.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-4">🙏</div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Next time
                    </h2>
                    <p className="text-muted-foreground mb-2">The word was</p>
                    <p className="font-bold text-lg text-primary mb-6">{solution}</p>
                  </>
                )}
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Play again
                  </button>
                  <Link
                    href="/play"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-200 text-foreground font-semibold hover:bg-stone-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Games
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
