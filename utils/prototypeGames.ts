/** Games still in prototype are reachable on the test site and in local dev only. */
export function showPrototypeGames(): boolean {
  return import.meta.dev || useRuntimeConfig().public.appEnv === 'test'
}
