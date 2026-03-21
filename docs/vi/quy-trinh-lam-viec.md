# Quy trình làm việc

> Tài liệu tiếng Việt — Xem [English docs](../) để biết thêm chi tiết kỹ thuật.

Hướng dẫn quy trình làm việc với Git và tạo Pull Request trong Cookmate.

## Quy tắc đặt tên branch

Tên branch phải mô tả rõ loại thay đổi:

| Loại          | Quy tắc       | Ví dụ                            |
| ------------- | ------------- | -------------------------------- |
| Tính năng mới | `feat/mô-tả`  | `feat/recipe-search-endpoint`    |
| Sửa lỗi       | `fix/mô-tả`   | `fix/mongodb-connection-timeout` |
| Bảo trì       | `chore/mô-tả` | `chore/update-dependencies`      |
| Tài liệu      | `docs/mô-tả`  | `docs/api-reference`             |

## Quy ước commit

Tuân theo [Conventional Commits](https://www.conventionalcommits.org):

```
<loại>(<phạm vi>): <nội dung ngắn>

<chi tiết (nếu cần)>

<footer (nếu cần)>
```

### Các loại commit

| Loại        | Nghĩa                  | Ví dụ                                       |
| ----------- | ---------------------- | ------------------------------------------- |
| `feat:`     | Tính năng mới          | `feat: add recipe rating endpoint`          |
| `fix:`      | Sửa lỗi                | `fix: resolve MongoDB connection timeout`   |
| `docs:`     | Cập nhật tài liệu      | `docs: update API documentation`            |
| `refactor:` | Cấu trúc lại code      | `refactor: simplify recipe filtering logic` |
| `test:`     | Thêm hoặc sửa test     | `test: add unit tests for recipe service`   |
| `chore:`    | Bảo trì, cập nhật deps | `chore: update Spring Boot to 4.0.3`        |
| `style:`    | Format, linting        | `style: add missing semicolons`             |

## Quy trình tạo Pull Request

### 1. Tạo branch mới

Lúc nào cũng pull latest `main` trước:

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

### 2. Code và commit

Tuân theo quy ước commit ở trên:

```bash
git add <tệp>
git commit -m "feat: add search by ingredient"
```

### 3. Đẩy code lên remote

```bash
git push origin feat/your-feature-name
```

### 4. Mở Pull Request trên GitHub

Điều kiện bắt buộc:

- Tiêu đề rõ ràng
- Mô tả các thay đổi
- Tham chiếu issue (nếu có): `Fixes #123`
- Hướng dẫn test (nếu cần)

### 5. Chạy CI checks

GitHub Actions sẽ chạy tự động:

- Linting checks (ESLint)
- Type checking (TypeScript)
- Unit tests
- Build validation

**Tất cả checks phải xanh (PASS) trước khi merge!**

### 6. Review và merge

- Yêu cầu review từ ít nhất 1 đồng nghiệp
- Giải quyết feedback nhanh chóng
- Đảm bảo branch cập nhật với `main` trước merge
- Xóa branch sau khi merge

## Kiểm tra code trước commit

Chạy các lệnh này trước khi push:

```bash
# Kiểm tra linting
pnpm lint

# Format code
pnpm format

# Chạy tests (backend)
cd backend && ./mvnw clean verify
```

## Xem thêm

- [Code Standards](../code-standards.md) — Quy tắc viết code
- [CONTRIBUTING](../../CONTRIBUTING.md) — Chi tiết đầy đủ
- [Bảng thuật ngữ](./thuat-ngu.md) — Định nghĩa các từ kỹ thuật
