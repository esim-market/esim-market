# AGENTS.md — eSIM Market Multi-Repository Workspace

This is the consolidated instruction source for the complete eSIM Market workspace.
It preserves the distinct ownership and implementation flow of all three Git repositories:

- **Orchestration repository (`./`)** owns Docker Compose, cross-service networking, runtime configuration, and workspace-level documentation.
- **Backend repository (`./esim-market-backend`)** owns the Python API, task manager, persistence integrations, backend Docker images, and backend implementation.
- **UI repository (`./esim-market-ui`)** owns the React/Vite application, nginx runtime, UI Docker image, and frontend implementation.

Apply the subsection matching the repository and phase being changed. Cross-repository work must respect every affected repository flow and must not move application source across repository boundaries.

During review, the two subrepository `AGENTS.md` files remain in place as verified legacy copies. After explicit approval removes them, this root file becomes the single authoritative `AGENTS.md` for the entire workspace.

## Bootstraping / Initializing

### Orchestration repository flow (`./`)

#### Purpose

This repository is the **orchestration repository** for the eSIM Market project.

Its responsibility is to compose and run the independently developed eSIM Market application components.

It must **not** contain frontend application source code, backend application source code, Python packages, React source code, Node.js application code, or duplicated application implementation.

Application source belongs to the corresponding Git submodule repositories.

The orchestration repository owns only orchestration-related configuration.

---

#### Repository Role

The repository coordinates the eSIM Market application stack using Docker Compose.

The primary orchestration file is:

```text
docker-compose.yaml
```

The current first-stage objective is to run the `esim-market-ui` service from the existing UI Git submodule.

The backend submodule may exist in the repository, but backend services must not be added to the Compose stack unless explicitly requested later.

---

#### Expected Repository Structure

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

#### Git Submodule Boundaries

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

#### Allowed Orchestration-Owned Files

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

#### Docker Compose File

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

#### Initial Compose Scope

For this stage, define a single application service:

```text
esim-market-ui
```

Do not add backend, database, Redis, message-broker, reverse-proxy, observability, or other services yet.

The Compose project must remain intentionally small.

---

#### UI Docker Build Configuration

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

#### UI Image Name

Tag the locally built image explicitly:

```yaml
image: esim-market-ui:local
```

Do not use an implicit `latest` tag.

---

#### UI Port Mapping

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

#### Docker Network

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

##### Communication with the Windows 11 Host

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

#### Volumes

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

#### Docker Build Caching

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

#### `.dockerignore` Expectations for the UI Submodule

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

#### Restart Policy

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

#### Container Name

Do not set a fixed `container_name`.

Allow Docker Compose to generate the container name.

This preserves normal Compose project isolation and future scaling behavior.

---

#### Environment Variables

Do not introduce application environment variables unless they are actually required.

Do not hardcode:

- secrets,
- API tokens,
- passwords,
- private keys,
- credentials.

Do not create `.env` files containing secrets.

---

#### Health Check

A health check is optional for this first stage.

Do not modify the UI image or install extra packages solely to support a Compose health check.

Do not invent an HTTP health endpoint that the UI image does not provide.

---

#### Docker Compose Example Shape

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

#### Commands That Must Work

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

#### Validation Requirements

Before considering the task complete, perform these checks where the environment permits them.

##### Repository inspection

Confirm:

1. `esim-market-ui` exists as the expected Git submodule.
2. `esim-market-backend` exists as the expected Git submodule.
3. the UI Dockerfile exists.
4. the Docker build context allows all Dockerfile `COPY` operations.
5. host `frontend/node_modules` is excluded from the Docker build context.
6. host `frontend/dist` is excluded from the Docker build context.

##### Compose validation

Run:

```bash
docker compose config
```

The command must succeed.

##### Build validation

Run:

```bash
docker compose build esim-market-ui
```

The command must succeed if Docker is available and required upstream images are available.

##### Runtime validation

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

#### Scope Boundaries

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

#### Design Principles

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

