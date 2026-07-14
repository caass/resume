// @fontsource packages ship only CSS with no type declarations, and their
// `exports` map resolves the bare specifier to a `.css` file — which doesn't
// match Vite's `*.css` ambient module. Declare the family so the side-effect
// font imports type-check under TypeScript's stricter side-effect resolution.
declare module "@fontsource/*";
