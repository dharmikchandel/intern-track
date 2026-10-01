/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Palette A "Three Signals": blue = action / in progress, green = good
                // outcome, red = rejection / danger / overdue. Ink and paper do the rest.
                'neo-bg': '#F6F4EE', // paper: the ground behind every screen
                'neo-primary': '#3B82F6', // Signal Blue
                'neo-blue-mid': '#93C5FD', // Online Assessment, secondary emphasis
                'neo-blue-tint': '#DBEAFE', // Applied, info notices, row hover
                'neo-green': '#86EFAC', // Offer Green
                'neo-mint': '#D1FAE5', // success notices, achieved
                'neo-green-deep': '#15803D', // green text and icons on light grounds
                'neo-destructive': '#EF4444', // Stop Red: fills (black text, 5.6:1)
                'neo-red-deep': '#B91C1C', // red text on light grounds (6.5:1)
                'neo-border': '#000000', // Ink
            },
            boxShadow: {
                'neo': '4px 4px 0px 0px #000000',
                'neo-hover': '6px 6px 0px 0px #000000',
                'neo-active': '2px 2px 0px 0px #000000',
                'neo-sm': '2px 2px 0px 0px #000000', // small pieces: avatar, pills, icon tiles
                'neo-modal': '8px 8px 0px 0px #000000', // overlays: modal, mobile drawer
            },
            borderRadius: {
                'neo': '0.75rem', // 12px
            },
        },
    },
    plugins: [],
}