#### Completion Report

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


### Backend repository flow (`./esim-market-backend`)

#### Purpose

This repository is `esim-market-backend`, the Python backend for the eSIM Market project.

For the current task, implement **only this first section: Bootstraping / Initializing**.

The bootstrap must establish:

- a FastAPI REST API process,
- an asyncio-based long-running job process,
- MongoDB integration through Beanie ODM,
- Redis integration supporting standalone and Sentinel deployments,
- reusable startup/shutdown resource mixins,
- shared stdout/stderr/rolling-file logging,
- clean architecture boundaries,
- repository factory abstractions for eSIM sellers,
- liveness/readiness endpoints suitable for Kubernetes,
- self-hosted Swagger UI and ReDoc assets,
- two independent Docker images,
- two independent dependency manifests.

Do not implement the later sections of this document.

---

#### Required Repository Structure

The repository must follow this structure:

```text
esim-market-backend/
├── AGENTS.md
├── README.md
├── .gitignore
├── .dockerignore
├── Dockerfiles/
│   ├── esim-market-backend-api
│   └── esim-market-backend-job
├── requirements-api.txt
├── requirements-job.txt
└── backend/
    ├── __init__.py
    ├── common/
    │   ├── logging/
    │   │   ├── __init__.py
    │   │   ├── logger_factory.py
    │   │   └── logging_config.py
    │   ├── env/
    │   │   ├── settings.py
    │   │   └── redis_env_settings.py
    │   └── entity/
    │       ├── db/
    │       └── domain/
    ├── usecase/
    │   ├── usecase_base.py
    │   └── ...
    ├── repository/
    │   ├── seller/
    │   │   ├── esim_seller_repository_base.py
    │   │   ├── esim_connect_repository.py
    │   │   ├── esim_xyz_repository.py
    │   │   └── repository_factory.py
    │   ├── mongodb/
    │   ├── http/
    │   └── redis/
    │       ├── __init__.py
    │       ├── entity.py
    │       ├── redis_base_repository.py
    │       ├── redis_repository_factory.py
    │       ├── redis_sentinel_repository.py
    │       ├── redis_standalone_repository.py
    │       ├── history_repository_mixin.py
    │       └── utils.py
    ├── gate/
    │   ├── integration/
    │   │   ├── api_app_base.py
    │   │   ├── mongodb_lifecycle_mixin.py
    │   │   ├── redis_lifecycle_mixin.py
    │   │   ├── health_router.py
    │   │   ├── main.py
    │   │   └── routes/
    │   └── taskmanager/
    │       ├── async_disposable.py
    │       ├── job_base.py
    │       ├── mongodb_lifecycle_mixin.py
    │       ├── redis_lifecycle_mixin.py
    │       ├── dummy_long_running_job.py
    │       └── main.py
    └── static/
        ├── swagger-ui-bundle.js
        ├── swagger-ui.css
        ├── redoc.standalone.js
        └── favicon.ico
```

If `Dockerfiles/` already exists, modify it in place.

The only dependency files must be:

```text
./requirements-api.txt
./requirements-job.txt
```

---

#### Python Runtime

Both Dockerfiles must begin with:

```dockerfile
FROM python:3.12.14-slim-trixie
```

Do not silently replace that image.

---

#### Pydantic Policy

Use **Pydantic 2.x only**.

At implementation time, resolve the latest stable Pydantic 2.x release compatible with the selected FastAPI, Beanie and `pydantic-settings` versions.

Do not install Pydantic 1.x.

Prefer Pydantic v2 APIs such as:

```text
model_validate
model_dump
model_dump_json
field_validator
model_validator
ConfigDict
SettingsConfigDict
```

Pin exact resolved versions in the final requirements files.

---

#### Clean Architecture

Apply clean-code and clean-architecture principles.

Framework/process-specific code belongs at the gates.

Business logic belongs under:

```text
backend/usecase/
```

External-system implementations belong under:

```text
backend/repository/
```

