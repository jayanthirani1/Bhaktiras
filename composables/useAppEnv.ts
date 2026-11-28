/**
 * True on the test website (`bhaktiras-test`, built from the `test` branch
 * with apphosting.test.yaml). It shares the live database, so anything that
 * writes real records — like a shop order — checks this to keep test data
 * apart.
 */
export function useIsTestSite(): boolean {
  return useRuntimeConfig().public.appEnv === 'test'
}
