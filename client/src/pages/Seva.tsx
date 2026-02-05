import { PageHeader } from "@/components/PageHeader";
import { useVolunteerRoles, useVolunteerSignUp } from "@/hooks/use-mandir";
import { motion } from "framer-motion";
import { Hand, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Seva() {
  const { data: roles, isLoading } = useVolunteerRoles();
  const signUp = useVolunteerSignUp();
  const { toast } = useToast();

  const handleSignUp = (id: number) => {
    signUp.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Seva Confirmed",
          description: "Thank you for volunteering your time.",
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
      <div className="max-w-5xl mx-auto">
        <PageHeader 
          title="Seva Opportunities" 
          subtitle="Service to humanity is service to God. Join our volunteer team." 
        />

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {roles?.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white p-6 rounded-2xl shadow-sm border ${
                  role.isFilled ? "border-green-100 bg-green-50/30" : "border-golden-200"
                } flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${role.isFilled ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}>
                    {role.isFilled ? <CheckCircle2 size={24} /> : <Hand size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{role.role}</h3>
                    <div className="flex items-center text-muted-foreground text-sm mt-1">
                      <Clock size={14} className="mr-1" />
                      <span>{role.timeSlot}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSignUp(role.id)}
                  disabled={role.isFilled || signUp.isPending}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 min-w-[140px] flex justify-center items-center ${
                    role.isFilled 
                      ? "bg-green-100 text-green-700 cursor-default"
                      : "bg-foreground text-white shadow-lg shadow-foreground/20 hover:bg-foreground/90 hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                >
                  {role.isFilled ? (
                    "Position Filled"
                  ) : signUp.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Sign Up"
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
