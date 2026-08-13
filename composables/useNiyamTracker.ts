import { USTAV_NIYAMS } from '~/data/niyams'

const STORAGE_KEY = 'bhaktiras-niyam-tracker'

export function useNiyamTracker() {
  const checked = ref<Record<string, boolean>>({})

  onMounted(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) checked.value = JSON.parse(raw)
    } catch (_) {}
  })

  watch(checked, (v) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch (_) {}
  }, { deep: true })

  const doneCount = computed(() => USTAV_NIYAMS.filter(n => checked.value[n.id]).length)
  const total = USTAV_NIYAMS.length
  const percent = computed(() => total ? Math.round((doneCount.value / total) * 100) : 0)

  function toggle(id: string) {
    checked.value = { ...checked.value, [id]: !checked.value[id] }
  }

  return { niyams: USTAV_NIYAMS, checked, toggle, doneCount, total, percent }
}
