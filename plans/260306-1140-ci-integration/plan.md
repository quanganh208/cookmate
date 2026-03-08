---
title: "CI Integration for Frontend & Backend"
description: "Full CI pipelines with Jest tests, expo export, Checkstyle lint, Docker build, and caching"
status: complete
priority: P2
effort: 4h
branch: main
tags: [infra, ci, frontend, backend]
created: 2026-03-06
completed: 2026-03-06
---

# CI Integration for Frontend & Backend

## Overview

Upgrade CI pipelines: add Jest testing + expo export build to frontend, add Checkstyle lint + Docker build to backend. Add caching for both.

## Context

- Brainstorm report: [brainstorm-260306-1140-ci-integration](../reports/brainstorm-260306-1140-ci-integration.md)
- Current frontend CI: `.github/workflows/frontend-ci.yml` (lint + tsc only)
- Current backend CI: `.github/workflows/backend-ci.yml` (build + test only)
- Dockerfile: `docker/Dockerfile.backend`

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Frontend CI — Jest + Expo Export | Complete | 2h | [phase-01](./phase-01-frontend-ci-jest-and-build.md) |
| 2 | Backend CI — Checkstyle + Docker Build | Complete | 1.5h | [phase-02](./phase-02-backend-ci-checkstyle-and-docker.md) |
| 3 | Caching Strategy | Complete | 0.5h | [phase-03](./phase-03-caching-strategy.md) |

## Dependencies

- Phase 1 and 2 are independent (can be done in parallel)
- Phase 3 modifies both workflow files from Phase 1 & 2 (must run after)

## Key Decisions

- Jest with `jest-expo` preset for React Native testing
- `npx expo export --platform web` for build verification
- Checkstyle with Google style (relaxed) for Java linting
- Docker build verify only (no registry push)
