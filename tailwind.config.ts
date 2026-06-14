import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        mist: "#f5f7fb",
        pine: "#176b5f",
        coral: "#d85c4a"
      }
    }
  },
  plugins: []
};

export default config;
