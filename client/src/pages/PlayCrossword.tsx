import { Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { motion } from "framer-motion";
import { ArrowLeft, Grid3X3 } from "lucide-react";

export default function PlayCrossword() {
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
          title="Crossword"
          subtitle="Solve devotional-themed clues and fill the grid. Coming soon."
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-12 shadow-xl border border-golden-200 text-center"
        >
          <div className="w-20 h-20 bg-golden-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-golden-700">
            <Grid3X3 className="w-10 h-10" strokeWidth={2} />
          </div>
          <p className="text-muted-foreground mb-6">
            The crossword game is under development. Check back soon for devotional puzzles.
          </p>
          <Link
            href="/play"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-golden-100 text-foreground font-medium hover:bg-golden-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to games
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
