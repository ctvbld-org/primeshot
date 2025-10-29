// Stub for website - provides default generation config for demo
export function useGenerationConfig() {
  return {
    data: {
      inferenceSettings: {
        qualities: ['basic', 'standard', 'high'],
        quality_labels: {
          basic: 'Basic',
          standard: 'Standard',
          high: 'High'
        },
        defaults: {
          quality: 'standard',
          nb_takes: 4,
          aspect_ratio: '1:1'
        },
        nb_takes_options: [1, 2, 4, 8],
        aspect_ratios: ['1:1', '2:3', '3:2']
      },
      creditCosts: {
        basic: 1,
        standard: 2,
        high: 4
      }
    },
    isLoading: false,
    error: null
  }
}

