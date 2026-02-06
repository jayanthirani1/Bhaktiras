import { PageHeader } from "@/components/PageHeader";
import { useTimeline } from "@/hooks/use-mandir";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

export default function Journey() {
  const { data: timeline, isLoading, error } = useTimeline();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading Journey...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Failed to load timeline</div>;

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Our Journey"
          subtitle="Milestones of Shree KS Swaminarayan Temple Woolwich—from foundation to 36 years of devotion and community."
        />

        <p className="text-center text-muted-foreground text-sm mb-10">
          <a
            href="https://www.sksswoolwich.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
          >
            sksswoolwich.org
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </p>

        <div className="relative mt-12">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/10 via-primary/40 to-primary/10 transform md:-translate-x-1/2" />

          <div className="space-y-12">
            {timeline?.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col md:flex-row gap-8 ${
                  index % 2 === 0 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Year Bubble */}
                <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full bg-white border-4 border-primary shadow-lg transform -translate-x-1/2 z-10 flex items-center justify-center">
                   <div className="w-2 h-2 rounded-full bg-primary" />
                </div>

                {/* Content */}
                <div className="ml-12 md:ml-0 md:w-1/2 md:px-8">
                  <div className={`bg-white p-6 rounded-2xl shadow-sm border border-golden-200 hover:shadow-md transition-shadow ${
                    index % 2 === 0 ? "text-left" : "md:text-right"
                  }`}>
                    <span className="inline-block px-3 py-1 bg-golden-50 text-foreground text-xs font-bold rounded-full mb-3">
                      {item.year}
                    </span>
                    <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{item.description}</p>
                    
                    {item.imageUrl && (
                      <div className="mt-4 rounded-lg overflow-hidden h-40 w-full relative">
                        {/* Descriptive comment for Unsplash fallback */}
                        {/* Mandir construction or celebration or devotional gathering */}
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1545638100-249071c33c37?w=800&auto=format&fit=crop&q=60";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Empty space for the other side */}
                <div className="md:w-1/2" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
