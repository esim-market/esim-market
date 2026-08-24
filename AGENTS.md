# AGENTS.md — eSIM Market Orchestration Repository

## Bootstraping / Initializing

### Purpose

This repository is the **orchestration repository** for the eSIM Market project.

Its responsibility is to compose and run the independently developed eSIM Market application components.

It must **not** contain frontend application source code, backend application source code, Python packages, React source code, Node.js application code, or duplicated application implementation.

Application source belongs to the corresponding Git submodule repositories.

The orchestration repository owns only orchestration-related configuration.

---

### Repository Role

The repository coordinates the eSIM Market application stack using Docker Compose.

The primary orchestration file is:

```text
docker-compose.yaml
```

The current first-stage objective is to run the `esim-market-ui` service from the existing UI Git submodule.

The backend submodule may exist in the repository, but backend services must not be added to the Compose stack unless explicitly requested later.

---

### Expected Repository Structure

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

### Git Submodule Boundaries

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

### Allowed Orchestration-Owned Files

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

### Docker Compose File

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

### Initial Compose Scope

For this stage, define a single application service:

```text
esim-market-ui
```

Do not add backend, database, Redis, message-broker, reverse-proxy, observability, or other services yet.

The Compose project must remain intentionally small.

---

### UI Docker Build Configuration

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

### UI Image Name

Tag the locally built image explicitly:

```yaml
image: esim-market-ui:local
```

Do not use an implicit `latest` tag.

---

### UI Port Mapping

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

### Docker Network

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

#### Communication with the Windows 11 Host

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

### Volumes

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

### Docker Build Caching

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

### `.dockerignore` Expectations for the UI Submodule

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

### Restart Policy

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

### Container Name

Do not set a fixed `container_name`.

Allow Docker Compose to generate the container name.

This preserves normal Compose project isolation and future scaling behavior.

---

### Environment Variables

Do not introduce application environment variables unless they are actually required.

Do not hardcode:

- secrets,
- API tokens,
- passwords,
- private keys,
- credentials.

Do not create `.env` files containing secrets.

---

### Health Check

A health check is optional for this first stage.

Do not modify the UI image or install extra packages solely to support a Compose health check.

Do not invent an HTTP health endpoint that the UI image does not provide.

---

### Docker Compose Example Shape

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

### Commands That Must Work

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

### Validation Requirements

Before considering the task complete, perform these checks where the environment permits them.

#### Repository inspection

Confirm:

1. `esim-market-ui` exists as the expected Git submodule.
2. `esim-market-backend` exists as the expected Git submodule.
3. the UI Dockerfile exists.
4. the Docker build context allows all Dockerfile `COPY` operations.
5. host `frontend/node_modules` is excluded from the Docker build context.
6. host `frontend/dist` is excluded from the Docker build context.

#### Compose validation

Run:

```bash
docker compose config
```

The command must succeed.

#### Build validation

Run:

```bash
docker compose build esim-market-ui
```

The command must succeed if Docker is available and required upstream images are available.

#### Runtime validation

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

### Scope Boundaries

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

### Design Principles

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

### Completion Report

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

---

## Complex Tuning

### Add Backend API and Task-Manager Services

Extend `docker-compose.yaml` so the orchestration stack contains three application services:

```text
esim-market-ui
esim-market-backend-api
esim-market-backend-job
```

The backend services must be built from the existing `./esim-market-backend` Git submodule.

Do not duplicate backend source into the orchestration repository.

### Backend API Service

Add a Compose service named:

```text
esim-market-backend-api
```

Build it from:

```yaml
build:
  context: ./esim-market-backend
  dockerfile: Dockerfiles/esim-market-backend-api
```

Use:

```yaml
image: esim-market-backend-api:local
```

Publish:

```text
host:5002 -> container:8080
```

using:

```yaml
ports:
  - "5002:8080"
```

Attach it to:

```text
esim-market-network
```

### FastAPI Development Reload

The backend API Dockerfile uses:

```dockerfile
ENTRYPOINT ["uvicorn"]
```

