# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Testing

This project has comprehensive test coverage across multiple layers. See [TESTING.md](./TESTING.md) for detailed documentation.

### Running Tests

```sh
# Run all tests (unit + E2E)
npm test

# Run unit tests only
npm run test:unit

# Run unit tests in watch mode
npm run test:unit -- --watch

# Run E2E tests only
npm run test:e2e
```

### Test Suites

- **Unit Tests** - Date utilities and game calculations (`src/lib/utils/date.test.ts`)
- **Integration Tests** - Game store logic and state management (`src/lib/stores/gameState.test.ts`)
- **Component Tests** - UI interactions and rendering (`src/routes/page.svelte.spec.ts`)
- **E2E Tests** - Complete user workflows (`e2e/demo.test.ts`)

Total: ~150 test cases ensuring existing functionality is preserved when adding new features.
