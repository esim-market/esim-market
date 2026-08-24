# AGENTS.md — eSIM Market UI

## Bootstraping / Initializing

### Purpose

This repository is `esim-market-ui`, the React-based frontend application for the eSIM Market project.

The immediate objective is to create a minimal, production-oriented, Dockerized React "Hello World" application that:

- uses React with TypeScript,
- uses Vite as the frontend build and development tool,
- uses React Aria for accessible, headless/faceless UI behavior and primitives,
- builds the frontend in a Node.js container stage,
- serves the generated static assets with nginx in the final runtime stage,
- keeps nginx configuration external to the Dockerfiles so Kubernetes can override it with a ConfigMap,
- follows the directory structure defined in this document,
- remains deliberately small and easy to extend,
- can later be integrated into the parent `esim-market` orchestration repository.

Do not introduce backend services, databases, API implementations, authentication, state-management frameworks, payment functionality, or unrelated functionality at this stage.

---

### Required Technology Stack

Use:

- React
- TypeScript
- Vite
- npm
- React Aria
- Node.js for build/development
- nginx for production/static serving
- Docker multi-stage builds

Do not use Create React App.

Create React App is deprecated for new applications. This project intentionally uses Vite as the modern build/development tool.

Do not replace Vite with Webpack, Parcel, Next.js, Remix, or another build/framework solution unless explicitly requested.

---

### Required Repository Structure

Organize the repository around three main concerns:

```text
esim-market-ui/
├── AGENTS.md
├── .dockerignore
├── .gitignore
├── README.md
│
├── Dockerfiles/
│   └── esim-market-ui
│
├── nginx/
│   ├── nginx.conf
│   └── ...
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── public/
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── components/
        ├── styles/
        └── ...
```

The exact auxiliary TypeScript/Vite files may vary slightly with the Vite version, but the three top-level areas must remain:

```text
Dockerfiles/
nginx/
frontend/
```

#### Directory responsibilities

##### `frontend/`

Contains all React, TypeScript, Vite, npm, application source, frontend static assets, and frontend configuration.

Do not place React source files at repository root.

##### `nginx/`

Contains nginx configuration and any nginx-specific static/configuration resources.

At minimum it must contain:

```text
nginx/nginx.conf
```

##### `Dockerfiles/`

Contains Docker build definitions.

The frontend Dockerfiles must be located exactly at:

```text
./Dockerfiles/esim-market-ui
```

Do not create the primary Dockerfiles as:

```text
./Dockerfiles
```

or:

```text
./Dockerfiles/Dockerfiles
```

---

### React and TypeScript Requirements

All application source must use TypeScript.

Use:

```text
.ts
.tsx
```

where appropriate.

Do not create the application using JavaScript-only `.js` or `.jsx` source files unless a tool-generated configuration file strictly requires it and there is a documented reason.

The Vite application should use the React + TypeScript template/conventions.

Prefer:

```text
App.tsx
main.tsx
vite.config.ts
```

Use strict and sensible TypeScript settings.

Avoid `any` unless unavoidable and documented.

Do not add complex type abstractions for the Hello World implementation.

---

### React Aria Requirements

Use the `react-aria` package as the headless/faceless accessibility and interaction layer.

Install it through npm and include it in `frontend/package.json`.

React Aria should be used intentionally rather than merely added as an unused dependency.

For the initial Hello World UI, create at least one small interactive element implemented using React Aria behavior, for example an accessible button.

The page should remain visually simple while demonstrating that React Aria is wired correctly.

Use React Aria for:

- accessibility behavior,
- keyboard interaction,
- focus behavior,
- ARIA semantics,
- interaction primitives.

Do not introduce another component framework such as:

- Material UI
- Bootstrap
- Chakra UI
- Ant Design
- Mantine
- Tailwind-based component kits

React Aria is intentionally headless. Styling should remain under project control.

Do not use React Spectrum visual components unless explicitly requested later.

---

### Initial UI Requirements

Create a very small page that visibly contains at least:

```text
eSIM Market
Hello World
```

It may also include:

```text
Welcome to eSIM Market.
```

Include one minimal React-Aria-backed interactive control, such as:

