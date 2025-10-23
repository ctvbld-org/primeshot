// Stub for website
export function useActionGate(credits: number, action: string) {
  return {
    runWithGates: (fn: () => Promise<any>) => fn()
  }
}

