# AGENTS.md — eSIM Market Orchestration Repository

## Purpose

This repository is the **orchestration repository** for the eSIM Market project.

Its responsibility is to compose and run the independently developed eSIM Market application components.

It must **not** contain frontend application source code, backend application source code, Python packages, React source code, Node.js application code, or duplicated application implementation.

Application source belongs to the corresponding Git submodule repositories.

The orchestration repository owns only orchestration-related configuration.

---

## Repository Role

The repository coordinates the eSIM Market application stack using Docker Compose.

The primary orchestration file is:

```text
docker-compose.yaml
```

The current first-stage objective is to run the `esim-market-ui` service from the existing UI Git submodule.

The backend submodule may exist in the repository, but backend services must not be added to the Compose stack unless explicitly requested later.

---

## Expected Repository Structure

The working tree is expected to resemble:

```text
esim-market/
├── AGENTS.md
├── README.md
├── .gitmodules
├── docker-compose.yaml
│
├── esim-market-ui/          # existing Git submodule
│   ├── .dockerignore
│   ├── Dockerfiles/
│   │   └── esim-market-ui
│   ├── nginx/
│   ├── frontend/
│   │   ├── node_modules/
│   │   ├── dist/
│   │   └── ...
│   └── ...
│
└── esim-market-backend/     # existing Git submodule
    └── ...
```

The application directories above are Git submodules and must not be treated as source owned by this orchestration repository.

Do not copy frontend or backend source into this repository.

Do not generate Python or React source files here.

---

## Git Submodule Boundaries

The Git submodules are already configured.

Expected submodules:

```text
./esim-market-ui
./esim-market-backend
```

Do not recreate, replace, or reconfigure the submodules unless explicitly instructed.

Do not:

- copy code out of either submodule,
- vendor submodule code into the orchestration repository,
- modify application source inside either submodule,
- replace a submodule with a normal directory,
- initialize a new React or Python project in this repository.

The purpose of this section is to define ownership boundaries, not to perform submodule setup.

---

## Allowed Orchestration-Owned Files

The principal runtime configuration file is:

```text
docker-compose.yaml
```

Repository metadata and documentation are also allowed:

```text
AGENTS.md
README.md
.gitmodules
.gitignore
```

The intent is:

> No application source code belongs in this repository.

---

## Docker Compose File

Create or maintain exactly:

```text
./docker-compose.yaml
```

Use the modern Docker Compose Specification.

Do not create:

```text
docker-compose.yml
compose.yaml
compose.yml
```

unless explicitly requested.

Do not add the legacy top-level Compose `version:` property.

---

## Initial Compose Scope

For this stage, define a single application service:

```text
esim-market-ui
```

Do not add backend, database, Redis, message-broker, reverse-proxy, observability, or other services yet.

The Compose project must remain intentionally small.

---

## UI Docker Build Configuration

The UI image must be built from the `esim-market-ui` Git submodule.

Use the UI submodule root as the Docker build context:

```yaml
build:
  context: ./esim-market-ui
```

Do not use:

```yaml
build:
  context: ./esim-market-ui/Dockerfiles
```

because the Dockerfile may need to copy sibling paths such as:

```text
frontend/
nginx/
```

Docker cannot copy files from outside its configured build context.

The intended Dockerfile is:

```text
./esim-market-ui/Dockerfiles/esim-market-ui
```

Configure Compose approximately as:

```yaml
build:
  context: ./esim-market-ui
  dockerfile: Dockerfiles/esim-market-ui
```

Before writing the final Compose file, inspect the existing UI submodule and confirm the Dockerfile path actually exists.

If the existing repository layout differs, report the conflict instead of silently renaming files.

---

## UI Image Name

Tag the locally built image explicitly:

```yaml
image: esim-market-ui:local
```

Do not use an implicit `latest` tag.

---

## UI Port Mapping

The nginx container serves HTTP internally on:

```text
80
```

For local development/orchestration, publish it on Windows host port:

```text
5001
```

Use:

```yaml
ports:
  - "5001:80"
```

