## Requirements

```bash
node.js >= 24.13.1
pnpm >= 10.30.1
postgresql >= 17
```

## Setup

Make sure to install the dependencies:

```bash
pnpm install
```

Push schema changes to database:

```bash
pnpm db:push:dev
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

For viewing database using browser

```bash
pnpm db:studio:dev
```
