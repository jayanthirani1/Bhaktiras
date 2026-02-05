import { PageHeader } from "@/components/PageHeader";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Darshan() {
  const [sankalpName, setSankalpName] = useState("");
  const { toast } = useToast();

  const handleSankalpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sankalpName.trim()) return;
    
    // In a real app, this would be a mutation
    toast({
      title: "Sankalp Submitted",
      description: `Prayers for ${sankalpName} have been offered.`,
    });
    setSankalpName("");
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
      <div className="max-w-4xl mx-auto">
        <PageHeader 
          title="Live Darshan" 
          subtitle="Experience the divinity from wherever you are." 
        />

        {/* Video Player Placeholder */}
        <div className="relative aspect-video bg-black rounded-3xl shadow-2xl overflow-hidden mb-12 group">
          {/* Placeholder image from Unsplash: Temple interior or deity */}
          <img 
            src="https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1600&auto=format&fit=crop&q=80" 
            alt="Darshan Placeholder" 
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-primary/30 backdrop-blur-sm"
            >
              <Play className="w-8 h-8 text-white ml-1 fill-white" />
            </motion.div>
            <p className="mt-4 text-white/90 font-medium tracking-wide">Live Stream Offline</p>
            <p className="text-white/60 text-sm">Next Aarti: 7:00 PM</p>
          </div>
          
          <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-white text-xs font-bold uppercase tracking-wider">Offline</span>
            </div>
          </div>
        </div>

        {/* Sankalp Form */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-golden-200 max-w-lg mx-auto text-center">
          <h3 className="text-2xl font-display font-bold text-foreground mb-2">Submit Sankalp</h3>
          <p className="text-muted-foreground mb-6 text-sm">Offer a prayer request for the evening Aarti.</p>
          
          <form onSubmit={handleSankalpSubmit} className="space-y-4">
            <input
              type="text"
              value={sankalpName}
              onChange={(e) => setSankalpName(e.target.value)}
              placeholder="Enter Name for Prayers"
              className="w-full px-4 py-3 rounded-xl bg-golden-50/50 border-2 border-golden-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-center placeholder:text-muted-foreground/50"
            />
            <button 
              type="submit"
              disabled={!sankalpName.trim()}
              className="w-full py-3 rounded-xl bg-foreground text-white font-semibold shadow-lg shadow-foreground/20 hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Offer Prayer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
