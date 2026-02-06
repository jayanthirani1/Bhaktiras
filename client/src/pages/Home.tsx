import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Video, 
  Hand, 
  Gamepad2, 
  Clock 
} from "lucide-react";

const menuItems = [
  { id: "journey", title: "Journey", desc: "10 Years of Grace", icon: MapPin, color: "bg-orange-100 text-orange-600", href: "/journey" },
  { id: "events", title: "Events", desc: "Celebration Schedule", icon: Calendar, color: "bg-blue-100 text-blue-600", href: "/events" },
  { id: "community", title: "Community", desc: "Wall of Gratitude", icon: Users, color: "bg-rose-100 text-rose-600", href: "/community" },
  { id: "darshan", title: "Darshan", desc: "Live Streaming", icon: Video, color: "bg-purple-100 text-purple-600", href: "/darshan" },
  { id: "seva", title: "Seva", desc: "Volunteer Roles", icon: Hand, color: "bg-green-100 text-green-600", href: "/seva" },
  { id: "play", title: "Play", desc: "Quiz, Wordle, Spelling Bee & more", icon: Gamepad2, color: "bg-yellow-100 text-yellow-600", href: "/play" },
  { id: "legacy", title: "Legacy", desc: "Time Capsule", icon: Clock, color: "bg-indigo-100 text-indigo-600", href: "/legacy" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] bg-fixed pb-24 md:pb-12">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[50vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-golden-50 to-transparent opacity-50" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="z-10 relative max-w-2xl mx-auto"
        >
          <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider text-foreground uppercase bg-golden-100 rounded-full">
            Jai Swaminarayan
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground mb-4 tracking-tight">
            Bhaktiras
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed mb-8">
            Celebrating a decade of devotion, community, and selfless service. 
            Join us in commemorating 10 glorious years.
          </p>
          
          <Link href="/events">
            <button className="px-8 py-3 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300">
              Join Celebrations
            </button>
          </Link>
        </motion.div>
      </section>
      {/* Grid Navigation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={item.href}>
                <div className="group h-full bg-white p-6 rounded-2xl shadow-sm border border-golden-200 hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
      {/* Footer Quote */}
      <footer className="mt-20 text-center px-6">
        <blockquote className="font-display text-2xl italic text-muted-foreground/80 max-w-2xl mx-auto">"In the joy of others, lies our own."</blockquote>
      </footer>
    </div>
  );
}
