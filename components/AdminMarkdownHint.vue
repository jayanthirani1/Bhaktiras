<template>
  <div class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
    <p class="font-semibold text-[hsl(var(--foreground))]">Markdown formatting</p>
    <ul class="mt-1 list-disc space-y-0.5 pl-4">
      <li><code>**bold**</code> and <code>*italic*</code></li>
      <li><code>## Section heading</code> and <code>### Subheading</code></li>
      <li>Leave a blank line between paragraphs</li>
      <li><code>- item</code> for bullet lists</li>
      <li><code>[link text](https://…)</code> for links</li>
    </ul>
  </div>
</template>
