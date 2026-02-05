import { PageHeader } from "@/components/PageHeader";
import { useEvents } from "@/hooks/use-mandir";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Radio } from "lucide-react";

export default function Events() {
  const { data: events, isLoading } = useEvents();

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
      <div className="max-w-5xl mx-auto">
        <PageHeader 
          title="Celebration Schedule" 
          subtitle="Join us in these auspicious moments of joy and devotion."
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events?.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-golden-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
              >
                {event.isLive && (
                  <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 bg-red-600 rounded-full" />
                    <span>LIVE NOW</span>
                  </div>
                )}
                
                <div className="w-12 h-12 bg-golden-50 rounded-xl flex items-center justify-center text-golden-600 mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <Calendar size={24} />
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-2">{event.title}</h3>
                
                <div className="flex items-center text-muted-foreground text-sm mb-4 space-x-2">
                  <Clock size={16} />
                  <span>{event.time}</span>
                </div>
                
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {event.description}
                </p>
                
                <button className="w-full py-2.5 rounded-xl border border-golden-200 text-foreground font-medium hover:bg-golden-50 hover:border-golden-300 transition-colors">
                  Add to Calendar
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
