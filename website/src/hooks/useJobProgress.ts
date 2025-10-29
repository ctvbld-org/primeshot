// Stub for website
export function useTrainingProgress({ jobId, onComplete }: any) {
  return {
    progress: null,
    getProgressPercentage: () => 0,
    getLiveCountdownSeconds: () => 0
  }
}

export function useInferenceProgress({ jobId }: any) {
  return {
    progress: null,
    getProgressPercentage: () => 0
  }
}