Expected browser URL:

```text
http://localhost:5001
```

The intended mapping is:

```text
Windows host :5001
        ↓
container :80
```

Do not change nginx's internal port to `5001`.

---

## Docker Network

Define one explicit project bridge network:

```yaml
networks:
  esim-market-network:
    driver: bridge
```

Attach `esim-market-ui` to it:

```yaml
services:
  esim-market-ui:
    networks:
      - esim-market-network
```

This network is intended primarily for communication between eSIM Market containers.

Docker Compose would create a bridge network automatically even without this declaration, but this project intentionally defines an explicit project network for clarity and for future backend-service communication.

### Communication with the Windows 11 Host

A Docker bridge network does **not** require a special volume or host network mode to access services running on the Windows host.

When Docker Desktop is used on Windows, containers should address host services using:

```text
host.docker.internal
```

Do not use:

```text
localhost
127.0.0.1
```

from inside the container when the intended destination is the Windows host, because those addresses refer to the container itself.

Do not use:

```yaml
network_mode: host
```

for this project.

If a future Docker/WSL environment does not resolve `host.docker.internal`, add an explicit host-gateway mapping only when required:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

Do not add `extra_hosts` preemptively if Docker Desktop already provides the hostname.

---

## Volumes

Do not create a Docker Compose volume for:

```text
node_modules
```

in the current Compose configuration.

The `esim-market-ui` service is a production-style multi-stage image:

```text
Node/Vite build stage
        ↓
static dist files
        ↓
nginx runtime stage
```

The final nginx container does not run Node.js and does not require `node_modules`.

Therefore, do not add:

```yaml
volumes:
  - node_modules:/app/node_modules
```

and do not add a named `node_modules` volume.

A `node_modules` volume would only become relevant for a separate containerized **Vite development service** that bind-mounts frontend source code into a Node.js container.

That development-container pattern is outside the scope of the current production-style orchestration.

Do not add source-code bind mounts in this stage.

---

## Docker Build Caching

Do not attempt to reuse host `frontend/node_modules` by mounting it into Docker Compose.

Docker Compose runtime volumes do not participate in `docker compose build`.

The UI Dockerfile should rely on:

1. normal Docker layer caching, and
2. BuildKit npm cache where already supported by the UI Dockerfile.

A preferred UI build pattern is:

```dockerfile
# syntax=docker/dockerfile:1

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY frontend/ ./

RUN npm run build
```

Do not modify the UI Dockerfile from this orchestration repository unless explicitly instructed.

---

## `.dockerignore` Expectations for the UI Submodule

Because the Docker build context is:

```text
./esim-market-ui
```

the `.dockerignore` file should live at:

```text
./esim-market-ui/.dockerignore
```

The following rules are appropriate for the current UI directory structure:

```dockerignore
.git
.gitignore

frontend/node_modules
frontend/dist

**/npm-debug.log*
**/yarn-debug.log*
**/yarn-error.log*
**/pnpm-debug.log*

.DS_Store
Thumbs.db
```

The following broader forms are also valid:

```dockerignore
**/frontend/node_modules
**/frontend/dist
**/npm-debug.log*
```

but they are not required for the current layout because `.dockerignore` patterns are evaluated relative to the build-context root.

Prefer the simpler explicit rules:

```dockerignore
frontend/node_modules
frontend/dist
```

unless the repository intentionally contains multiple nested `frontend/` directories.

Do not include host `node_modules` in the Docker build context.

Do not modify `.dockerignore` from this orchestration task unless explicitly instructed; this section documents the expected UI-repository behavior.

---

## Restart Policy

Do not configure an automatic restart policy.

Do not add:

```yaml
restart: unless-stopped
```

or:

```yaml
restart: always
```

The developer will manually control the lifecycle using Docker Compose.

Start manually with:

```bash
docker compose up
```

or:

```bash
docker compose up -d
```

Stop with:

```bash
docker compose down
```

---

## Container Name

Do not set a fixed `container_name`.

Allow Docker Compose to generate the container name.

This preserves normal Compose project isolation and future scaling behavior.

