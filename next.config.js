/**
 * `ogl` ships untranspiled ESM (`"type": "module"`, entry `./src/index.js`) and
 * has no CommonJS build. Next has to run it through the compiler or the server
 * bundle fails to parse it — hence `transpilePackages`. It is the only WebGL
 * dependency in the project; the effects in `components/effects/` are built on
 * it directly rather than on three.js, which is fifty times the size for the
 * same handful of full-screen fragment shaders.
 *
 * Strict Mode is on deliberately. It double-invokes effects in development,
 * which for a WebGL layer means create → dispose → create — exactly the cycle
 * that exposes a missing GL cleanup before it becomes a leak in production.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['ogl'],
}

module.exports = nextConfig
