<template>
  <div class="flex min-h-screen flex-col bg-[hsl(var(--background))]">
    <Navigation />
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
