import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useCreateTimeCapsuleMessage } from "@/hooks/use-mandir";
import { motion } from "framer-motion";
import { Lock, Send, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function Legacy() {
  const [message, setMessage] = useState("");
  const createMessage = useCreateTimeCapsuleMessage();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    createMessage.mutate({ message }, {
      onSuccess: () => {
        setSubmitted(true);
        toast({
          title: "Legacy Sealed",
          description: "Your message has been added to the Time Capsule.",
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
      <div className="max-w-3xl mx-auto">
        <PageHeader 
          title="Time Capsule 2036" 
          subtitle="Leave a message for the future devotees. To be opened on our 20th Anniversary." 
        />

        <div className="mt-12">
          {submitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-12 shadow-xl border border-primary/20 text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                <Lock className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Message Sealed Securely</h3>
              <p className="text-muted-foreground leading-relaxed">
                Thank you for contributing to our legacy. Your words have been preserved 
                and will inspire future generations when revealed in 2036.
              </p>
              <button 
                onClick={() => {
                  setSubmitted(false);
                  setMessage("");
                }}
                className="mt-8 text-primary font-medium hover:underline"
              >
                Submit another message
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-golden-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
              
              <div className="flex items-center space-x-2 text-primary font-bold mb-6 text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Future Legacy</span>
              </div>

              <form onSubmit={handleSubmit} className="relative z-10">
                <div className="mb-6">
                  <label className="block text-foreground font-medium mb-2">Your Message for 2036</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What are your hopes for the next 10 years?"
                    className="min-h-[200px] resize-none bg-golden-50/30 border-golden-200 focus:border-primary focus:ring-primary/20 rounded-xl text-lg leading-relaxed p-4"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground/80 flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    Encrypted & Stored until 2036
                  </p>
                  
                  <button
                    type="submit"
                    disabled={!message.trim() || createMessage.isPending}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-foreground text-white font-semibold shadow-lg shadow-foreground/20 hover:bg-foreground/90 disabled:opacity-70 transition-all flex items-center justify-center space-x-2"
                  >
                    {createMessage.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sealing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Seal in Time Capsule</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
