/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
      colors: {
          "new-blue": "#53ACC9",
          "lightBlue": "#57D4D2",
          "lightGreen": "#57D48B",
          "new-green": "#53C963",
          "hardGreen": "#57BD9E"
      },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}

