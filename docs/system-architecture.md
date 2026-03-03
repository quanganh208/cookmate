# Cookmate — System Architecture

## Overview

Cookmate uses a monorepo with two main applications:
- **Mobile**: React Native Expo (SDK 55) with Expo Router file-based routing
- **Backend**: Spring Boot 3.5.11 REST API (Java 21) with Spring Data MongoDB
- **Database**: MongoDB 8.0 (containerized)

## Architecture Diagram

```
┌──────────────────┐       HTTP/REST       ┌──────────────────┐
│                  │  ──────────────────>   │                  │
│  Expo Mobile App │                        │  Spring Boot API │
│  (React Native)  │  <──────────────────   │  (Java 21)       │
│                  │       JSON             │                  │
└──────────────────┘                        └────────┬─────────┘
                                                     │
                                                     │ MongoDB Driver
                                                     │
                                            ┌────────▼─────────┐
                                            │                  │
                                            │    MongoDB 8.0   │
                                            │                  │
                                            └──────────────────┘
```

## Monorepo Layout

```
cookmate/
├── apps/
│   └── mobile/              → React Native Expo (pnpm workspace)
│       ├── app/             → Expo Router pages (file-based routing)
│       ├── package.json      → Mobile app dependencies
│       └── tsconfig.json     → TypeScript config
├── backend/                 → Spring Boot API (Maven)
│   ├── src/main/java/com/cookmate/  → Application code
│   └── pom.xml              → Maven configuration
├── docker/                  → Docker configs
│   ├── Dockerfile.backend   → Backend container build
│   └── mongo-init.js        → MongoDB initialization
├── .github/
│   └── workflows/           → CI/CD workflows (frontend-ci.yml, backend-ci.yml)
├── package.json             → Root workspace (pnpm 10.7.0)
├── docker-compose.yml       → Local dev environment
└── README.md                → Project documentation
```

## Backend Architecture (Layered)

```
Controller → Service → Repository → MongoDB
     ↓           ↓
    DTO        Model
```

- **Controller** — REST endpoints, request validation
- **Service** — Business logic, orchestration
- **Repository** — Data access via Spring Data MongoDB
- **Model** — Domain entities with MongoDB annotations
- **DTO** — Request/response data transfer objects
- **Config** — CORS, MongoDB auditing, security
- **Exception** — Custom exception handlers

## Data Flow

1. Mobile app sends HTTP request to `/api/*`
2. CorsConfig allows cross-origin from dev ports
3. Controller validates input, delegates to Service
4. Service executes business logic
5. Repository queries MongoDB
6. Response serialized as JSON back to mobile

## Environment Profiles

| Profile | MongoDB | Logging | Use |
|---------|---------|---------|-----|
| dev | localhost:27017 | DEBUG | Local development |
| prod | env var | WARN | Production |

## Docker Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| mongodb | mongo:8.0 | 27017 | Database (healthcheck enabled) |
| api-server | custom (Dockerfile.backend) | 8080 | Spring Boot API server |

## Local Development Environment

**docker-compose.yml** defines:
- MongoDB with persistent volume (`mongodb_data`)
- Health check (mongosh ping every 5s)
- Backend service with Spring profile `dev`
- Custom bridge network `cookmate-network`
- MongoDB URI: `mongodb://mongodb:27017/cookmate`