```text
Get Started
```

or:

```text
Hello eSIM Market
```

The interaction may be intentionally simple.

Do not add:

- authentication,
- routing,
- API calls,
- Redux,
- Zustand,
- complex state management,
- dashboards,
- fake eSIM catalog data,
- payment flows,
- unnecessary dependencies,
- complex animations.

The goal is to prove that React + TypeScript + Vite + React Aria build correctly and that the generated application is served by nginx.

---

### HTML Requirements

Keep `frontend/index.html` minimal and valid.

It must:

- use HTML5,
- contain the React mount element,
- use an appropriate document title,
- load the Vite/React TypeScript entry point,
- avoid unnecessary third-party scripts or external assets.

Use:

```html
<title>eSIM Market</title>
```

or an equivalent meaningful title.

---

### Vite Requirements

Vite is the required build and development tool.

Expected npm scripts should include at least:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

If the selected current Vite React TypeScript template uses a slightly different valid build command, keep the current supported convention.

Do not add a backend proxy yet.

---

### Vite Development File Watching and HMR

The development environment must react to frontend source changes automatically.

Prefer Vite Hot Module Replacement (HMR) rather than restarting the entire development server for every source-file edit.

Configure Vite so source changes are detected reliably, including when development occurs through Docker Desktop, bind mounts, WSL2, or similar environments where native filesystem events can be unreliable.

In `frontend/vite.config.ts`, configure the development server approximately as follows:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 500
    }
  }
})
```

A polling interval around `500 ms` is the preferred starting point.

The objective is:

```text
source file saved
      ↓
Vite detects change
      ↓
HMR updates affected modules
      ↓
browser reflects the change
```

Do not deliberately restart the entire Vite process for ordinary `.ts`, `.tsx`, CSS, or frontend source changes when HMR can handle the change.

Polling is deliberately enabled for development reliability, but do not set an excessively aggressive interval because polling increases CPU/filesystem activity.

Do not configure `server.allowedHosts: true`.

Use safe explicit host configuration if additional hostnames become necessary later.

---

### npm Requirements

Use npm as the package manager.

A committed lock file is required:

```text
frontend/package-lock.json
```

Local development must support:

```bash
cd frontend
npm install
npm run dev
npm run build
```

Docker builds must use:

```bash
npm ci
```

instead of:

```bash
npm install
```

when the lock file exists.

Do not use yarn, pnpm, or bun unless explicitly requested.

---

### Docker Build Stage

The Docker build stage must use exactly:

```dockerfile
FROM node:26.7.0-trixie-slim
```

Do not silently replace this image with:

- `node:latest`
- another Node version
- Alpine
- Bookworm
- an unpinned Node image

Use `/app` as the working directory unless there is a compelling reason otherwise.

Because the frontend files live under `frontend/`, optimize Docker layer caching by copying dependency manifests first.

The build flow should be conceptually equivalent to:

```dockerfile
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build
```

The resulting Vite production output is expected at:

```text
/app/dist
```

unless the Vite configuration explicitly and intentionally defines another output directory.

---

### nginx Runtime Stage

The final runtime stage must use exactly:

```dockerfile
FROM nginx:1.31.4-trixie
```

The requested nginx tag is intentionally pinned.

Before relying on it, verify that Docker can pull the exact tag.

If `nginx:1.31.4-trixie` does not exist or cannot be pulled:

1. do not silently replace it,
2. do not use `latest`,
3. do not automatically upgrade or downgrade nginx,
4. clearly report the failure,
5. request explicit approval before substituting another image.

---

### nginx Configuration File

Create a separate configuration file at:

```text
./nginx/nginx.conf
```

Do not embed the nginx server configuration only inside the Dockerfiles.

The Docker image must ship with a working default configuration by copying this repository file into nginx.

Use a Dockerfiles command equivalent to:

```dockerfile
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
```

This is intentional.

Although the repository file is named:

```text
nginx/nginx.conf
```

it contains the application's nginx `server` configuration and is installed as:

```text
/etc/nginx/conf.d/default.conf
```

inside the runtime container.

The reason is to make Kubernetes configuration replacement straightforward.

A Kubernetes deployment should later be able to mount a ConfigMap over:

```text
/etc/nginx/conf.d/default.conf
```

for example using a `subPath`, without rebuilding the image.

The image must therefore have:

```text
baked-in default nginx config
             +
