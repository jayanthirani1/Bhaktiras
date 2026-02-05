import { useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RefreshCcw, ArrowLeft } from "lucide-react";

// Hardcoded quiz data
const questions = [
  {
    id: 1,
    question: "Which year was the temple inaugurated?",
    options: ["2013", "2014", "2015", "2016"],
    correctAnswer: "2014"
  },
  {
    id: 2,
    question: "What is the primary material used in the main shrine?",
    options: ["White Marble", "Sandstone", "Granite", "Limestone"],
    correctAnswer: "White Marble"
  },
  {
    id: 3,
    question: "How many major festivals are celebrated annually?",
    options: ["5", "8", "12", "15"],
    correctAnswer: "12"
  }
];

export default function PlayQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return; // Prevent changing answer
    
    setSelectedOption(option);
    const correct = option === questions[currentQuestion].correctAnswer;
    setIsCorrect(correct);
    
    if (correct) setScore(score + 1);

    // Auto advance
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        setIsFinished(true);
      }
    }, 1500);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/play"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to games
        </Link>

        <PageHeader 
          title="Devotional Quiz" 
          subtitle="Test your knowledge about our temple's history and traditions." 
        />

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {isFinished ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl p-12 shadow-xl border border-primary/20 text-center"
              >
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                  🏆
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Quiz Completed!</h2>
                <p className="text-muted-foreground mb-8">You scored {score} out of {questions.length}</p>
                <button
                  onClick={restartQuiz}
                  className="inline-flex items-center px-6 py-3 rounded-xl bg-foreground text-white font-semibold hover:bg-foreground/90 transition-colors"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Play Again
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-golden-200"
              >
                <div className="flex justify-between items-center mb-8">
                  <span className="text-sm font-bold text-primary tracking-wider uppercase">
                    Question {currentQuestion + 1}/{questions.length}
                  </span>
                  <span className="text-sm font-medium text-golden-600">
                    Score: {score}
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-8 leading-relaxed">
                  {questions[currentQuestion].question}
                </h3>

                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option) => {
                    const isSelected = selectedOption === option;
                    const isCorrectAnswer = option === questions[currentQuestion].correctAnswer;
                    
                    let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium ";
                    
                    if (selectedOption) {
                      if (isSelected) {
                        btnClass += isCorrect 
                          ? "bg-green-50 border-green-500 text-green-700" 
                          : "bg-red-50 border-red-500 text-red-700";
                      } else if (isCorrectAnswer) {
                        btnClass += "bg-green-50 border-green-500 text-green-700";
                      } else {
                        btnClass += "border-gray-100 text-gray-400 opacity-50";
                      }
                    } else {
                      btnClass += "bg-white border-golden-200 hover:border-primary hover:bg-primary/5 text-foreground";
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect(option)}
                        disabled={!!selectedOption}
                        className={btnClass}
                      >
                        <div className="flex justify-between items-center">
                          <span>{option}</span>
                          {selectedOption && isSelected && (
                            isCorrect ? <Check size={20} /> : <X size={20} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
