import { PageHeader } from "@/components/PageHeader";
import { Hand } from "lucide-react";

export default function Seva() {
  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="Seva Opportunities"
          subtitle="Service to humanity is service to God. Complete the form below to volunteer."
        />

        {/* Native-feeling intro and form container */}
        <div className="rounded-2xl border border-golden-200/80 bg-white shadow-md shadow-golden-900/5 overflow-hidden">
          <div className="bg-gradient-to-b from-golden-50/80 to-white px-6 py-5 md:px-8 md:py-6 border-b border-golden-100">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Hand className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground text-lg">
                  Volunteer sign-up
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Share your details and availability. We’ll be in touch.
                </p>
              </div>
            </div>
          </div>

          <div className="relative bg-stone-50/50">
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLScKumypmR1EX942jPH_hVb23GRLZvRnHgNIQst8uqOnItC6Zg/viewform?embedded=true"
              width="100%"
              height="621"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              title="Seva volunteer sign-up form"
              className="min-h-[621px] w-full block"
            >
              Loading…
            </iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
