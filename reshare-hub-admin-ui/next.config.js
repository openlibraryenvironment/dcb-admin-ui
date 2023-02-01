/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig:{
    KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER
  }
}

module.exports = nextConfig
