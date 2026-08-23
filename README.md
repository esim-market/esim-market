# eSIM Market

`esim-market` is the **orchestration repository** for the eSIM Market project.

This repository does not contain the main application source code itself. Its primary responsibility is to bring the eSIM Market components together for local development, integration, and deployment.

## Orchestration Responsibilities

This repository contains the Docker Compose configuration required to run the eSIM Market application stack.

Typical contents include:

- `docker-compose.yaml`
- Environment configuration examples
- Local development orchestration
- Integration configuration
- References to the UI and backend source repositories through Git submodules

## Git Submodules

This repository includes two Git submodules:

1. [`esim-market-ui`](https://github.com/tolga-kabadurmus/esim-market-ui)  
   React-based frontend application for eSIM Market.

2. [`esim-market-backend`](https://github.com/tolga-kabadurmus/esim-market-backend)  
   Backend web services and background jobs for eSIM Market.

The repository structure is expected to look similar to:

```text
esim-market/
├── docker-compose.yaml
├── ui/          -> esim-market-ui Git submodule
├── backend/     -> esim-market-backend Git submodule
└── README.md
```

## Cloning the Repository

Clone the repository together with its Git submodules:

```bash
git clone --recurse-submodules https://github.com/REPLACE_WITH_YOUR_GITHUB_USERNAME/esim-market.git
```

If the repository was already cloned without submodules, initialize them with:

```bash
git submodule update --init --recursive
```

## Running the Stack

Once the repository and its submodules are available locally, the complete application stack can be started using Docker Compose:

```bash
docker compose up --build
```

## Related Repositories

- [`esim-market-ui`](https://github.com/tolga-kabadurmus/esim-market-ui)
- [`esim-market-backend`](https://github.com/tolga-kabadurmus/esim-market-backend)