runtime-overridable Kubernetes ConfigMap
```

Do not create Kubernetes manifests as part of this task.

---

### nginx Configuration Requirements

The nginx configuration should be minimal and suitable for a Vite-built React SPA.

It must:

- listen on container port `80`,
- serve files from the nginx static document root,
- serve the Vite production build,
- support SPA fallback to `index.html`,
- avoid backend reverse proxy configuration for now,
- avoid TLS configuration for now,
- avoid unnecessary tuning.

A configuration conceptually similar to the following is appropriate:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Keep the actual implementation clean and valid.

---

### Docker Multi-Stage Architecture

Use a multi-stage build:

```text
node:26.7.0-trixie-slim
        │
        │ npm ci
        │ TypeScript compile
        │ vite build
        ▼
      /app/dist
        │
        ├──────────────────────────────┐
        │                              │
        ▼                              ▼
nginx:1.31.4-trixie           nginx/nginx.conf
        │                              │
        └──────────────┬───────────────┘
                       ▼
           Production runtime image
                       │
                       ▼
                  listens on :80
```

The final nginx image should not contain the Node.js toolchain.

Copy the Vite output into:

```text
/usr/share/nginx/html
```

or the appropriate nginx static serving path used by the configuration.

---

### Do not leave the image with root user
Switch user to non-root existsing one such as nginx or 1001
Due to most of vulnerability scan tools has issue about root startup of a docker image. 

### Container Port and Host Development Port

nginx must listen internally on:

```text
80
```

The Dockerfiles may declare:

```dockerfile
EXPOSE 80
```

Do not attempt to encode host port `5001` in the Dockerfiles.

Dockerfiless define the container-side port; host-to-container port mapping is an orchestration/runtime concern.

For local execution without Docker Compose, use:

```bash
docker run --rm \
  -p 5001:80 \
  esim-market-ui:local
```

The application should then be available at:

```text
http://localhost:5001
```

The intended eventual orchestration mapping is:

```text
host:5001 -> container:80
```

Docker Compose configuration belongs in the separate `esim-market` orchestration repository and must not be created in this repository as part of this task.

---

### Docker Build Command

The implementation must be buildable from repository root using:

```bash
docker build \
  -f ./Dockerfiles/esim-market-ui \
  -t esim-market-ui:local \
  .
```

The Dockerfiles path must work with this exact build context.

---

### Development Commands

Frontend development without the production nginx container should work using:

```bash
cd frontend
npm ci
npm run dev
```

Vite should detect source changes and apply HMR automatically.

Production-style local validation should use:

```bash
docker build \
  -f ./Dockerfiles/esim-market-ui \
  -t esim-market-ui:local \
  .

docker run --rm \
  -p 5001:80 \
  esim-market-ui:local
