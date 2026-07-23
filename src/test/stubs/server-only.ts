// Test-only stub for the "server-only" package.
//
// The real package throws when imported outside of Next.js's server webpack
// compilation (see node_modules/server-only/index.js). Next's build tooling
// special-cases that import to enforce server/client boundaries at bundle
// time; Vitest has no equivalent, so importing the real package here would
// make every test that transitively imports a "server-only" module fail
// with "This module cannot be imported from a Client Component module."
//
// Aliased in vitest.config.ts so unit tests can import server-only modules
// without pulling in Next's build-time guard.
export {};