Configuration and entities belong under:

```text
backend/common/
```

Do not put business logic inside route handlers, startup code, Redis repositories or job bootstrapping.

Use explicit dependencies and type hints.

---

#### Usecase Base

Create:

```text
backend/usecase/usecase_base.py
```

with an abstract:

```text
UsecaseBase
```

Every concrete use case must inherit from it.

Use a minimal asynchronous execution contract such as:

```python
from abc import ABC, abstractmethod

class UsecaseBase(ABC):
    @abstractmethod
    async def execute(self, *args, **kwargs):
        ...
```

Do not couple `UsecaseBase` to FastAPI, Redis, MongoDB or Uvicorn.

---

#### eSIM Seller Repository Abstraction

Create:

```text
backend/repository/seller/
```

Create abstract:

```text
EsimSellerRepositoryBase
```

with exactly these bootstrap operations:

```python
@abstractmethod
async def list_products(...):
    ...

@abstractmethod
async def place_order(...):
    ...
```

Use typed arguments and project-owned return models.

Do not expose raw `httpx.Response` objects to use cases.

---

#### Seller Implementations

Create:

```text
EsimConnectRepository
EsimXYZRepository
```

Both inherit from `EsimSellerRepositoryBase`.

For bootstrap, these may be minimal adapters/stubs.

Do not invent undocumented seller API endpoints.

Actual eSIM Connect SDK integration belongs to Section 3.

---

#### Seller RepositoryFactory

Create:

```text
backend/repository/seller/repository_factory.py
```

with:

```text
RepositoryFactory
```

Its instance `create()` method must accept an already-created `httpx.AsyncClient`.

Preferred shape:

```python
class RepositoryFactory:
    def create(
        self,
        seller: EsimSellerType,
        http_client: httpx.AsyncClient,
    ) -> EsimSellerRepositoryBase:
        ...
```

Use a typed seller Enum and mapping-based registration.

Do not create a new HTTP client per repository operation.

---

#### MongoDB / Beanie

Use:

```python
from beanie import init_beanie
from pymongo import AsyncMongoClient
```

Create one Mongo client per process lifecycle.

Initialize Beanie once.

Keep Beanie `Document` classes under:

```text
backend/common/entity/db/
```

Keep pure domain models under:

```text
backend/common/entity/domain/
```

Define `MongoSettings` with flat, environment-backed properties:

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
defaults to `UK1648`, while `MONGO_DSN` and `MONGO_REPL` are optional.

When `MONGO_DSN` is absent, derive it after settings validation from the endpoint,
database, credentials, and optional replica-set name. When `MONGO_DSN` is supplied,
use it unchanged. Keep `AppSettings` independent so it does not instantiate required
MongoDB settings during module import.

---

#### MongoDB Lifecycle Mixin

Create reusable MongoDB lifecycle mixins for both API and taskmanager.

Responsibilities:

- load settings,
- create `AsyncMongoClient` with `MONGO_DSN`,
- initialize Beanie with `MONGO_DB_NAME`,
- expose/store the client,
- close resources on shutdown/disposal.

For FastAPI expose the client on:

```python
app.state.mongodb_client
```

or a similarly stable state field.

Do not duplicate Mongo startup logic.

---

#### Redis Dependencies

Both API and job runtimes must include Redis.

Use the current stable `redis` PyPI package and `redis.asyncio`.

Support:

```text
STAND_ALONE
SENTINEL
```

Standalone is primarily for local Docker Compose.

Sentinel is primarily for Kubernetes.

---

#### Supplied Redis Repository Code

Integrate the supplied Redis repository code under:

```text
backend/repository/redis/
```

Preserve the intended types:

- `RedisBaseRepository`
- `RedisStandAloneRepository`
- `RedisSentinelRepository`
- `RedisRepositoryFactory`
- `RedisSentinelConnectionModel`

Preserve the mapping-based factory behavior for standalone and Sentinel repositories.

Do not blindly copy legacy imports that reference unrelated LLM/RAG project modules.