---

## Environment Variables

Do not introduce application environment variables unless they are actually required.

Do not hardcode:

- secrets,
- API tokens,
- passwords,
- private keys,
- credentials.

Do not create `.env` files containing secrets.

---

## Health Check

A health check is optional for this first stage.

Do not modify the UI image or install extra packages solely to support a Compose health check.

Do not invent an HTTP health endpoint that the UI image does not provide.

---

## Docker Compose Example Shape

The resulting Compose file should be conceptually similar to:

```yaml
services:
  esim-market-ui:
    image: esim-market-ui:local

    build:
      context: ./esim-market-ui
      dockerfile: Dockerfiles/esim-market-ui

    ports:
      - "5001:80"

    networks:
      - esim-market-network

networks:
  esim-market-network:
    driver: bridge
```

This is a structural example.

Inspect the actual repository before writing the final file.

---

## Commands That Must Work

From the orchestration repository root:

Validate:

```bash
docker compose config
```

Build:

```bash
docker compose build esim-market-ui
```

Start in foreground:

```bash
docker compose up
```

or detached:

```bash
docker compose up -d
```

Inspect:

```bash
docker compose ps
```

The UI should be reachable at:

```text
http://localhost:5001
```

Stop:

```bash
docker compose down
```

---

## Validation Requirements

Before considering the task complete, perform these checks where the environment permits them.

### Repository inspection

Confirm:

1. `esim-market-ui` exists as the expected Git submodule.
2. `esim-market-backend` exists as the expected Git submodule.
3. the UI Dockerfile exists.
4. the Docker build context allows all Dockerfile `COPY` operations.
5. host `frontend/node_modules` is excluded from the Docker build context.
6. host `frontend/dist` is excluded from the Docker build context.

### Compose validation

Run:

```bash
docker compose config
```

The command must succeed.

### Build validation

Run:

```bash
docker compose build esim-market-ui
```

The command must succeed if Docker is available and required upstream images are available.

### Runtime validation

Run:

```bash
docker compose up -d
```

Then:

```bash
docker compose ps
```

If HTTP testing is possible, verify:

```text
http://localhost:5001
```

serves the UI.

Then clean up:

```bash
docker compose down
```

Do not claim a validation succeeded unless it was actually executed successfully.

---

## Scope Boundaries

Do not create or modify application implementation as part of this task.

Specifically, do not create:

- `.py` files,
- Python packages,
- `requirements.txt`,
- `pyproject.toml`,
- `.js`, `.jsx`, `.ts`, or `.tsx` application source,
- React components,
- Vite configuration,
- npm manifests,
- backend API code,
- nginx application configuration inside this orchestration repository,
- Kubernetes manifests,
- Helm charts,
- Terraform,
- CI/CD workflows,
- GitHub Actions.

Do not modify files inside:

```text
./esim-market-ui
./esim-market-backend
```

unless explicitly instructed.

---

## Design Principles

Keep orchestration:

- minimal,
- explicit,
- reproducible,
- easy to understand,
- free of duplicated application code,
- independent from developer-specific absolute paths.

Use relative repository paths.

Do not use Windows-specific filesystem paths.

Do not use WSL-specific absolute filesystem paths.

Do not use paths such as:

```text
C:\...
/home/<user>/...
/mnt/c/...
```

The Compose file must work from the cloned repository root.

---

## Completion Report

After implementation, report:

1. files created,
2. files modified,
3. detected Git submodules,
4. actual UI Dockerfile path used,
5. Docker build context used,
6. image tag used,
7. port mapping used,
8. network configuration used,
9. confirmation that no `node_modules` volume was added,
10. confirmation that UI `node_modules` and `dist` are excluded from the Docker build context,
11. result of `docker compose config`,
12. result of `docker compose build esim-market-ui`, if executed,
13. result of `docker compose up -d`, if executed,
14. result of HTTP validation on `http://localhost:5001`, if executed,
15. any deviations, blockers, or repository-layout conflicts.

Do not claim a command succeeded unless it was actually executed.
