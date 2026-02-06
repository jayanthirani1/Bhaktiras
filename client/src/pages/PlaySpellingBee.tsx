import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Shuffle, Delete } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  type SpellingBeePuzzle,
  getPuzzleForDate,
  getMiddleLetter,
  getHiveLetters,
  isAnswer,
  isPangram,
  spellingBeePoints,
  getMaxScore,
} from "@/data/spellingBeePuzzles";

function useSpellingBeeGame() {
  const { toast } = useToast();
  const [puzzle, setPuzzle] = useState<SpellingBeePuzzle>(() => getPuzzleForDate(new Date()));
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [currentGuess, setCurrentGuess] = useState("");
  const [shuffleKey, setShuffleKey] = useState(0);

  const middleLetter = getMiddleLetter(puzzle);
  const outerLetters = getHiveLetters(puzzle).filter((l) => l !== middleLetter);

  const score = [...foundWords].reduce((sum, w) => sum + spellingBeePoints(w, puzzle), 0);
  const maxScore = getMaxScore(puzzle);
  const totalWords = puzzle.answers.length;

  const submitGuess = useCallback(() => {
    const trimmed = currentGuess.toUpperCase().trim();
    if (trimmed.length < 4) {
      toast({ description: "Too short. Use at least 4 letters.", variant: "destructive" });
      return;
    }
    if (!trimmed.includes(middleLetter)) {
      toast({ description: "Missing center letter.", variant: "destructive" });
      return;
    }
    if (!isAnswer(trimmed, puzzle)) {
      toast({ description: "Not in word list.", variant: "destructive" });
      return;
    }
    if (foundWords.has(trimmed)) {
      toast({ description: "Already found.", variant: "destructive" });
      return;
    }
    setFoundWords((prev) => new Set([...prev, trimmed]));
    const pts = spellingBeePoints(trimmed, puzzle);
    if (isPangram(trimmed, puzzle)) {
      toast({ description: `Pangram! +${pts}`, variant: "default" });
    } else {
      toast({ description: `+${pts}`, variant: "default" });
    }
    setCurrentGuess("");
  }, [currentGuess, middleLetter, puzzle, foundWords, toast]);

  const addLetter = useCallback((letter: string) => {
    setCurrentGuess((g) => g + letter.toUpperCase());
  }, []);

  const removeLetter = useCallback(() => {
    setCurrentGuess((g) => g.slice(0, -1));
  }, []);

  const shuffle = useCallback(() => {
    setShuffleKey((k) => k + 1);
  }, []);

  const reset = useCallback(() => {
    setPuzzle(getPuzzleForDate(new Date()));
    setFoundWords(new Set());
    setCurrentGuess("");
    setShuffleKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitGuess();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        removeLetter();
      } else {
        const key = e.key.toUpperCase();
        if (key.length === 1 && puzzle.availableLetters.toUpperCase().includes(key)) {
          e.preventDefault();
          addLetter(key);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [submitGuess, removeLetter, addLetter, puzzle.availableLetters]);

  return {
    puzzle,
    middleLetter,
    outerLetters,
    foundWords,
    currentGuess,
    score,
    maxScore,
    totalWords,
    shuffleKey,
    submitGuess,
    addLetter,
    removeLetter,
    shuffle,
    reset,
  };
}

export default function PlaySpellingBee() {
  const {
    puzzle,
    middleLetter,
    outerLetters,
    foundWords,
    currentGuess,
    score,
    maxScore,
    totalWords,
    shuffleKey,
    submitGuess,
    addLetter,
    removeLetter,
    shuffle,
    reset,
  } = useSpellingBeeGame();

  const foundList = [...foundWords].sort((a, b) => a.length - b.length || a.localeCompare(b));

  return (
    <div className="min-h-screen bg-stone-50 pb-32 pt-8 md:pt-12 px-4">
      <Toaster />
      <div className="max-w-lg mx-auto">
        <Link
          href="/play"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to games
        </Link>

        <PageHeader
          title="Spelling Bee"
          subtitle="Make words using the letters. Every word must use the center letter."
        />

        {/* Score */}
        <div className="flex justify-center gap-6 mb-6 text-sm">
          <span className="font-semibold text-foreground">{score} pts</span>
          <span className="text-muted-foreground">
            {foundList.length} / {totalWords} words
          </span>
        </div>

        {/* Hive */}
        <div className="flex justify-center mb-8">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            {/* Center letter */}
            <button
              type="button"
              onClick={() => addLetter(middleLetter)}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full bg-primary text-primary-foreground font-bold text-2xl shadow-lg border-2 border-golden-600/50 hover:scale-105 active:scale-95 transition-transform z-10"
            >
              {middleLetter}
            </button>
            {/* Outer 6 letters in hex */}
            {[
              { angle: 0, i: 0 },
              { angle: 60, i: 1 },
              { angle: 120, i: 2 },
              { angle: 180, i: 3 },
              { angle: 240, i: 4 },
              { angle: 300, i: 5 },
            ].map(({ angle, i }) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + 38 * Math.sin(rad);
              const cy = 50 + 38 * Math.cos(rad);
              const letter = outerLetters[(i + shuffleKey) % outerLetters.length];
              return (
                <button
                  key={`${letter}-${i}-${shuffleKey}`}
                  type="button"
                  onClick={() => addLetter(letter)}
                  className="absolute w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-stone-200 text-foreground font-bold text-lg border-2 border-stone-300 hover:bg-stone-300 active:scale-95 transition-all"
                  style={{
                    left: `calc(${cx}% - 1.75rem)`,
                    top: `calc(${cy}% - 1.75rem)`,
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Shuffle */}
        <div className="flex justify-center mb-4">
          <button
            type="button"
            onClick={shuffle}
            className="p-2 rounded-full bg-stone-200 hover:bg-stone-300 text-foreground"
            aria-label="Shuffle letters"
          >
            <Shuffle className="w-5 h-5" />
          </button>
        </div>

        {/* Current word & actions */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="min-h-[2.5rem] px-4 py-2 rounded-xl bg-white border-2 border-stone-200 font-semibold text-lg tracking-wider flex items-center min-w-[8rem] justify-center">
            {currentGuess || "—"}
          </div>
          <button
            type="button"
            onClick={removeLetter}
            className="p-2 rounded-lg bg-stone-200 hover:bg-stone-300 text-foreground"
            aria-label="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={submitGuess}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90"
          >
            Enter
          </button>
        </div>

        {/* Found words */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Found words</h3>
          {foundList.length === 0 ? (
            <p className="text-muted-foreground text-sm">No words yet. Tap letters to spell.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {foundList.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-medium text-sm"
                >
                  {isPangram(word, puzzle) && (
                    <span className="text-amber-600 font-bold" title="Pangram">
                      ★
                    </span>
                  )}
                  {word}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${maxScore ? (score / maxScore) * 100 : 0}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {score} / {maxScore} points
          </p>
        </div>

        {/* Reset */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-200 text-foreground font-semibold hover:bg-stone-300"
          >
            <RotateCcw className="w-4 h-4" />
            New puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
