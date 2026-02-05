import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useGratitudeMessages, useCreateGratitudeMessage } from "@/hooks/use-mandir";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  message: z.string().min(5, "Message must be at least 5 characters").max(200),
});

export default function Community() {
  const { data: messages, isLoading } = useGratitudeMessages();
  const createMessage = useCreateGratitudeMessage();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      message: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMessage.mutate(values, {
      onSuccess: () => {
        toast({
          title: "Message Posted",
          description: "Your gratitude has been shared with the community.",
          variant: "default",
        });
        form.reset();
        setIsFormOpen(false);
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
      <div className="max-w-6xl mx-auto">
        <PageHeader 
          title="Wall of Gratitude" 
          subtitle="Share your experiences, prayers, and heartfelt thanks." 
        />

        {/* Action Button */}
        <div className="text-center mb-12">
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:bg-primary/90 transition-all active:scale-95"
          >
            <Heart className="w-5 h-5 fill-current" />
            <span className="font-semibold">Share Your Gratitude</span>
          </button>
        </div>

        {/* Message Form Modal/Expandable */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-white max-w-lg mx-auto p-8 rounded-2xl shadow-xl border border-primary/20">
                <h3 className="text-xl font-bold text-foreground mb-6 text-center">Write a Message</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-medium">Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your name" className="bg-golden-50/50 border-golden-200 focus:border-primary focus:ring-primary/20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-medium">Your Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Share your thoughts..." 
                              className="resize-none h-32 bg-golden-50/50 border-golden-200 focus:border-primary focus:ring-primary/20" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <button 
                      type="submit" 
                      disabled={createMessage.isPending}
                      className="w-full h-12 rounded-xl bg-foreground text-white font-semibold flex items-center justify-center space-x-2 hover:bg-foreground/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                    >
                      {createMessage.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Post Message</span>
                        </>
                      )}
                    </button>
                  </form>
                </Form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Masonry-style Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {messages?.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="break-inside-avoid bg-white p-6 rounded-2xl shadow-sm border border-golden-100 hover:shadow-md transition-shadow"
              >
                <div className="mb-4 text-primary/20">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9.01699V12.9996H12.017V7.9996H5.01699V14.9996H8.01699V17.9996H5.01699C3.91243 17.9996 3.01699 17.1042 3.01699 16V6.00041C3.01699 4.89584 3.91243 4.00041 5.01699 4.00041H14.017C15.1216 4.00041 16.017 4.89584 16.017 6.00041V11.0004H19.017V8.00041H21.017V16H19.017V21H14.017ZM20.017 14H18.017V12H20.017V14ZM9.01699 10.9996V7.9996H7.01699V10.9996H9.01699Z" />
                  </svg>
                </div>
                <p className="text-foreground/80 leading-relaxed font-serif italic text-lg mb-6">
                  "{msg.message}"
                </p>
                <div className="flex items-center justify-between border-t border-golden-100 pt-4">
                  <span className="font-bold text-foreground text-sm">{msg.name}</span>
                  <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