Adapt the supplied code so it compiles in this repository.

The supplied `HistoryRepositoryMixin` contains LLM/RAG-specific imports; refactor it to an eSIM-neutral form or omit it from inheritance until a real use case requires it.

Do not invent LLM/RAG classes merely to satisfy old imports.

---

#### Redis Environment Settings

Place the supplied Redis environment model under:

```text
backend/common/env/redis_env_settings.py
```

Use Pydantic v2 and `pydantic-settings`.

Preserve the discriminated standalone/Sentinel configuration approach.

Support environment variables in this form:

```text
REDIS_CORE_CLUSTER_CONFIG__HOST=esim_market_redis
REDIS_CORE_CLUSTER_CONFIG__PORT=6379
REDIS_CORE_CLUSTER_CONFIG__PASSWORD=<secret>
REDIS_CORE_CLUSTER_CONFIG__CONNECTION_POOL_MAX_CONNECTIONS=100
REDIS_CORE_CLUSTER_CONFIG__KIND=STAND_ALONE
```

Do not hardcode the real Redis password in source, Dockerfiles, tests or committed env files.

---

#### Redis Connection Construction

For `STAND_ALONE`, create an async Redis client/pool using configured:

- host,
- port,
- password,
- DB index,
- decode responses,
- max connections,
- socket timeout,
- socket connect timeout.

For `SENTINEL`, create async Sentinel connections suitable for Kubernetes.

Resolve master and replica/slave connections and wrap them in:

```text
RedisSentinelConnectionModel
```

Use the configured master alias.

---

#### Redis Lifecycle Mixin

Create reusable Redis lifecycle mixins for API and taskmanager.

Responsibilities:

```text
startup / enter
  ├── load Redis settings
  ├── create standalone OR Sentinel connection
  ├── create RedisRepositoryFactory
  ├── create selected repository
  └── expose resources
```

and:

```text
shutdown / exit
  └── close Redis resources
```

For FastAPI expose:

```python
app.state.redis_connection
app.state.redis_repository_factory
app.state.redis_repository
```

Do not create a Redis connection per request.

---

#### FastAPI Lifecycle

Use FastAPI async `lifespan`.

Do not use deprecated:

```python
@app.on_event("startup")
@app.on_event("shutdown")
```

Initialize both MongoDB/Beanie and Redis during lifespan startup and clean both up during shutdown.

Use reusable lifecycle mixins rather than embedding all resource code in `main.py`.

---

#### ApiAppBase

Create:

```text
backend/gate/integration/api_app_base.py
```

with:

```text
ApiAppBase
```

It centralizes:

- FastAPI construction,
- lifespan,
- MongoDB/Beanie lifecycle,
- Redis lifecycle,
- self-hosted docs,
- root-path support,
- static files,
- router registration.

Do not put eSIM business logic in it.

---

#### Unhandled Exception Middleware

Create and register:

```text
backend/gate/integration/unhandled_exception_middleware.py
```

with:

```text
UnhandledExceptionMiddleware
```

`ApiAppBase` must add this middleware to every FastAPI application it creates.

The middleware must:

- catch only unexpected request-processing exceptions,
- log the original exception and stack trace through the shared server-side logging facility,
- return a stable, sanitized JSON error envelope containing a project-owned application error code and request/correlation ID,
- avoid returning HTTP status `500`; use the project's designated non-500 unhandled-error status,
- never expose exception messages, exception types, stack traces, credentials, connection strings, source paths, or other system details to clients,
- preserve framework responses for expected errors such as validation failures and explicit `HTTPException` responses,
- avoid intercepting process-control exceptions such as cancellation,
- re-raise if an HTTP response has already started and can no longer be safely replaced.

The initial bootstrap contract is:

```json
{
  "error": {
    "code": "ESIM-UNHANDLED-001",
    "message": "An unexpected error occurred.",
    "request_id": "<opaque-correlation-id>"
  }
}
```

