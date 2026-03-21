# Bảng thuật ngữ (Glossary)

> Tài liệu tiếng Việt — Xem [English docs](../) để biết thêm chi tiết kỹ thuật.

Bảng định nghĩa các từ kỹ thuật tiếng Anh thường dùng trong Cookmate.

## Kiến trúc & Hệ thống

| Thuật ngữ (EN)       | Tiếng Việt          | Giải thích                                               |
| -------------------- | ------------------- | -------------------------------------------------------- |
| monorepo             | dự án đơn nhất      | Một repository chứa nhiều ứng dụng (mobile + backend)    |
| workspace            | không gian làm việc | Nhóm projects trong monorepo được quản lý bởi pnpm       |
| endpoint             | điểm cuối API       | URL cụ thể để gọi hàm API (ví dụ: `/api/recipes`)        |
| REST API             | API kiểu REST       | API theo chuẩn REST với GET, POST, PUT, DELETE           |
| middleware           | phần mềm trung gian | Code chạy giữa request và response (CORS, auth, logging) |
| layered architecture | kiến trúc phân lớp  | Backend chia thành Controller → Service → Repository     |
| scaffold             | tạo khung sườn      | Tạo project cơ bản với cấu trúc sẵn                      |

## Backend & Database

| Thuật ngữ (EN) | Tiếng Việt                    | Giải thích                                          |
| -------------- | ----------------------------- | --------------------------------------------------- |
| controller     | bộ điều khiển                 | Class xử lý HTTP requests và trả responses          |
| service        | dịch vụ                       | Class chứa business logic và xử lý dữ liệu          |
| repository     | kho dữ liệu                   | Class truy cập và quản lý dữ liệu từ MongoDB        |
| model          | mô hình                       | Class đại diện document trong MongoDB               |
| DTO            | Data Transfer Object          | Class định dạng dữ liệu gửi/nhận (request/response) |
| entity         | thực thể                      | Object đại diện một bản ghi trong database          |
| CORS           | Cross-Origin Resource Sharing | Cho phép mobile app gọi API từ domain khác          |
| JWT            | JSON Web Token                | Token dùng để xác thực người dùng                   |
| MongoDB        | cơ sở dữ liệu                 | NoSQL database lưu dữ liệu dạng JSON (BSON)         |
| collection     | bộ sưu tập                    | Tập hợp các documents trong MongoDB                 |
| document       | tài liệu                      | Một bản ghi trong MongoDB (tương tự row trong SQL)  |

## Frontend & Mobile

| Thuật ngữ (EN) | Tiếng Việt               | Giải thích                                                 |
| -------------- | ------------------------ | ---------------------------------------------------------- |
| React Native   | React Native             | Framework xây dựng mobile app từ JavaScript                |
| Expo           | Expo                     | Công cụ giúp develop React Native nhanh hơn                |
| Expo Router    | Expo Router              | Hệ thống file-based routing cho mobile app                 |
| SDK            | Software Development Kit | Bộ công cụ và thư viện phát triển                          |
| component      | thành phần               | UI element (button, form, card) có thể tái sử dụng         |
| hook           | khook                    | Function React tái sử dụng logic (useState, useEffect)     |
| hot reload     | tải lại nóng             | Tự động cập nhật app khi code thay đổi (không cần restart) |
| state          | trạng thái               | Dữ liệu thay đổi của component                             |
| props          | thuộc tính               | Dữ liệu truyền từ component cha sang con                   |
| TypeScript     | TypeScript               | JavaScript với type checking bổ sung                       |

## Git & Workflow

| Thuật ngữ (EN) | Tiếng Việt  | Giải thích                                           |
| -------------- | ----------- | ---------------------------------------------------- |
| branch         | nhánh       | Phiên bản riêng của code để phát triển tính năng mới |
| commit         | cam kết     | Lưu lại snapshot code với thông điệp mô tả           |
| push           | đẩy lên     | Gửi commits lên remote repository                    |
| pull           | kéo về      | Tải commits từ remote repository về máy local        |
| pull request   | yêu cầu kéo | Đề xuất thay đổi code từ một branch sang main        |
| merge          | hợp nhất    | Kết hợp code từ một branch vào branch khác           |
| rebase         | cơ sở lại   | Thay đổi lịch sử commit của branch                   |
| conflict       | xung đột    | Hai người sửa cùng dòng code → cần resolve thủ công  |
| fork           | rẽ nhánh    | Tạo copy riêng của repository để contribute          |

## Build & CI/CD

| Thuật ngữ (EN) | Tiếng Việt                        | Giải thích                                    |
| -------------- | --------------------------------- | --------------------------------------------- |
| build          | xây dựng                          | Biên dịch source code thành executable        |
| compile        | biên dịch                         | Chuyển code sang bytecode hoặc machine code   |
| linting        | kiểm tra style                    | Tự động check formatting, rule violations     |
| type checking  | kiểm tra kiểu                     | Xác minh types khớp nhau (TypeScript)         |
| unit test      | test đơn vị                       | Test một function/method riêng lẻ             |
| CI/CD          | Continuous Integration/Deployment | Tự động build, test, deploy mỗi khi push code |
| pipeline       | đường ống                         | Chuỗi các bước CI/CD chạy tự động             |
| artifact       | tạo tác                           | File build được tạo ra (JAR, APK, etc.)       |
| Docker         | Docker                            | Tool để tạo container chứa ứng dụng           |
| container      | container                         | Môi trường độc lập chứa app + dependencies    |

## Infrastructure & Deployment

| Thuật ngữ (EN)       | Tiếng Việt        | Giải thích                                                      |
| -------------------- | ----------------- | --------------------------------------------------------------- |
| deployment           | triển khai        | Đưa code lên server/production                                  |
| environment          | môi trường        | Dev, staging, production (mỗi có config khác)                   |
| profile              | hồ sơ             | Bộ config cho từng environment (dev, prod)                      |
| docker-compose       | docker-compose    | File định nghĩa nhiều containers chạy cùng lúc                  |
| volume               | ổ đĩa             | Nơi lưu dữ liệu persistent của container                        |
| network              | mạng              | Kết nối giữa các containers (ví dụ: cookmate-network)           |
| healthcheck          | kiểm tra sức khỏe | Tự động kiểm tra container còn hoạt động hay không              |
| port                 | cổng              | Số cổng để truy cập service (8080 cho API, 27017 cho MongoDB)   |
| environment variable | biến môi trường   | Cài đặt cấu hình qua biến (MONGODB_URI, SPRING_PROFILES_ACTIVE) |
| migration            | di chuyển         | Cập nhật schema database mà không mất dữ liệu                   |

## Chú thích

- **Backend:** Các terms liên quan Java, Spring Boot, MongoDB
- **Frontend:** Các terms liên quan React Native, Expo, TypeScript
- **Workflow:** Các terms liên quan Git, GitHub, commits
- **Infrastructure:** Các terms liên quan Docker, deployment, environment

Nếu gặp từ kỹ thuật không hiểu, check bảng này trước đã nhé!

## Xem thêm

- [Quy trình làm việc](./quy-trinh-lam-viec.md) — Git workflow
- [Cấu trúc dự án](./cau-truc-du-an.md) — Cấu trúc thư mục
- [Code Standards](../code-standards.md) — Quy chuẩn viết code
