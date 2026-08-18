import type { Config } from 'tailwindcss'
const config: Config = { content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'], theme:{extend:{colors:{ink:'#09090B',panel:'#111113',line:'#1F1F23',lime:'#A3E635',cyan:'#22D3EE',violet:'#8B5CF6'}}}, plugins:[] }
export default config