with HTTP status `520` and a matching `X-Request-ID` response header.

Do not use this middleware to hide expected domain errors. Expected errors must be mapped explicitly by their owning gate or use case.

---

#### Liveness and Readiness

Create:

```text
backend/gate/integration/health_router.py
```

with endpoints:

```text
GET /health/live
GET /health/ready
```

`/health/live` only indicates process/event-loop liveness and must not fail just because MongoDB or Redis is temporarily unavailable.

`/health/ready` verifies required dependencies, at minimum:

```text
MongoDB
Redis
```

Use lightweight ping operations.

Return HTTP 200 when ready and HTTP 503 when a required dependency is unavailable.

Do not expose credentials, connection strings or stack traces.

---

#### Self-Hosted Swagger / ReDoc

Disable FastAPI CDN-backed docs:

```python
FastAPI(
    docs_url=None,
    redoc_url=None,
    ...
)
```

Mount local assets from:

```text
backend/static/
```

Provide root-path-aware:

```text
/docs
/redoc
OAuth2 redirect
```

Vendor:

```text
swagger-ui-bundle.js
swagger-ui.css
redoc.standalone.js
favicon.ico
```

Do not require CDN access at runtime.

---

#### API Requirements

Create:

```text
requirements-api.txt
```

Pin compatible exact versions of at least:

```text
fastapi
uvicorn[standard]
pydantic 2.x
pydantic-settings
beanie
pymongo
redis
httpx
```

Add only packages actually used.

---

#### Job Requirements

Create:

```text
requirements-job.txt
```

Pin compatible exact versions of at least:

```text
pydantic 2.x
pydantic-settings
beanie
pymongo
redis
httpx
```

Do not add `asyncio`; it is part of Python.

Do not add FastAPI/Uvicorn unless actually required by the job runtime.

---

#### API Dockerfile

Create or modify exactly:

```text
Dockerfiles/esim-market-backend-api
```

Start with:

```dockerfile
FROM python:3.12.14-slim-trixie
```

Use `/home/backend` as application directory.

Copy requirements first, install them, then:

```dockerfile
COPY ./backend /home/backend
```

The Dockerfile must use:

```dockerfile
ENTRYPOINT ["uvicorn"]
```

Use `CMD` for the module and options.

Ensure the module path works with the chosen `WORKDIR`/`PYTHONPATH`.

---

#### API Reload Behavior

Development-mode FastAPI must support Uvicorn reload.

Important: `COPY ./backend /home/backend` only snapshots source at image-build time. It cannot detect later host edits.

Therefore:

- make the image compatible with `--reload`,
- production-style default execution should not require reload,
- when local Compose development is later configured, bind-mount host `./backend` into the corresponding container source path and run Uvicorn with `--reload`.

Do not claim that Docker `COPY` alone provides live reload.

Do not create Docker Compose files in this repository.

---

#### Job Dockerfile

Create or modify exactly:

```text
Dockerfiles/esim-market-backend-job
```

Start with:

```dockerfile
FROM python:3.12.14-slim-trixie
```

Install Debian `dumb-init`.

Use `/home/backend`.

Copy `requirements-job.txt`, install, then:

```dockerfile
COPY ./backend /home/backend
```

Use:

```dockerfile
ENTRYPOINT ["dumb-init", "--"]
```

Use `CMD` to execute the taskmanager through `python -m ...`.

Do not run Uvicorn from this image.

---

#### AsyncDisposable

Create project-owned:

```text
AsyncDisposable
```

Implement async context management:

```python
async def __aenter__(...)
async def __aexit__(...)
```

and an explicit async cleanup contract.

Cleanup should be idempotent where practical.

---

#### JobBase

Create abstract:

```text
JobBase
```

A concrete job must inherit from it.

`JobBase` participates in `AsyncDisposable` lifecycle and defines:

```python
@abstractmethod
async def run(self) -> None:
    ...
```

---

#### Dummy Long-Running Job

Create:

