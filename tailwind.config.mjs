/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  content: [
    "./index.html", // Add index.html because it's in the root
    "./src/**/*.{js,jsx}", // Scan only .js and .jsx files in src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
