# eSIM Market

`esim-market` is the top-level orchestration repository for the eSIM Market project. It brings the UI, backend API, background job, MongoDB, and Redis together with Docker Compose.

For detailed architecture, development, and orchestration guidance, see the [root `AGENTS.md`](https://github.com/tolga-kabadurmus/esim-market/blob/main/AGENTS.md).

## Repositories

- [`esim-market`](https://github.com/tolga-kabadurmus/esim-market) — runs the complete stack and contains the other repositories as Git submodules.
- [`esim-market-backend`](https://github.com/tolga-kabadurmus/esim-market-backend) — provides the FastAPI service, background job, and database integrations.
- [`esim-market-ui`](https://github.com/tolga-kabadurmus/esim-market-ui) — provides the React web application and its nginx production image.

```text
esim-market (Docker Compose)
├── esim-market-ui
└── esim-market-backend
    ├── API
    └── background job
```

## Run the complete project

Clone the repository with its submodules:

```bash
git clone --recurse-submodules https://github.com/tolga-kabadurmus/esim-market.git
cd esim-market
```

Provide the local environment files referenced under `.env/dev/`, then start the development stack:

```bash
docker compose --profile dev up --build
```

To use the nginx-served UI instead of the Vite development server:

```bash
docker compose --profile prod up --build
```

Open the UI at <http://localhost:5001> and the API documentation at <http://localhost:5002/docs>.

Stop the stack with:

```bash
docker compose down
```