```text
backend/gate/taskmanager/dummy_long_running_job.py
```

It must:

- inherit `JobBase`,
- run continuously until cancellation/shutdown,
- avoid a busy loop,
- asynchronously sleep/wait between iterations,
- log periodically,
- respond cleanly to SIGTERM/SIGINT,
- exit its async context,
- clean up MongoDB/Redis resources.

Conceptually:

```python
while not stop_event.is_set():
    await asyncio.sleep(interval)
```

Never implement:

```python
while True:
    pass
```

---

#### Job Entrypoint

Create:

```text
backend/gate/taskmanager/main.py
```

Use one:

```python
asyncio.run(main())
```

at the synchronous process boundary.

Support graceful signal-aware shutdown.

Both MongoDB/Beanie and Redis lifecycle behavior must be available to the taskmanager.

---

#### Logging

Logging is a first-class bootstrap concern and must be reusable by both:

```text
backend/gate/integration
backend/gate/taskmanager
```

Use Python's standard:

```python
logging
```

package unless an existing project dependency already justifies another logging framework.

Do **not** add a third-party logging package merely to obtain stdout, stderr, or rolling-file support.

Create a reusable logging module under:

```text
backend/common/logging/
```

Recommended structure:

```text
backend/common/logging/
├── __init__.py
├── logger_factory.py
└── logging_config.py
```

The logging implementation must support three output channels:

```text
stdout
stderr
rolling file
```

##### stdout handler

Send normal operational logs to stdout.

Recommended levels:

```text
DEBUG
INFO
```

and optionally non-error warning-level messages according to the final handler filter design.

This is important for:

```text
Docker
Docker Compose
Kubernetes
OpenShift
```

where container runtimes collect stdout.

##### stderr handler

Send error logs to stderr.

At minimum:

```text
ERROR
CRITICAL
```

must be written to stderr.

Avoid duplicating the same ERROR/CRITICAL record to both stdout and stderr unless duplication is intentional and documented.

Use a logging `Filter` if necessary to keep stdout and stderr ranges non-overlapping.

##### Rolling file handler

Provide a rotating file logger using the Python standard-library handler:

```python
logging.handlers.RotatingFileHandler
```

or, if time-based rotation is explicitly more appropriate:

```python
logging.handlers.TimedRotatingFileHandler
```

For the bootstrap implementation, prefer size-based:

```text
RotatingFileHandler
```

with configuration controlled through environment settings.

Support at minimum:

```text
LOG_LEVEL
LOG_FILE_ENABLED
LOG_FILE_PATH
LOG_FILE_MAX_BYTES
LOG_FILE_BACKUP_COUNT
```

Use sensible development defaults, for example:

```text
LOG_LEVEL=INFO
LOG_FILE_ENABLED=false
LOG_FILE_PATH=/home/backend/logs/esim-market-backend.log
LOG_FILE_MAX_BYTES=10485760
LOG_FILE_BACKUP_COUNT=5
```

Do not hardcode production-only paths outside configuration.

Create the log directory safely when file logging is enabled.

Do not fail application startup solely because optional rolling-file logging cannot be initialized unless file logging is explicitly required.

##### Container logging policy

Container deployments should primarily rely on:

```text
stdout
stderr
```

because Kubernetes/OpenShift/Docker normally collect those streams.

Rolling-file logging is provided for:

- local development,
- standalone deployments,
- troubleshooting,
- environments where file-based logs are explicitly required.

Do not assume rolling files are durable inside Kubernetes containers.

Do not create a persistent logging volume in this repository.

Persistent log storage, if ever required, belongs to orchestration/Kubernetes configuration.

##### Shared logger factory

Create a reusable factory/helper, for example:

```python
get_logger(name: str) -> logging.Logger
```

or:

```python
LoggerFactory.create(name: str) -> logging.Logger
```

Use the same configuration for:

- FastAPI,
- Uvicorn-integrated application logs,
- MongoDB lifecycle logs,
- Redis lifecycle logs,
- repository logs,
- usecase logs,
- task-manager/job logs.

