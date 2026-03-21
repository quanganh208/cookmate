# Contributing to Cookmate

Thank you for your interest in contributing to Cookmate. We appreciate your effort to help us improve the recipe sharing platform. Whether you're fixing bugs, adding features, or improving documentation, your contributions make Cookmate better.

## Getting Started

### Prerequisites

Ensure you have the required tools installed:

- **Node.js** 22+ — [nodejs.org](https://nodejs.org)
- **pnpm** 10+ — `npm install -g pnpm`
- **Java** 21+ — [Adoptium Temurin](https://adoptium.net)
- **Docker** — [docker.com](https://www.docker.com)

### Setting Up Your Development Environment

1. **Fork the repository** and clone your fork locally:

   ```bash
   git clone https://github.com/your-username/cookmate.git
   cd cookmate
   ```

2. **Install frontend dependencies:**

   ```bash
   pnpm install
   ```

3. **Start Docker services** (MongoDB):

   ```bash
   docker compose up -d
   ```

4. **Start the backend** (in a new terminal):

   ```bash
   cd backend && ./mvnw spring-boot:run
   ```

5. **Start the mobile app** (in another new terminal):
   ```bash
   pnpm mobile
   ```

Your development environment is now ready. The backend runs on port 8080 and the mobile app on the Expo dev server.

## Development Workflow

### Branch Naming Convention

Use descriptive branch names based on the type of change:

- `feat/description` — New features (e.g., `feat/recipe-search-endpoint`)
- `fix/description` — Bug fixes (e.g., `fix/mongodb-connection-timeout`)
- `chore/description` — Maintenance tasks (e.g., `chore/update-dependencies`)
- `docs/description` — Documentation updates (e.g., `docs/api-reference`)

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat:` — New feature
- `fix:` — Bug fix
- `chore:` — Maintenance, dependency updates, config changes
- `docs:` — Documentation changes
- `refactor:` — Code refactoring (no feature or bug fix)
- `test:` — Test additions or modifications
- `style:` — Code style changes (formatting, missing semicolons)

**Examples:**

```
feat: add recipe rating endpoint
fix: resolve MongoDB connection timeout
docs: update API documentation
refactor: simplify recipe filtering logic
test: add unit tests for recipe service
```

### Code Standards

Before committing code, review the detailed code standards in [docs/code-standards.md](./docs/code-standards.md). This covers:

- Code organization and structure
- Naming conventions
- Error handling patterns
- Testing requirements
- Security best practices

## Pull Request Process

1. **Create a branch** from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following the code standards and commit conventions above.

3. **Ensure CI passes** — All checks must pass before your PR can be merged:
   - Linting checks
   - Type checking
   - Unit tests
   - Build validation

4. **Open a pull request** on GitHub with:
   - Clear, descriptive title
   - Summary of changes in the description
   - Reference to any related issues (e.g., "Fixes #123")
   - Steps to test your changes if applicable

5. **Request review** from at least one team member and address feedback promptly.

6. **Ensure branch is up to date** with `main` before merge.

## Reporting Issues

Found a bug or have a feature request? Use GitHub Issues:

1. **Search existing issues** to avoid duplicates.
2. **Create a new issue** with:
   - Clear title describing the problem
   - Step-by-step reproduction steps
   - Expected behavior vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Screenshots or error logs if applicable

## Code of Conduct

We are committed to fostering an inclusive and respectful community. All contributors must:

- Treat everyone with respect and kindness
- Welcome diverse perspectives and backgrounds
- Focus feedback on ideas, not individuals
- Report inappropriate behavior to maintainers

We have zero tolerance for harassment, discrimination, or abusive behavior of any kind.

## Questions?

If you have questions about contributing, open an issue with the `question` label or start a discussion. We're here to help.

Happy coding!
