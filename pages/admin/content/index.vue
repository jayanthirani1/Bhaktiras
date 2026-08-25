<template>
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    <NuxtLink
      v-for="card in cards"
      :key="card.to"
      :to="card.to"
      class="admin-panel group flex flex-col justify-between hover:border-[hsl(var(--primary))]/30"
    >
      <div>
        <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">{{ card.title }}</h2>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{{ card.desc }}</p>
      </div>
      <p class="mt-4 text-sm font-semibold text-[hsl(var(--golden-900))] group-hover:underline">Edit →</p>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const cards = [
  { title: 'Homepage tiles', desc: 'Edit the homepage grid cards and links.', to: '/admin/content/homepage' },
  { title: 'Navigation', desc: 'Manage desktop nav, mobile tabs and the More drawer.', to: '/admin/content/navigation' },
  { title: 'Community questions', desc: 'Edit the prompt list shown in the post-message dropdown.', to: '/admin/content/community' },
  { title: 'Seva teams', desc: 'Edit volunteer team names, gold captions and descriptions.', to: '/admin/content/seva' }
]

useHead({ title: 'Content settings · Admin' })
</script>
