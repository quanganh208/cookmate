# Cookmate — Product Development Requirements

## Vision

Cookmate is a recipe sharing mobile app that connects home cooks. Users discover recipes, share their own creations, and build a personal cookbook.

## Target Users

- Home cooks looking for recipe inspiration
- Food enthusiasts who want to share their recipes
- Meal planners who need organized recipe collections

## Core Features (Roadmap)

### Phase 1 — Foundation (Current)
- Monorepo scaffolding with pnpm workspaces
- Mobile app skeleton (Expo Router, Expo SDK 55)
- Backend API skeleton (Spring Boot 3.5.11, Java 21)
- Docker-based local development (MongoDB 8.0, API server)

### Phase 2 — Authentication
- User registration and login
- JWT-based authentication
- Profile management

### Phase 3 — Recipes
- Create, read, update, delete recipes
- Ingredient lists and step-by-step instructions
- Image upload for recipes
- Search and filtering

### Phase 4 — Social
- Follow other users
- Like and bookmark recipes
- Comments and ratings

### Phase 5 — AI Features
- Recipe suggestions based on available ingredients
- Nutritional analysis
- Smart meal planning

## Non-Functional Requirements

- **Performance:** API responses < 200ms (p95)
- **Availability:** 99.9% uptime target
- **Security:** OWASP top 10 compliance
- **Scalability:** Support 10K concurrent users
