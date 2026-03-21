# Hướng dẫn bắt đầu

> Tài liệu tiếng Việt — Xem [English docs](../) để biết thêm chi tiết kỹ thuật.

Chào mừng bạn đến với Cookmate! Hướng dẫn này giúp bạn thiết lập môi trường phát triển từ đầu.

## Yêu cầu hệ thống

Đảm bảo bạn đã cài đặt các công cụ sau:

| Công cụ | Phiên bản | Tải về                                   |
| ------- | --------- | ---------------------------------------- |
| Node.js | 22+       | [nodejs.org](https://nodejs.org)         |
| pnpm    | 10+       | `npm install -g pnpm`                    |
| Java    | 21 LTS    | [Adoptium Temurin](https://adoptium.net) |
| Docker  | Mới nhất  | [docker.com](https://www.docker.com)     |

## Cài đặt từng bước

### Bước 1: Clone repository

```bash
git clone <repo-url> cookmate
cd cookmate
```

### Bước 2: Cài đặt dependencies

```bash
pnpm install
```

Lệnh này cài đặt dependencies cho toàn bộ workspace (frontend và backend).

### Bước 3: Khởi động Docker services

```bash
docker compose up -d
```

Lệnh này khởi động MongoDB. Kiểm tra containers đang chạy:

```bash
docker ps
```

### Bước 4: Khởi động backend API

Mở terminal mới:

```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

Backend chạy trên `http://localhost:8080`.

### Bước 5: Khởi động mobile app

Mở terminal thứ ba:

```bash
pnpm mobile
```

Chọn một trong các tùy chọn:

- `i` — iOS simulator
- `a` — Android emulator
- `w` — Web browser

## Kiểm tra hoạt động

### Kiểm tra MongoDB

```bash
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

Kết quả: `{ ok: 1 }` → thành công!

### Kiểm tra API

```bash
curl http://localhost:8080/actuator/health
```

Kết quả: `{ "status": "UP" }` → backend sẵn sàng!

## Các lệnh thường dùng

| Lệnh                                   | Ý nghĩa                    |
| -------------------------------------- | -------------------------- |
| `pnpm mobile`                          | Khởi động Expo dev server  |
| `pnpm mobile:ios`                      | Chạy trên iOS simulator    |
| `pnpm mobile:android`                  | Chạy trên Android emulator |
| `pnpm lint`                            | Kiểm tra code style        |
| `pnpm format`                          | Format code tự động        |
| `pnpm docker:up`                       | Khởi động Docker services  |
| `pnpm docker:down`                     | Dừng Docker services       |
| `cd backend && ./mvnw spring-boot:run` | Khởi động backend          |
| `cd backend && ./mvnw clean verify`    | Chạy unit tests backend    |

## Ghi chú

- **Port backend:** 8080
- **Port MongoDB:** 27017
- **Database mặc định:** `cookmate`

Nếu gặp lỗi, xem thêm trong [Deployment Guide](../deployment-guide.md) phần Troubleshooting.

Chi tiết hơn → [Cấu trúc dự án](./cau-truc-du-an.md)
