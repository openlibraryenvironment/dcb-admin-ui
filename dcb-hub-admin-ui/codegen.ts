import type { CodegenConfig } from '@graphql-codegen/cli'
// This is the configuration for Codegen, a GraphQL code generator that's intended to make our lives easier when working with GraphQL
// https://the-guild.dev/graphql/codegen
 
const config: CodegenConfig = {
   schema: +process.env.DCB_API_BASE!+'/admin',
   documents: ['src/**/*.tsx'],
   generates: {
      './src/gql/': {
        preset: 'client',
        plugins: [],
      }
   }
}
export default config