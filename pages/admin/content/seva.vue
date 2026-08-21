<template>
  <div class="space-y-4">
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Seva teams</h1>
        <p class="text-sm text-[hsl(var(--muted-foreground))]">These are the volunteer teams on the Seva page. Edit the heading, gold captions and descriptions, then save.</p>
      </div>
      <button type="button" class="admin-btn-secondary" :disabled="saving" @click="addTeam">Add team</button>
    </div>

    <div class="admin-panel grid gap-4">
      <div>
        <label class="admin-label">Section heading</label>
        <input v-model="heading" class="admin-input">
      </div>
      <div>
        <label class="admin-label">Intro</label>
        <textarea v-model="intro" rows="2" class="admin-input" />
      </div>
    </div>

    <div v-for="(team, index) in teams" :key="`${index}-${team.id}`" class="admin-panel">
      <div class="mb-4 flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-[hsl(var(--primary))]">Team {{ index + 1 }}</p>
        <div class="flex gap-2">
          <button type="button" class="admin-btn-secondary" :disabled="index === 0" @click="move(index, -1)">Up</button>
          <button type="button" class="admin-btn-secondary" :disabled="index === teams.length - 1" @click="move(index, 1)">Down</button>
          <button type="button" class="admin-btn-danger" @click="removeTeam(index)">Delete</button>
        </div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="admin-label">ID</label>
          <input v-model="team.id" class="admin-input">
        </div>
        <div>
          <label class="admin-label">Name</label>
          <input v-model="team.name" class="admin-input">
        </div>
        <div class="md:col-span-2">
          <label class="admin-label">Gold caption</label>
          <input v-model="team.summary" class="admin-input" placeholder="Short scope line under the name">
        </div>
        <div class="md:col-span-2">
          <label class="admin-label">Description</label>
          <textarea v-model="team.description" rows="4" class="admin-input" />
        </div>
        <label class="inline-flex items-center gap-2 text-sm"><input v-model="team.active" type="checkbox"> Active</label>
      </div>
    </div>
    <button type="button" class="admin-btn" :disabled="saving" @click="saveTeams">{{ saving ? 'Saving…' : 'Save seva page' }}</button>
  </div>
</template>

<script setup lang="ts">
import type { SevaTeamContent } from '~/types'
import { cloneList, parseSevaHeading, parseSevaIntro, sevaTeamsFromSource } from '~/data/siteContent'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { item, saving, error, load, save } = useAdminSiteContent()
const heading = ref(parseSevaHeading(undefined))
const intro = ref(parseSevaIntro(undefined))
const teams = ref<SevaTeamContent[]>(cloneList(sevaTeamsFromSource(undefined)))

function fill() {
  heading.value = item.value.sevaHeading
  intro.value = item.value.sevaIntro
  teams.value = cloneList(item.value.sevaTeams)
}
function move(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= teams.value.length) return
  const [entry] = teams.value.splice(index, 1)
  teams.value.splice(target, 0, entry)
}
function removeTeam(index: number) {
  teams.value.splice(index, 1)
}
function addTeam() {
  teams.value.push({
    id: `team-${teams.value.length + 1}`,
    name: '',
    summary: '',
    description: '',
    active: true
  })
}
async function saveTeams() {
  const incomplete = teams.value.find(team => !team.id.trim() || !team.name.trim() || !team.description.trim())
  if (incomplete) {
    error.value = 'Each team needs an ID, name and description.'
    return
  }
  if (!heading.value.trim() || !intro.value.trim()) {
    error.value = 'The heading and intro cannot be empty.'
    return
  }
  await save({
    sevaHeading: heading.value.trim(),
    sevaIntro: intro.value.trim(),
    sevaTeams: teams.value.map((team, index) => ({ ...team, order: index + 1 }))
  })
  fill()
}

onMounted(async () => {
  await load()
  fill()
})

useHead({ title: 'Seva teams · Admin' })
</script>