Avoid configuring handlers separately in every module.

Avoid duplicate handlers when the configuration function is called more than once.

Logging initialization must therefore be idempotent.

##### Formatting

Use a clear structured text format containing at least:

```text
timestamp
level
logger name
process id
message
```

Including thread/task context is optional.

A reasonable format is:

```text
%(asctime)s %(levelname)s %(name)s [pid=%(process)d] %(message)s
```

Do not use ANSI color codes in rolling-file output.

##### Exception logging

Use:

```python
logger.exception(...)
```

inside exception handlers when stack traces are useful.

Do not log stack traces for expected control-flow conditions.

Never log:

- Redis passwords,
- MongoDB passwords,
- seller API credentials,
- bearer tokens,
- API keys,
- complete sensitive connection URIs,
- personally sensitive request payloads.

##### Uvicorn logging

Integrate the application logging configuration cleanly with Uvicorn.

Do not allow Uvicorn to initialize a conflicting duplicate handler tree.

Preserve useful Uvicorn access/error logs.

If a custom Uvicorn `log_config` is supplied, it must remain compatible with the shared logger configuration and must not suppress application logs.

##### Job logging

The long-running dummy job must use the same logging facility.

At minimum it should log:

```text
job started
periodic heartbeat / loop activity at a reasonable interval
cancellation requested
resource cleanup
job stopped
```

Do not emit high-frequency logs on every tight-loop iteration.

---

#### `.dockerignore`

Ensure repository-root `.dockerignore` excludes:

```text
.git
.gitignore
__pycache__
**/__pycache__
*.py[cod]
.pytest_cache
.mypy_cache
.ruff_cache
.venv
venv
.env
.env.*
```

Do not exclude:

```text
backend/static/
requirements-api.txt
requirements-job.txt
Dockerfiles/
```

---

#### Bootstrap Validation

Run all feasible checks.

Python:

```bash
python -m compileall backend
```

API image:

```bash
docker build   -f Dockerfiles/esim-market-backend-api   -t esim-market-backend-api:local   .
```

Job image:

```bash
docker build   -f Dockerfiles/esim-market-backend-job   -t esim-market-backend-job:local   .
```

When dependencies are available, verify API:

```text
/health/live
/health/ready
/docs
/redoc
/openapi.json
/static/swagger-ui-bundle.js
/static/swagger-ui.css
/static/redoc.standalone.js
```

Test seller repository factory selection and reuse of the provided `httpx.AsyncClient`.

Test Redis standalone/Sentinel factory selection.

Test dummy-job start, cancellation and cleanup.

Do not claim validation succeeded unless actually executed.

---

#### Completion Report for Section 1

Report:

1. files created,
2. files modified,
3. final directory structure,
4. exact Python image,
5. exact API dependency versions,
6. exact job dependency versions,
7. exact Pydantic 2.x version,
8. MongoDB/Beanie lifecycle design,
9. Redis standalone/Sentinel lifecycle design,
10. supplied Redis files adapted,
11. legacy Redis dependencies removed/refactored,
12. seller repository factory structure,
13. liveness/readiness behavior,
14. API Docker build result,
15. job Docker build result,
16. API health/docs validation,
17. Redis validation,
18. dummy-job validation,
19. logging configuration and validation for stdout/stderr/rolling file,
20. tests executed,
21. deviations/blockers.

Do not claim success for a step that was not executed.

---


### UI repository flow (`./esim-market-ui`)

#### Purpose

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

#### Required Technology Stack

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

#### Required Repository Structure

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

##### Directory responsibilities

###### `frontend/`

Contains all React, TypeScript, Vite, npm, application source, frontend static assets, and frontend configuration.

Do not place React source files at repository root.

###### `nginx/`

Contains nginx configuration and any nginx-specific static/configuration resources.

At minimum it must contain:

```text
nginx/nginx.conf
```

###### `Dockerfiles/`

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