Therefore Compose `command:` must provide only Uvicorn arguments.

Use:

```yaml
command:
  [
    "backend.gate.integration.main:app",
    "--reload",
    "--reload-delay",
    "3",
    "--host",
    "0.0.0.0",
    "--port",
    "8080"
  ]
```

Do not escape the colon in:

```text
backend.gate.integration.main:app
```

A quoted YAML string does not require `\:`.

### Source Bind Mount Required for Reload

`--reload` can only react to source changes that are visible inside the running container.

A Dockerfile `COPY` happens only during image build and does not propagate later host changes.

Therefore, for local development, bind-mount the backend source into the Python package path used by the API container.

Preferred container layout:

```text
/home/backend/
└── backend/
    ├── common/
    ├── repository/
    ├── usecase/
    └── gate/
```

With that layout:

```yaml
volumes:
  - ./esim-market-backend/backend:/home/backend/backend
```

Before applying the mount, inspect the actual backend API Dockerfile and confirm that:

```text
backend.gate.integration.main:app
```

is importable with the selected `WORKDIR` and `PYTHONPATH`.

If the Dockerfile currently copies the *contents* of `./backend` directly into `/home/backend` instead of preserving `/home/backend/backend`, report that package-layout conflict and fix it in the backend repository rather than inventing an inconsistent Compose mount.

Do not mount host `.venv`, `__pycache__`, or Python site-packages into the container.

### Backend Job / Task-Manager Service

Add:

```text
esim-market-backend-job
```

Build it from:

```yaml
build:
  context: ./esim-market-backend
  dockerfile: Dockerfiles/esim-market-backend-job
```

Use:

```yaml
image: esim-market-backend-job:local
```

The job image uses:

```dockerfile
ENTRYPOINT ["dumb-init", "--"]
```

Preserve that entrypoint and use the image's default `CMD` unless the existing Dockerfile requires an explicit task-manager module command.

Do not run Uvicorn from the job image.

The job service does not require a published host port.

Attach it to:

```text
esim-market-network
```

### Backend Job Source Mount

The task-manager may use the same source bind mount for local development:

```yaml
volumes:
  - ./esim-market-backend/backend:/home/backend/backend
```

However, a plain Python process does not automatically restart when source files change.

Do not claim the job has hot reload merely because source files are bind-mounted.

For now:

- keep the job long-running,
- keep `dumb-init` as PID 1,
- restart the job container manually after source changes,
- do not introduce `watchfiles`, `watchdog`, or another job reloader unless explicitly requested later.

### MongoDB Service

Add a Compose service named:

```text
esim-market-mongodb
```

Use exactly:

```yaml
image: mongodb/mongodb-community-server:8.3-ubi8-slim
```

Requirements:

- attach it to `esim-market-network`,
- persist `/data/db` in a named Compose volume,
- configure the initial database name through environment interpolation,
- provide a lightweight MongoDB ping health check,
- do not hardcode MongoDB credentials,
- do not publish the MongoDB port to the host unless explicitly required.

Backend containers must address MongoDB by the Compose service name `esim-market-mongodb`, never `localhost`.

### Redis Service

Add a Compose service named:

```text
esim-market-redis
```

Use the latest maintained Bitnami Redis image:

```yaml
image: bitnami/redis:latest
```

Requirements:

- attach it to `esim-market-network`,
- persist `/bitnami/redis/data` in a named Compose volume,
- support a password supplied through environment interpolation,
- allow an empty password only as the explicit local-development default,
- provide a lightweight Redis ping health check,
- do not hardcode Redis credentials,
- do not publish the Redis port to the host unless explicitly required.

Backend containers must address Redis by the Compose service name `esim-market-redis`, never `localhost`.

Both backend services must wait for healthy MongoDB and Redis services before starting. Define both named data volumes at the top level of `docker-compose.yaml`.

### Backend Environment Configuration

The API and job require MongoDB and Redis configuration.

Do not hardcode credentials in `docker-compose.yaml`.

Use environment-variable interpolation and/or a developer `.env` file excluded from Git.

The services must support the backend's flat MongoDB settings:

```text
DEBUG
MONGO_DSN
MONGO_ENDPOINT
MONGO_DB_NAME
MONGO_USER
MONGO_PASS
MONGO_REPL
```

`MONGO_ENDPOINT`, `MONGO_USER`, and `MONGO_PASS` are required. `MONGO_DB_NAME`
defaults to `UK1648`, while `MONGO_DSN` and `MONGO_REPL` are optional. If
`MONGO_DSN` is omitted, the backend constructs it from the separate endpoint,
database, credentials, and optional replica-set settings. If supplied, the backend
uses `MONGO_DSN` unchanged.

For Docker Compose, set `MONGO_ENDPOINT` to the MongoDB service name and port, for
example `esim-market-mongodb:27017`. Do not use `localhost` for container-to-container
MongoDB traffic.

The services must support the backend Redis settings, including:

```text
REDIS_CORE_CLUSTER_CONFIG__HOST
REDIS_CORE_CLUSTER_CONFIG__PORT
REDIS_CORE_CLUSTER_CONFIG__PASSWORD
REDIS_CORE_CLUSTER_CONFIG__CONNECTION_POOL_MAX_CONNECTIONS
REDIS_CORE_CLUSTER_CONFIG__KIND
```

For local Docker Compose, Redis mode should normally be:

```text
STAND_ALONE
```

Do not place real secrets in `AGENTS.md` or committed Compose files.

### Service Networking

Attach all application services to:

```text
esim-market-network
```

This includes:

```text
esim-market-ui
esim-market-backend-api
esim-market-backend-job
```

Future Redis and MongoDB services should use the same network when added.

Containers must address other Compose services by service name, not `localhost`.

Use `host.docker.internal` only when a container intentionally needs to reach a service running on the Windows 11 host.

### Updated Compose Shape

The Compose file should be structurally similar to:

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

  esim-market-backend-api:
    image: esim-market-backend-api:local
    build:
      context: ./esim-market-backend
      dockerfile: Dockerfiles/esim-market-backend-api
    command:
      [
        "backend.gate.integration.main:app",
        "--reload",
        "--reload-delay",
        "3",
        "--host",
        "0.0.0.0",
        "--port",
        "8080"
      ]
    ports:
      - "5002:8080"
    volumes:
      - ./esim-market-backend/backend:/home/backend/backend
    networks:
      - esim-market-network

  esim-market-backend-job:
    image: esim-market-backend-job:local
    build:
      context: ./esim-market-backend
      dockerfile: Dockerfiles/esim-market-backend-job
    volumes:
      - ./esim-market-backend/backend:/home/backend/backend
    networks:
      - esim-market-network

networks:
  esim-market-network:
    driver: bridge
```

This is a structural template.

Before writing the actual Compose file, inspect both backend Dockerfiles and confirm:

```text
WORKDIR
PYTHONPATH
COPY targets
ENTRYPOINT
CMD
```

match the mount paths and module command.

### Validation

Run:

```bash
docker compose config
```

Then:

```bash
docker compose build \
  esim-market-ui \
  esim-market-backend-api \
  esim-market-backend-job
```

Start:

```bash
docker compose up -d
```

Inspect:

```bash
docker compose ps
```

Verify API liveness:

```text
http://localhost:5002/health/live
```

If MongoDB and Redis are configured and reachable, verify readiness:

```text
http://localhost:5002/health/ready
```

Verify reload:

1. keep `esim-market-backend-api` running,
2. modify a Python source file under `./esim-market-backend/backend/`,
3. run:

```bash
docker compose logs -f esim-market-backend-api
```

4. confirm Uvicorn detects the source change and reloads after the configured delay.

Do not claim reload works unless it is actually tested.

For the task manager:

```bash
docker compose logs -f esim-market-backend-job
```

confirm the long-running job starts and remains running.

Stop with:

```bash
docker compose down
```

---

## Integrating the API SDK with esim connect

**SKIP THIS SECTION FOR NOW.**

This section is intentionally reserved for future work.

Do not infer or implement complex tuning during bootstrap.
