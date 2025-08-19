/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        carb: ['var(--font-carb)'],
      },
      letterSpacing: {
        tightest: '-0.04em', // -4% of font size
      },
      colors: {
        obsidian: '#0C1013',
        abyss:    '#052322',
        kelp:     '#083533',
        tide:     '#148580',
        glacier:  '#2ADED8',
        mist:     '#99EFEC',
        frost:    '#E5FBFA',
        ignite:   '#FF550E',
      },
    },
  },
  plugins: [],
}; 