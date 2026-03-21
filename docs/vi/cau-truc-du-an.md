# Cấu trúc dự án

> Tài liệu tiếng Việt — Xem [English docs](../) để biết thêm chi tiết kỹ thuật.

Hiểu rõ cấu trúc Cookmate giúp bạn nhanh chóng định vị các tệp và tính năng.

## Tổng quan kiến trúc

```
┌──────────────────┐       HTTP/REST       ┌──────────────────┐
│  Expo Mobile App │  ─────────────────>   │  Spring Boot API │
│  (React Native)  │  <─────────────────   │  (Java 21)       │
└──────────────────┘       JSON            └────────┬─────────┘
                                                    │
                                           MongoDB Driver
                                                    │
                                            ┌───────▼────────┐
                                            │  MongoDB 8.0   │
                                            └────────────────┘
```

Mobile app gửi HTTP requests → API xử lý → MongoDB lưu dữ liệu.

## Cấu trúc thư mục gốc

```
cookmate/
├── apps/                    Ứng dụng (pnpm workspace)
│   └── mobile/              React Native Expo app
├── backend/                 Spring Boot REST API
├── docker/                  Docker configurations
├── .github/workflows/       CI/CD pipelines (GitHub Actions)
├── docs/                    Tài liệu dự án
├── plans/                   Kế hoạch triển khai
├── docker-compose.yml       Local dev environment
├── package.json             Root pnpm workspace
└── README.md                Tổng quan dự án
```

## Mobile App (apps/mobile/)

**Stack:** React Native Expo SDK 55, React 19.2.0, Expo Router v7, TypeScript

### Cấu trúc thư mục

```
apps/mobile/
├── app/                     Expo Router pages (file-based routing)
│   ├── _layout.tsx          Root layout
│   ├── index.tsx            Home screen
│   └── +not-found.tsx       404 page
├── components/              Reusable UI components
├── hooks/                   Custom React hooks
├── services/                API calls & business logic
├── types/                   TypeScript interfaces
├── assets/                  Images, fonts, static files
├── app.json                 Expo configuration
├── tsconfig.json            TypeScript config
└── package.json             Dependencies
```

### Routing (Expo Router)

Routing dựa trên tên tệp:

- `app/index.tsx` → `/` (Home)
- `app/(tabs)/` → Tab navigation
- `app/auth/login.tsx` → `/auth/login`

### Quy tắc đặt tên

| Loại                | Format           | Ví dụ                            |
| ------------------- | ---------------- | -------------------------------- |
| Files               | kebab-case       | `recipe-card.tsx`, `use-auth.ts` |
| Directories         | kebab-case       | `components/`, `hooks/`          |
| Components          | PascalCase       | `RecipeCard`, `HomeScreen`       |
| Functions/variables | camelCase        | `getRecipes`, `isLoading`        |
| Constants           | UPPER_SNAKE_CASE | `API_BASE_URL`                   |
| Types/Interfaces    | PascalCase       | `Recipe`, `UserProfile`          |

## Backend API (backend/)

**Stack:** Spring Boot 4.0.3, Java 21 LTS, Spring Data MongoDB, Lombok, Maven

### Cấu trúc Layered Architecture

```
src/main/java/com/cookmate/
├── CookmateApplication.java     Entry point
├── controller/                  REST endpoints (@RestController)
├── service/                     Business logic (@Service)
├── repository/                  Data access (@Repository, Spring Data)
├── model/                       MongoDB entities (@Document)
├── dto/                         Request/Response transfer objects
├── config/                      Spring beans, CORS, MongoDB config
└── exception/                   Error handling (@ControllerAdvice)
```

### Luồng xử lý

```
Request → Controller → Service → Repository → MongoDB → JSON Response
```

**Controller** → validate → **Service** → logic → **Repository** → **MongoDB**

### Quy tắc đặt tên

| Loại              | Format           | Ví dụ                                         |
| ----------------- | ---------------- | --------------------------------------------- |
| Files/Classes     | PascalCase       | `RecipeService.java`, `RecipeController.java` |
| Methods/variables | camelCase        | `findByAuthor`, `recipeCount`                 |
| Constants         | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE`                               |
| Packages          | lowercase.dots   | `com.cookmate.controller`                     |

## Database (MongoDB 8.0)

**Collections (kế hoạch):**

- `users` — User accounts & profiles
- `recipes` — Recipe documents
- `follows` — User relationships
- `likes` — Bookmarks & likes
- `comments` — Comments
- `ratings` — Ratings

**Kết nối:**

- Dev: `mongodb://mongodb:27017/cookmate` (Docker)
- Prod: Dùng `MONGODB_URI` environment variable

## Infrastructure (Docker)

### Services (docker-compose.yml)

| Service    | Image     | Port  | Mục đích        |
| ---------- | --------- | ----- | --------------- |
| mongodb    | mongo:8.0 | 27017 | Database        |
| api-server | custom    | 8080  | Spring Boot API |

### Network

Tất cả containers kết nối qua bridge network `cookmate-network` để giao tiếp nội bộ.

## Tìm kiếm tệp theo chức năng

| Mục đích                | Vị trí                                | Ví dụ                               |
| ----------------------- | ------------------------------------- | ----------------------------------- |
| Sửa API endpoint        | `backend/.../controller/`             | `RecipeController.java`             |
| Thêm UI component       | `apps/mobile/app/` hoặc `components/` | `recipe-card.tsx`                   |
| Thay đổi business logic | `backend/.../service/`                | `RecipeService.java`                |
| Sửa MongoDB schema      | `backend/.../model/`                  | `Recipe.java`                       |
| Cấu hình CI/CD          | `.github/workflows/`                  | `frontend-ci.yml`, `backend-ci.yml` |

## Xem thêm

- [Codebase Summary](../codebase-summary.md) — Chi tiết dependencies
- [System Architecture](../system-architecture.md) — Kiến trúc hệ thống
- [Code Standards](../code-standards.md) — Quy chuẩn viết code
- [Bảng thuật ngữ](./thuat-ngu.md) — Định nghĩa kỹ thuật
