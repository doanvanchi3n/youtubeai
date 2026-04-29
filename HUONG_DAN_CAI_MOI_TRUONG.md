# Hướng dẫn cài môi trường chạy project YouTube AI

Tài liệu này hướng dẫn cài lại môi trường từ đầu, **bao gồm tạo cơ sở dữ liệu trên XAMPP**.

**Trên Ubuntu:** Có thể dùng các lệnh `apt` trong mục **1.1** để cài Java, Node, npm, Maven; cài thêm `python3.12-venv` trước khi tạo virtualenv cho AI module (mục 4.1); nhớ **activate venv** (`source .venv/bin/activate`) trước khi dùng `pip`. Database có thể dùng MySQL/MariaDB cài qua `apt` (mục 2.3) thay cho XAMPP.

---

## 1. Yêu cầu phần mềm

Cần cài sẵn:

| Phần mềm | Phiên bản | Ghi chú |
|----------|-----------|---------|
| **Git** | Bất kỳ | Clone/ quản lý mã nguồn |
| **Java (JDK)** | 17 trở lên | Backend Spring Boot |
| **Node.js** | 18 trở lên (kèm npm) | Frontend React + Vite |
| **Python** | 3.10+ (khuyến nghị 3.12) | AI module (Flask, NLP) |
| **XAMPP** | Có MySQL 8.x hoặc 5.7 | Database (hoặc MySQL/MariaDB cài riêng) |

**Kiểm tra nhanh:**

```bash
java -version    # java version "17" trở lên
node -v          # v18.x trở lên
npm -v
python3 --version # 3.10+
# MySQL: qua XAMPP Control Panel hoặc mysql --version
```

### 1.1. Cài đặt công cụ trên Ubuntu/Debian (apt)

Nếu chạy lệnh kiểm tra trên mà thiếu **Java**, **Node** hoặc **npm**, dùng các lệnh sau (cần quyền `sudo`):

**Java 17 (JDK – cần cho build và chạy backend):**

```bash
sudo apt update
sudo apt install openjdk-17-jdk
java -version
javac -version
```

**Node.js 18+ và npm:**

```bash
sudo apt install nodejs npm
node -v
npm -v
```

Trên Ubuntu 24.04, gói `nodejs` thường là Node 18.x. Nếu cần Node 20 trở lên, dùng NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**Maven (để build backend):**

```bash
sudo apt install maven
mvn -v
```

Hoặc dùng wrapper có sẵn trong project: `./backend/mvnw` (không bắt buộc cài Maven toàn hệ thống).

**Tóm tắt một lệnh (Java + Node + npm + Maven):**

```bash
sudo apt update
sudo apt install -y openjdk-17-jdk nodejs npm maven
```

Sau khi cài xong, chạy lại các lệnh kiểm tra ở trên để xác nhận.

---

## 2. Tạo cơ sở dữ liệu trên XAMPP

### 2.1. Khởi động MySQL trong XAMPP

1. Mở **XAMPP Control Panel**.
2. Bấm **Start** cho **MySQL** (và **Apache** nếu bạn dùng phpMyAdmin qua trình duyệt).
3. Đảm bảo MySQL đang chạy (nút chuyển sang màu xanh).

**Lưu ý:** Mặc định MySQL trong XAMPP:
- **Port:** 3306  
- **User:** `root`  
- **Password:** thường để trống (hoặc `root` tùy bản cài).

### 2.2. Tạo database bằng phpMyAdmin (giao diện web)

1. Mở trình duyệt, truy cập: **http://localhost/phpmyadmin**
2. Đăng nhập:
   - User: `root`
   - Password: để trống hoặc `root` (tùy cấu hình XAMPP của bạn)
3. Tạo database mới:
   - Chọn tab **Databases**.
   - Ở ô **Create database**:
     - **Database name:** `youtubeai`
     - **Collation:** chọn `utf8mb4_unicode_ci`
   - Bấm **Create**.
