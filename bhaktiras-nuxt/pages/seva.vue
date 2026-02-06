<template>
  <div class="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-3xl mx-auto">
      <PageHeader
        title="Seva Opportunities"
        subtitle="Service to humanity is service to God. Complete the form below to volunteer."
      />

      <div class="rounded-2xl border border-[hsl(var(--golden-200))]/80 bg-white shadow-md overflow-hidden">
        <div class="bg-gradient-to-b from-[hsl(var(--golden-50))]/80 to-white px-6 py-5 md:px-8 md:py-6 border-b border-[hsl(var(--golden-100))]">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]">
              <IconHand class="h-5 w-5" />
            </div>
            <div>
              <h2 class="font-display font-semibold text-[hsl(var(--foreground))] text-lg">Volunteer sign-up</h2>
              <p class="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">Share your details and availability. We'll be in touch.</p>
            </div>
          </div>
        </div>
        <div class="relative bg-stone-50/50">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLScKumypmR1EX942jPH_hVb23GRLZvRnHgNIQst8uqOnItC6Zg/viewform?embedded=true"
            width="100%"
            height="621"
            frameborder="0"
            marginheight="0"
            marginwidth="0"
            title="Seva volunteer sign-up form"
            class="min-h-[621px] w-full block"
          >
            Loading…
          </iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconHand } from '@tabler/icons-vue'
</script>