```

Production-style validation URL:

```text
http://localhost:5001
```

---

### `.dockerignore`

Create a repository-root `.dockerignore` suitable for this layout.

At minimum, exclude unnecessary build-context content such as:

```text
.git
.gitignore
frontend/node_modules
frontend/dist
npm-debug.log*
```

Do not exclude:

```text
frontend/package.json
frontend/package-lock.json
frontend/src
frontend/public
frontend/index.html
frontend/vite.config.ts
nginx/nginx.conf
```

or any other files required by the build.

---

### Existing Files

Preserve useful repository files that already exist unless they directly conflict with these instructions.

In particular:

- do not delete `README.md`,
- do not replace `.gitignore` with an inferior generated version,
- do not remove `AGENTS.md`,
- do not modify unrelated GitHub repository settings,
- do not alter Git submodule configuration.

If generated Vite files conflict with existing repository files, merge carefully rather than blindly overwriting useful content.

---

### Scope Boundaries

This task is limited to the initial Dockerized UI template.

Do not implement:

- backend communication,
- REST clients,
- authentication,
- authorization,
- accounts,
- payment processing,
- databases,
- queues,
- eSIM business workflows,
- Docker Compose,
- Kubernetes manifests,
- Helm charts,
- CI/CD workflows,
- GitHub Actions,
- production TLS,
- nginx backend reverse proxy rules.

Docker Compose belongs to the `esim-market` orchestration repository.

Kubernetes-specific manifests may be introduced later in the appropriate deployment/orchestration repository. The nginx image produced here must merely be designed so its application nginx configuration can be overridden cleanly by a Kubernetes ConfigMap.

---

### Code Quality

Keep the implementation:

- small,
- readable,
- idiomatic,
- type-safe,
- accessible,
- reproducible,
- easy to extend,
- free of unnecessary abstraction.

Prefer React functional components.

Prefer React Aria primitives/hooks where interactive behavior is required.

Do not introduce unused dependencies.

Do not leave TypeScript compiler errors.

Do not leave obvious browser console errors.

Do not disable TypeScript safety merely to make compilation pass.

---

### Validation Requirements

Before considering the task complete, perform these checks where the environment permits them.

#### Frontend validation

From `frontend/` run:

```bash
npm ci
npm run build
```

The TypeScript and Vite production build must succeed.

If linting is configured, run the lint command as well.

#### Development watcher validation

Where practical:

1. run `npm run dev`,
2. modify a `.tsx` or related source file,
3. verify Vite detects the change,
4. verify HMR/browser refresh occurs without manually restarting Vite.

Do not claim watcher/HMR validation succeeded unless it was actually tested.

#### Docker validation

From repository root:

```bash
docker build \
  -f ./Dockerfiles/esim-market-ui \
  -t esim-market-ui:local \
  .
```

If Docker runtime execution is available:

```bash
docker run --rm \
  -d \
  --name esim-market-ui-test \
  -p 5001:80 \
  esim-market-ui:local
```

Verify:

```text
http://localhost:5001
```

returns the React application through nginx.

Clean up the test container afterward.

---

### Required Behavior

A successful implementation demonstrates that:

1. React source is written in TypeScript.
2. React source compiles successfully.
3. Vite produces a production build.
4. React Aria is actually used by at least one interactive UI element.
5. Vite detects source changes during development using HMR.
6. Polling is configured at a reasonable interval for Docker/WSL development reliability.
7. Docker uses `node:26.7.0-trixie-slim` for the build stage.
8. Docker uses `nginx:1.31.4-trixie` for the runtime stage.
9. `nginx/nginx.conf` is copied into the nginx runtime image.
10. The nginx configuration can later be replaced by a Kubernetes ConfigMap.
11. nginx listens on container port `80`.
12. local production-style execution maps host port `5001` to container port `80`.
13. nginx serves the generated React application.
14. the page displays `eSIM Market` and `Hello World`.

---

### Expected Deliverables

The completed repository should resemble:

```text
esim-market-ui/
├── AGENTS.md
├── .dockerignore
├── .gitignore
├── README.md
│
├── Dockerfiles/
│   └── esim-market-ui
│
├── nginx/
│   └── nginx.conf
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── public/
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── components/
        └── styles/
```

Do not move Docker Compose into this repository.

---

### Completion Report

After implementation, report:

1. files created,
2. files modified,
3. React version used,
4. TypeScript version used,
5. Vite version used,
6. React Aria version used,
7. confirmation that `npm run build` succeeds,
8. confirmation that Vite file watching/HMR works, if actually tested,
9. confirmation that the Docker image builds, if Docker is available,
10. confirmation that nginx serves the application on container port `80`,
11. confirmation that local mapping `5001:80` works, if actually tested,
12. confirmation that `nginx/nginx.conf` is copied into `/etc/nginx/conf.d/default.conf`,
13. any deviation from these instructions.

Do not claim a validation step succeeded unless it was actually executed successfully.

---

## Complex Tuning

**SKIP THIS SECTION FOR NOW.**

This section is intentionally reserved for future work.

Do not infer or implement complex tuning during bootstrap.

---

## Integrating the API SDK with esim connect

**SKIP THIS SECTION FOR NOW.**

This section is intentionally reserved for future work.

Do not infer or implement complex tuning during bootstrap.
