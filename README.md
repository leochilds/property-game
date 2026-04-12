# Property Game

A property trading simulation game built with SvelteKit and TypeScript.

**[Play the live demo](https://leochilds.github.io/property-game/)**

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) - Application framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- GitHub Pages - Hosting

## Development

Install dependencies and start the dev server:

```sh
npm install
npm run dev
```

## Building

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## Testing

This project has comprehensive test coverage across multiple layers. See [TESTING.md](./TESTING.md) for detailed documentation.

```sh
# Run all tests (unit + E2E)
npm test

# Run unit tests only
npm run test:unit

# Run E2E tests only
npm run test:e2e
```

### Test Suites

- **Unit Tests** - Date utilities and game calculations
- **Integration Tests** - Game store logic and state management
- **Component Tests** - UI interactions and rendering
- **E2E Tests** - Complete user workflows

~150 test cases ensuring existing functionality is preserved when adding new features.