4. Import schema (tạo các bảng):
   - Chọn database **youtubeai** bên trái.
   - Chọn tab **Import**.
   - Bấm **Choose File** và chọn file:
     ```
     [thư mục project]/database/schema.sql
     ```
     Ví dụ: `C:\xampp\htdocs\youtubeai\database\schema.sql` hoặc đường dẫn tương ứng trên máy bạn.
   - Bấm **Go** / **Import** ở cuối trang.
   - Đợi thông báo import thành công.
5. Import migration (thêm cột đăng nhập, role, admin):
   - Vẫn trong **youtubeai**, tab **Import**.
   - Chọn file: `database/migration_add_auth_fields.sql`.
   - Bấm **Go**.
   - Nếu báo lỗi “Duplicate entry” cho admin user thì bỏ qua (admin đã có rồi).

**Tùy chọn – Tạo user admin thủ công (nếu chưa chạy migration):**

- Tab **SQL**, dán và chạy nội dung file `database/create_admin_user.sql`.  
- Mặc định: email `admin@example.com`, mật khẩu `admin123`.

### 2.3. Tạo database bằng dòng lệnh (MySQL trong XAMPP hoặc cài trên Ubuntu)

**Ubuntu (không dùng XAMPP):** Cài MySQL hoặc MariaDB trước:

```bash
sudo apt update
sudo apt install mysql-server
# hoặc: sudo apt install mariadb-server
sudo systemctl start mysql   # hoặc: mariadb
```

Sau đó dùng lệnh **Linux / macOS** bên dưới (đường dẫn `database/` là thư mục project).

Nếu bạn dùng terminal/CMD và đã thêm MySQL vào PATH (hoặc dùng đường dẫn trong XAMPP):

**Windows (CMD trong thư mục XAMPP MySQL):**

```cmd
cd C:\xampp\mysql\bin
mysql -u root -p
```

(Nhập mật khẩu root MySQL nếu có; nếu không có thì bấm Enter.)

Trong cửa sổ MySQL:

```sql
CREATE DATABASE youtubeai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE youtubeai;
SOURCE C:/xampp/htdocs/youtubeai/database/schema.sql;
SOURCE C:/xampp/htdocs/youtubeai/database/migration_add_auth_fields.sql;
EXIT;
```

**Linux / macOS (khi MySQL chạy qua XAMPP hoặc cài riêng):**

```bash
mysql -u root -p
```

```sql
CREATE DATABASE youtubeai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE youtubeai;
SOURCE /home/vanchien/Project/youtubeai/database/schema.sql;
SOURCE /home/vanchien/Project/youtubeai/database/migration_add_auth_fields.sql;
EXIT;
```

Hoặc một lệnh từ shell (đường dẫn thay đúng theo máy bạn):

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS youtubeai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p youtubeai < database/schema.sql
mysql -u root -p youtubeai < database/migration_add_auth_fields.sql
```

Sau bước này bạn đã có:
- Database `youtubeai`.
- Các bảng: `users`, `channels`, `videos`, `comments`, …
- Cột `role`, `locked`, `google_id` trên `users` (từ migration).
- User admin: `admin@example.com` / `admin123` (nếu đã chạy migration hoặc `create_admin_user.sql`).

---

## 3. Cấu hình Backend (Spring Boot) với MySQL XAMPP

1. Mở file: **`backend/src/main/resources/application.properties`**.
2. Chỉnh cho đúng MySQL trong XAMPP:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/youtubeai
spring.datasource.username=root
spring.datasource.password=
```

- Nếu bạn đặt mật khẩu cho user `root` trong XAMPP thì điền vào `spring.datasource.password=...`.
- Port `3306` là mặc định; nếu XAMPP MySQL dùng port khác thì sửa trong URL.

Lưu file. Backend sẽ kết nối tới database `youtubeai` trên XAMPP khi chạy.

---

## 4. Cài đặt và chạy từng thành phần

### 4.1. Cài AI Module (Python)

