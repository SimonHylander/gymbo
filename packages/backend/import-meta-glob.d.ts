/** import.meta.glob is provided by Vite at test time (see convex-test docs). */
interface ImportMeta {
  glob: (pattern: string) => Record<string, () => Promise<unknown>>
}
