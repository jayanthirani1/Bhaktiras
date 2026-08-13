<template>
  <div>
  <div class="admin-root">
    <aside class="admin-nav">
      <AdminSidebar @logout="logout" />
    </aside>

    <div class="admin-main">
      <header class="admin-top">
        <div class="admin-top__title">
          <button type="button" class="admin-menu-btn" aria-label="Open menu" @click="sidebarOpen = true">
            ☰
          </button>
          <div>
            <h1>{{ pageTitle }}</h1>
            <p v-if="pageSubtitle">{{ pageSubtitle }}</p>
          </div>
        </div>
        <NuxtLink to="/" class="admin-view-site">View site</NuxtLink>
      </header>
      <div class="admin-body">
        <slot />
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="sidebarOpen" class="admin-overlay" @click="sidebarOpen = false" />
    <aside v-if="sidebarOpen" class="admin-drawer">
      <AdminSidebar show-close @navigate="sidebarOpen = false" @close="sidebarOpen = false" @logout="logout" />
    </aside>
  </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_MENU } from '~/data/adminMenu'

const route = useRoute()
const { signOut } = useAuth()
const sidebarOpen = ref(false)

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin' || route.path === '/admin/'
  return route.path === to || route.path.startsWith(`${to}/`)
}

const activeItem = computed(() => ADMIN_MENU.find(i => isActive(i.to)) || ADMIN_MENU[0])
const pageTitle = computed(() => activeItem.value.label)
const pageSubtitle = computed(() => activeItem.value.subtitle)

watch(() => route.path, () => { sidebarOpen.value = false })

async function logout() {
  sidebarOpen.value = false
  await signOut()
  await navigateTo('/admin/auth')
}
</script>

<style>
.admin-root {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: hsl(var(--muted));
}
.admin-nav {
  display: none;
  flex: 0 0 240px;
  width: 240px;
  min-width: 240px;
  max-width: 240px;
  height: 100vh;
  position: sticky;
  top: 0;
  background: #fff;
  border-right: 1px solid hsl(var(--border));
}
.admin-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.admin-top {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid hsl(var(--border));
}
.admin-top__title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.admin-top h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.125rem;
  color: hsl(var(--primary));
}
.admin-top p {
  margin: 2px 0 0;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
.admin-menu-btn {
  display: inline-flex;
  border: 0;
  background: transparent;
  padding: 8px;
  font-size: 18px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
}
.admin-view-site {
  flex-shrink: 0;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--primary));
  text-decoration: none;
}
.admin-body {
  padding: 20px;
}
.admin-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(0, 0, 0, 0.5);
}
.admin-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 90;
  width: 240px;
  background: #fff;
  box-shadow: 8px 0 30px rgba(0, 0, 0, 0.12);
}
@media (min-width: 900px) {
  .admin-nav {
    display: block;
  }
  .admin-menu-btn,
  .admin-overlay,
  .admin-drawer {
    display: none !important;
  }
}
</style>
