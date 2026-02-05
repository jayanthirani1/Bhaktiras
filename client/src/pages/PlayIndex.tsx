import { Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { motion } from "framer-motion";
import { Grid3X3, Brain, Type } from "lucide-react";
import { ArrowRight } from "lucide-react";

const games = [
  {
    slug: "crossword",
    title: "Crossword",
    description: "Solve devotional-themed clues and fill the grid.",
    icon: Grid3X3,
    href: "/play/crossword",
    color: "from-golden-500/20 to-golden-600/20 border-golden-200/60 hover:border-golden-400",
    iconBg: "bg-golden-100 text-golden-700",
  },
  {
    slug: "quiz",
    title: "Devotional Quiz",
    description: "Test your knowledge about our temple's history and traditions.",
    icon: Brain,
    href: "/play/quiz",
    color: "from-primary/20 to-golden-600/20 border-primary/40 hover:border-primary",
    iconBg: "bg-primary/15 text-primary",
  },
  {
    slug: "wordle",
    title: "Wordle",
    description: "Guess the devotional word in six tries.",
    icon: Type,
    href: "/play/wordle",
    color: "from-emerald-500/20 to-teal-600/20 border-emerald-200/60 hover:border-emerald-400",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const tile = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function PlayIndex() {
  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="Play"
          subtitle="Choose a game to enjoy—crossword, quiz, or wordle."
        />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 sm:grid-cols-1 md:grid-cols-3 mt-10"
        >
          {games.map(({ slug, title, description, icon: Icon, href, color, iconBg }) => (
            <motion.div key={slug} variants={tile}>
              <Link
                href={href}
                className={`block rounded-2xl border-2 bg-gradient-to-br ${color} p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]`}
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 ${iconBg}`}
                >
                  <Icon className="w-7 h-7" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 font-display">
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                  Play
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