#### React and TypeScript Requirements

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

#### React Aria Requirements

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

#### Initial UI Requirements

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

#### HTML Requirements

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

#### Vite Requirements

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

#### Vite Development File Watching and HMR

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

#### npm Requirements

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

#### Docker Build Stage

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

#### nginx Runtime Stage

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

#### nginx Configuration File

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

#### nginx Configuration Requirements

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

#### Docker Multi-Stage Architecture

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

#### Do not leave the image with root user
Switch user to non-root existsing one such as nginx or 1001
Due to most of vulnerability scan tools has issue about root startup of a docker image. 

#### Container Port and Host Development Port

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

#### Docker Build Command

The implementation must be buildable from repository root using:

```bash
docker build \
  -f ./Dockerfiles/esim-market-ui \
  -t esim-market-ui:local \
  .
```

The Dockerfiles path must work with this exact build context.

---

#### Development Commands

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

#### `.dockerignore`

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

#### Existing Files

Preserve useful repository files that already exist unless they directly conflict with these instructions.

In particular:

- do not delete `README.md`,
- do not replace `.gitignore` with an inferior generated version,
- do not remove `AGENTS.md`,
- do not modify unrelated GitHub repository settings,
- do not alter Git submodule configuration.

If generated Vite files conflict with existing repository files, merge carefully rather than blindly overwriting useful content.

---

#### Scope Boundaries

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

#### Code Quality

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

#### Validation Requirements

Before considering the task complete, perform these checks where the environment permits them.

##### Frontend validation

From `frontend/` run:

```bash
npm ci
npm run build
```

The TypeScript and Vite production build must succeed.

If linting is configured, run the lint command as well.

##### Development watcher validation

Where practical:

1. run `npm run dev`,
2. modify a `.tsx` or related source file,
3. verify Vite detects the change,
4. verify HMR/browser refresh occurs without manually restarting Vite.

Do not claim watcher/HMR validation succeeded unless it was actually tested.

##### Docker validation

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

#### Required Behavior

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

#### Expected Deliverables

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

#### Completion Report

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

### Orchestration repository flow (`./`)

#### Add Backend API and Task-Manager Services

Extend `docker-compose.yaml` so the orchestration stack contains three application services:

```text
esim-market-ui
esim-market-backend-api
esim-market-backend-job
```

The backend services must be built from the existing `./esim-market-backend` Git submodule.

Do not duplicate backend source into the orchestration repository.

#### Backend API Service

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

#### FastAPI Development Reload

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

#### Source Bind Mount Required for Reload

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

#### Backend Job / Task-Manager Service

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

#### Backend Job Source Mount

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

#### MongoDB Service

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

#### Redis Service

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

#### Backend Environment Configuration

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

#### Service Networking

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

#### Updated Compose Shape

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

#### Validation

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


### Backend repository flow (`./esim-market-backend`)

**SKIP THIS SECTION FOR NOW.**

This section is intentionally reserved for future work.

Do not infer or implement complex tuning during bootstrap.

---


### UI repository flow (`./esim-market-ui`)

**SKIP THIS SECTION FOR NOW.**

This section is intentionally reserved for future work.

Do not infer or implement complex tuning during bootstrap.

---


## Integrating the API SDK with esim connect

### Orchestration repository flow (`./`)

**SKIP THIS SECTION FOR NOW.**

This section is intentionally reserved for future work.

Do not infer or implement complex tuning during bootstrap.

### Backend repository flow (`./esim-market-backend`)

**SKIP THIS SECTION FOR NOW.**

The `EsimConnectRepository` class and factory registration may exist as bootstrap structure, but actual eSIM Connect SDK integration must not be implemented yet.

Do not invent SDK contracts, endpoints, credentials, authentication flows or seller-specific production logic.

This section will be completed later.

### UI repository flow (`./esim-market-ui`)

**SKIP THIS SECTION FOR NOW.**

This section is intentionally reserved for future work.

Do not infer or implement complex tuning during bootstrap.