**Ubuntu/Debian:** Nếu lỗi *"ensurepip is not available"* khi tạo venv, cài gói venv trước:

```bash
sudo apt install python3.12-venv
```

Từ **thư mục gốc project** (`~/Project/youtubeai`), chạy:

```bash
cd ai_module
python3 -m venv .venv
```

(Lưu ý: chỉ chạy `cd ai_module` khi đang ở thư mục gốc; nếu prompt đã là `~/Project/youtubeai/ai_module$` thì không cần `cd ai_module` nữa.)

**Linux/macOS – kích hoạt virtualenv (bắt buộc trước khi dùng pip):**

```bash
source .venv/bin/activate
```

Sau khi chạy, prompt sẽ có dạng `(.venv) vanchien@...$` — lúc đó mới dùng `pip`. Nếu không activate, lệnh `pip` sẽ báo "not found".

**Windows (CMD):**

```cmd
.venv\Scripts\activate.bat
```

**Windows (PowerShell):**

```powershell
.venv\Scripts\Activate.ps1
```

Sau khi kích hoạt virtualenv:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Nếu gặp lỗi với `torch` / `transformers`, có thể dùng bộ cài nhẹ:

```bash
pip install -r requirements-basic.txt
```

**Tạo file `.env` cho AI module** (trong thư mục `ai_module`):

Tạo file `ai_module/.env` với nội dung tối thiểu:

```env
# HuggingFace (tuỳ chọn, cho model NLP)
HUGGINGFACE_API_TOKEN=

# Google Gemini (tuỳ chọn, cho gợi ý nội dung và AI Chat Bot)
# Lưu ý: không có khoảng trắng sau dấu = (ví dụ: GOOGLE_GEMINI_API_KEY=AIzaSy...)
GOOGLE_GEMINI_API_KEY=
```

