import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Defines a global variable for the Gemini API key, using the VITE_ prefixed env variable.
    // This is used by geminiService.ts
    'process.env.API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY),
  }
})