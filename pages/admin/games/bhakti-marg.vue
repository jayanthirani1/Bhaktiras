<template>
  <div class="space-y-4">
    <h1 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Surya Chandra</h1>
    <p class="text-sm text-[hsl(var(--muted-foreground))]">
      Daily 6×6 sun-and-moon puzzles are generated for each UK day. Players fill every cell so each row and column has three suns and three moons, never three of the same in a line. Equals (=) and crosses (×) sit between some cells.
    </p>
    <p class="text-sm text-[hsl(var(--muted-foreground))]">
      Optional overrides can be stored in Firestore collection <code class="rounded bg-[hsl(var(--muted))] px-1">suryaChandraPuzzles</code> with <code class="rounded bg-[hsl(var(--muted))] px-1">dateId</code>, <code class="rounded bg-[hsl(var(--muted))] px-1">given</code>, <code class="rounded bg-[hsl(var(--muted))] px-1">links</code>, <code class="rounded bg-[hsl(var(--muted))] px-1">solution</code> and <code class="rounded bg-[hsl(var(--muted))] px-1">published: true</code>.
    </p>
    <NuxtLink to="/play/surya-chandra" class="admin-btn inline-flex">Open today’s puzzle</NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Surya Chandra · Admin' })
</script>
