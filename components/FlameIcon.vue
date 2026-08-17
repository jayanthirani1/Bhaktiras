<template>
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="flame">
    <defs>
      <radialGradient :id="`${uid}-halo`" cx="50%" cy="70%" r="55%">
        <stop offset="0" stop-color="#fb923c" stop-opacity="0.9" />
        <stop offset="1" stop-color="#fb923c" stop-opacity="0" />
      </radialGradient>
      <linearGradient :id="`${uid}-outer`" x1="12" y1="2.5" x2="12" y2="19.8" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#fcd34d" />
        <stop offset="0.42" stop-color="#f97316" />
        <stop offset="1" stop-color="#dc2626" />
      </linearGradient>
      <linearGradient :id="`${uid}-core`" x1="12" y1="10.6" x2="12" y2="19.2" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#fffbeb" />
        <stop offset="0.55" stop-color="#fde68a" />
        <stop offset="1" stop-color="#fb923c" />
      </linearGradient>
    </defs>

    <circle class="flame-halo" cx="12" cy="15" r="9" :fill="`url(#${uid}-halo)`" />
    <path
      class="flame-body"
      :fill="`url(#${uid}-outer)`"
      d="M12 2.5c2.2 3 3.1 4.2 4.3 6.1 1.1 1.7 1.8 3.3 1.8 5 0 3.4-2.7 6.2-6.1 6.2S5.9 17 5.9 13.6c0-1.7.7-3.3 1.8-5C8.9 6.7 9.8 5.5 12 2.5z"
    />
    <path
      class="flame-core"
      :fill="`url(#${uid}-core)`"
      d="M12 11.2c1.1 1.5 1.6 2.1 2.1 2.9.5.8.8 1.5.8 2.2 0 1.6-1.3 2.9-2.9 2.9s-2.9-1.3-2.9-2.9c0-.7.3-1.4.8-2.2.5-.8 1-1.4 2.1-2.9z"
    />
  </svg>
</template>

<script setup lang="ts">
/** Gradients are referenced by url(#id), so each flame needs its own ids. */
const uid = useId()
</script>

<style scoped>
.flame {
  overflow: visible;
}

/* Each layer runs at its own tempo so the loops rarely line up, which reads as
   a real flame rather than a single repeating wobble. */
.flame-body,
.flame-core {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  will-change: transform;
}

.flame-body {
  animation: flame-body 1.45s ease-in-out infinite;
}

.flame-core {
  animation: flame-core 0.93s ease-in-out infinite;
}

.flame-halo {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: flame-halo 2.15s ease-in-out infinite;
}

@keyframes flame-body {
  0% { transform: translateX(0) scale(1, 1) rotate(0deg); }
  17% { transform: translateX(-0.3px) scale(0.95, 1.09) rotate(-2.6deg); }
  34% { transform: translateX(0.28px) scale(1.06, 0.96) rotate(1.9deg); }
  53% { transform: translateX(-0.18px) scale(0.97, 1.07) rotate(-1.1deg); }
  72% { transform: translateX(0.34px) scale(1.04, 1.01) rotate(2.4deg); }
  88% { transform: translateX(-0.12px) scale(0.99, 1.05) rotate(-0.7deg); }
  100% { transform: translateX(0) scale(1, 1) rotate(0deg); }
}

@keyframes flame-core {
  0% { transform: scale(1, 1); opacity: 0.95; }
  23% { transform: scale(0.88, 1.14) rotate(-1.6deg); opacity: 1; }
  47% { transform: scale(1.09, 0.9) rotate(1.2deg); opacity: 0.78; }
  69% { transform: scale(0.93, 1.1) rotate(-0.9deg); opacity: 1; }
  86% { transform: scale(1.04, 0.97) rotate(0.7deg); opacity: 0.88; }
  100% { transform: scale(1, 1); opacity: 0.95; }
}

@keyframes flame-halo {
  0% { opacity: 0.34; transform: scale(1); }
  38% { opacity: 0.62; transform: scale(1.12); }
  67% { opacity: 0.26; transform: scale(0.95); }
  100% { opacity: 0.34; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .flame-body,
  .flame-core,
  .flame-halo {
    animation: none !important;
  }
}
</style>
