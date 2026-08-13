import { SITE } from '~/data/site'

export function useCountdown(targetIso = SITE.patotsavStart) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  const target = computed(() => new Date(targetIso).getTime())
  const diff = computed(() => Math.max(0, target.value - now.value))
  const isLive = computed(() => {
    const start = new Date(SITE.patotsavStart).getTime()
    const end = new Date(SITE.patotsavEnd).getTime()
    return now.value >= start && now.value <= end
  })
  const isPast = computed(() => now.value > new Date(SITE.patotsavEnd).getTime())

  const parts = computed(() => {
    const ms = diff.value
    const days = Math.floor(ms / 86400000)
    const hours = Math.floor((ms % 86400000) / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return { days, hours, minutes, seconds }
  })

  onMounted(() => {
    timer = setInterval(() => { now.value = Date.now() }, 1000)
  })
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { parts, isLive, isPast, targetDate: computed(() => new Date(targetIso)) }
}
