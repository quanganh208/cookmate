# Cookmate

Your recipe sharing companion — discover, create, and share recipes with a vibrant community.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile | React Native Expo (Expo Router) | SDK 52 |
| Backend | Spring Boot | 3.4.3 |
| Language (BE) | Java | 21 LTS |
| Database | MongoDB | 7.0 |
| Build (FE) | pnpm workspaces | 10.x |
| Build (BE) | Maven (wrapper) | 3.9.x |
| Container | Docker Compose | Latest |

## Prerequisites

- **Node.js** 20+ — [nodejs.org](https://nodejs.org)
- **pnpm** 10+ — `npm install -g pnpm`
- **Java** 21+ — [Adoptium Temurin](https://adoptium.net)
- **Docker** — [docker.com](https://www.docker.com) (for MongoDB)

## Getting Started

```bash
# Clone the repo
git clone <repo-url> cookmate && cd cookmate

# Install frontend dependencies
pnpm install

# Start MongoDB
docker compose up -d

# Start backend (new terminal)
cd backend && ./mvnw spring-boot:run

# Start mobile app (new terminal)
cd .. && pnpm mobile
```

## Project Structure

```
cookmate/
├── apps/
│   └── mobile/              # React Native Expo app
│       ├── app/             # Expo Router pages
│       │   ├── _layout.tsx  # Root layout
│       │   ├── index.tsx    # Home screen
│       │   └── +not-found.tsx
│       ├── app.json         # Expo config
│       └── package.json
├── backend/                 # Spring Boot API
│   ├── src/main/java/com/cookmate/
│   │   ├── CookmateApplication.java
│   │   ├── controller/      # REST controllers
│   │   ├── service/         # Business logic
│   │   ├── repository/      # MongoDB repositories
│   │   ├── model/           # Domain entities
│   │   ├── dto/             # Data transfer objects
│   │   ├── config/          # Configuration
│   │   └── exception/       # Custom exceptions
│   ├── src/main/resources/  # application.yml configs
│   └── pom.xml
├── docker/                  # Docker configs
│   ├── Dockerfile.backend   # Multi-stage Java build
│   └── mongo-init.js        # MongoDB seed script
├── .github/workflows/       # CI/CD
│   ├── backend-ci.yml       # Java build + test
│   └── frontend-ci.yml      # Lint + typecheck
├── docker-compose.yml       # Local dev services
├── package.json             # Root workspace config
└── pnpm-workspace.yaml      # Workspace declaration
```

## Development

### Mobile App

```bash
pnpm mobile          # Start Expo dev server
pnpm mobile:ios      # Start on iOS simulator
pnpm mobile:android  # Start on Android emulator
```

### Backend

```bash
cd backend
./mvnw spring-boot:run                    # Start server (port 8080)
./mvnw clean verify                       # Run tests
./mvnw spring-boot:run -Dspring.profiles.active=dev  # Dev profile
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/actuator/health` | Spring Actuator health |

### Docker

```bash
docker compose up -d      # Start MongoDB
docker compose down       # Stop services
docker compose logs -f    # Tail logs
```

## Contributing

### Branch Naming

- `feat/description` — new features
- `fix/description` — bug fixes
- `chore/description` — maintenance tasks

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org):

```
feat: add recipe search endpoint
fix: resolve MongoDB connection timeout
chore: update Spring Boot to 3.4.4
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make changes and ensure CI passes
3. Open a PR with clear description
4. Request review from a team member

## License

MIT