- Có thể bỏ trống; ứng dụng vẫn chạy, tab **Tạo Gợi ý Nội Dung** vẫn dùng được.
- **Để AI Chat Bot trò chuyện tự nhiên** (hỏi đáp mở, không chỉ "Tạo tiêu đề/mô tả/hashtags"): lấy API key từ [Google AI Studio](https://aistudio.google.com/api-keys), tạo key cho project, rồi gán vào `GOOGLE_GEMINI_API_KEY=` trong `ai_module/.env`. Sau đó khởi động lại AI module.
- Nếu chưa cấu hình Gemini, Chat Bot vẫn trả lời được khi bạn gửi đúng từ khóa như "Tạo tiêu đề", "Tạo mô tả", "Tạo hashtags" (fallback theo từ khóa).

Thoát virtualenv: `deactivate`.

### 4.2. Build và chạy Backend (Java)

Từ thư mục gốc project:

```bash
cd backend
./mvnw clean package -DskipTests
# hoặc: mvn clean package -DskipTests
```

**Ubuntu:** Nếu báo *Permission denied* khi chạy `./mvnw`, cấp quyền thực thi: `chmod +x mvnw` (trong thư mục `backend`).

Chạy backend:

```bash
./mvnw spring-boot:run
# hoặc: mvn spring-boot:run
```

Backend chạy tại: **http://localhost:8080**.  
Giữ terminal này mở.

### 4.3. Cài và chạy Frontend (React + Vite)

Mở terminal mới, từ thư mục gốc project:

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại: **http://localhost:5173**.

**Node 18:** Project dùng Vite 5 (tương thích Node 18). Nếu trước đó đã cài Vite 7 và gặp lỗi *crypto.hash is not a function*, chạy lại `npm install` sau khi đã sửa `package.json`; hoặc nâng Node lên 20+ (NodeSource) để dùng Vite 7.

### 4.4. Chạy AI Module (terminal thứ ba)

Terminal khác:

```bash
cd ai_module
source .venv/bin/activate   # Linux/macOS
# hoặc .venv\Scripts\activate  trên Windows
python main.py
```

AI module chạy tại: **http://localhost:5000**.

---

## 5. Thứ tự chạy và kiểm tra

1. **XAMPP:** MySQL (và Apache nếu dùng phpMyAdmin) đang chạy.
2. **Database:** Đã tạo `youtubeai` và import `schema.sql` + `migration_add_auth_fields.sql`.
3. **Backend:** `cd backend` → `./mvnw spring-boot:run` → http://localhost:8080.
4. **AI Module:** `cd ai_module` → activate venv → `python main.py` → http://localhost:5000.
5. **Frontend:** `cd frontend` → `npm run dev` → http://localhost:5173.

Mở trình duyệt: **http://localhost:5173**  
Đăng nhập thử: `admin@example.com` / `admin123` (nếu đã chạy script tạo admin).

---

## 6. Script tự động (Linux/macOS)

Trong thư mục gốc project đã có sẵn script:

```bash
chmod +x setup_environment.sh
./setup_environment.sh
```

Script sẽ:
- Kiểm tra `python3`, `pip3`, `npm`, `mvn`, `java`.
- Tạo virtualenv và cài dependency cho `ai_module`.
- Build backend (Maven).
- Cài dependency frontend (`npm install`).

**Bạn vẫn cần làm tay:**
- Tạo database `youtubeai` trên XAMPP và import `schema.sql` + `migration_add_auth_fields.sql` (theo mục 2).
- Chỉnh `application.properties` cho đúng user/password MySQL (mục 3).
- Tạo `ai_module/.env` (mục 4.1).

---

## 7. Tóm tắt nhanh – Database trên XAMPP

| Bước | Việc cần làm |
|------|-------------------------------|
| 1 | XAMPP → Start MySQL (và Apache nếu dùng phpMyAdmin). |
| 2 | phpMyAdmin → Create database `youtubeai`, collation `utf8mb4_unicode_ci`. |
| 3 | Import `database/schema.sql` vào `youtubeai`. |
| 4 | Import `database/migration_add_auth_fields.sql` vào `youtubeai`. |
| 5 | Backend: sửa `application.properties` (user/pass MySQL cho XAMPP). |

Sau đó cài và chạy lần lượt: AI module (venv + requirements + .env) → Backend → Frontend như các mục 4 và 5.

---

## 8. Xử lý lỗi thường gặp

### Lỗi khi import `migration_add_auth_fields.sql`

- **Lỗi:** `ADD COLUMN IF NOT EXISTS` không được nhận (MySQL/MariaDB cũ).
- **Cách xử lý:** Mở file `database/migration_add_auth_fields.sql`, sửa các dòng `ADD COLUMN IF NOT EXISTS` thành `ADD COLUMN` (bỏ `IF NOT EXISTS`), rồi chạy lại. Chỉ chạy một lần; lần sau nếu báo cột đã tồn tại thì bỏ qua.

### Backend không kết nối được MySQL

- Kiểm tra XAMPP: MySQL đang chạy (port 3306).
- Kiểm tra `application.properties`: `username`, `password`, `url` đúng với cấu hình MySQL trong XAMPP.
- Nếu đổi port MySQL trong XAMPP thì sửa `spring.datasource.url` (ví dụ `...localhost:3307/youtubeai`).

### Frontend không gọi được Backend

- Đảm bảo backend chạy tại http://localhost:8080.
- Kiểm tra `frontend/src/services/apiClient.js` (hoặc file tương đương): base URL trỏ tới `http://localhost:8080`.

### AI Module không chạy

- Đảm bảo đã kích hoạt virtualenv và cài `pip install -r requirements.txt` (hoặc `requirements-basic.txt`).
- Port 5000 chưa bị ứng dụng khác chiếm.

Nếu bạn gửi thêm thông tin (hệ điều hành, đã cài XAMPP chưa, báo lỗi cụ thể khi import SQL hay khi chạy backend), có thể bổ sung thêm bước xử lý chi tiết hoặc checklist in ra để tick từng bước.
