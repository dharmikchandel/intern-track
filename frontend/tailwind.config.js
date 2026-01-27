/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'neo-bg': '#F1F5F9', // slate-100
                'neo-primary': '#3B82F6', // blue-500
                // 'neo-secondary': '#0EA5E9', // sky-500
                'neo-secondary': '#8e51ff',
                'neo-tertiary': '#F97316', // orange-500
                'neo-destructive': '#EF4444', // red-500
                'neo-accent': '#6366F1', // indigo-500
                'neo-border': '#000000', // Black border
            },
            boxShadow: {
                'neo': '4px 4px 0px 0px #000000',
                'neo-hover': '6px 6px 0px 0px #000000',
                'neo-active': '2px 2px 0px 0px #000000',
            },
            borderRadius: {
                'neo': '0.75rem', // 12px
            },
        },
    },
    plugins: [],
}
