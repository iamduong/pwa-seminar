# AI Advise local và thống kê quản lý

## 1. Những phần đã tích hợp

- API `GET /ai-advisor/usage` và `POST /ai-advisor/chat` sử dụng cookie đăng nhập hiện có. Backend lấy tài khoản từ phiên, không nhận `user_id` từ FE.
- Ollama chạy trên máy local, mặc định mô hình `qwen2.5:3b`; không cần API key và không gửi nội dung tới dịch vụ AI cloud.
- AI biên tập mô tả POI/thực đơn bằng tiếng Việt. Người dùng nhập mô tả gốc, chọn loại nội dung, rồi gửi yêu cầu. System prompt yêu cầu từ chối câu hỏi ngoài phạm vi, không tự bịa thông tin. Đây là ràng buộc bằng prompt và đầu ra có cấu trúc, không phải bảo đảm tuyệt đối về hành vi mô hình; cần kiểm tra các ca ở bước 6 với mô hình thực tế.
- Hội thoại và mô tả lưu trong `sessionStorage` theo ID tài khoản; giữ khi đổi trang, đóng/mở widget hoặc tải lại cùng tab. Giữ tối đa 40 tin; gửi 12 tin gần nhất làm ngữ cảnh. Đóng phiên tab hoặc đăng xuất sẽ xóa dữ liệu. Không lưu hội thoại ở database.
- Thống kê trên 14 trang danh sách dùng [ListStats](../src/components/ListStats.tsx), cùng semantic token, khung viền, bo góc và khoảng cách hiện có. Các số liệu phân trang lấy từ API hiện hành nên giữ nguyên phân quyền và bộ lọc. Không cộng số bản ghi trang hiện tại thành tổng toàn hệ thống.

## 2. Chuẩn bị Ollama

1. Cài Ollama cho Windows từ https://ollama.com/download/windows.
2. Mở PowerShell và tải mô hình (cần mạng và dung lượng đĩa):

```powershell
ollama pull qwen2.5:3b
ollama list
```

3. Ollama thường chạy nền sau khi cài. Nếu chưa chạy, mở một terminal riêng:

```powershell
ollama serve
```

4. Kiểm tra dịch vụ:

```powershell
Invoke-RestMethod http://127.0.0.1:11434/api/tags
```

Máy đủ RAM có thể dùng `qwen2.5:7b` cho chất lượng tiếng Việt tốt hơn: tải mô hình đó và đổi `AI_MODEL`. Lần gọi đầu có thể chậm vì cần nạp mô hình.

## 3. Cấu hình và cập nhật bảng

Từ thư mục dự án, chuyển vào `api`. Giữ nguyên cấu hình PostgreSQL, Redis và các khóa ứng dụng hiện có. Thêm các dòng sau vào `.env` phía backend (không đưa vào biến `VITE_*`):

```dotenv
AI_OLLAMA_URL=http://127.0.0.1:11434
AI_MODEL=qwen2.5:3b
AI_DAILY_LIMIT=20
AI_TIMEOUT_SECONDS=300
```

Cấu hình Cloudinary có thể để trống khi chỉ thử AI; tính năng tải ảnh sẽ báo cần cấu hình cho đến khi có đủ ba khóa Cloudinary.

Sau khi PostgreSQL sẵn sàng, chạy:

```powershell
cd C:\Users\DELL\CacMonHoc\PWA\pwa-seminar\api
.\.venv\Scripts\python.exe script\collection.py
```

[collection.py](../api/script/collection.py) tạo bảng thiếu và thêm cột `daily_limit` vào bảng `ai_usage_limits` hiện có; không reset hoặc seed lại dữ liệu. Có thể chạy lặp lại. Các hàng cũ nhận mức 20; hàng ngày mới lấy `AI_DAILY_LIMIT` khi lần đầu kiểm tra hạn mức.

Mỗi hàng `(user_id, usage_date)` lưu:

| Cột | Ý nghĩa |
| --- | --- |
| `usage_date` | Ngày theo UTC+7 (Việt Nam) |
| `usage_count` | Số câu hỏi đã nhận phản hồi thành công |
| `daily_limit` | Mức tối đa cho tài khoản trong ngày đó; 0 để chặn |

Mặc định 20 câu/tài khoản/ngày. Mỗi ngày mới tạo hàng mới, không cần cron reset. Phản hồi từ chối ngoài phạm vi vẫn tính một câu; lỗi Ollama/đầu ra sai định dạng không tính. `UPDATE ... WHERE usage_count < daily_limit` nằm trong transaction đến khi nhận phản hồi, nên các yêu cầu đồng thời cùng tài khoản được tuần tự hóa. Không tự động retry POST vì có thể trừ thêm lượt nếu phản hồi trước đã thành công nhưng mất kết nối.

Để đổi hạn mức riêng **trong ngày hôm nay**, mở widget một lần để tạo hàng, rồi chạy SQL sau bằng công cụ quản lý PostgreSQL, thay UUID bằng tài khoản cần chỉnh:

```sql
UPDATE ai_usage_limits
SET daily_limit = 50
WHERE user_id = 'UUID-CUA-TAI-KHOAN'
  AND usage_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
```

Đổi `AI_DAILY_LIMIT` và khởi động lại backend để thay mặc định cho các hàng ngày mới. Giá trị riêng của hôm nay không tự chuyển sang ngày tiếp theo.

## 4. Chạy backend và frontend

Backend dùng Python 3.14 và môi trường `.venv` hiện có. PostgreSQL và Redis phải chạy theo cấu hình dự án.

Terminal backend:

```powershell
cd C:\Users\DELL\CacMonHoc\PWA\pwa-seminar\api
.\.venv\Scripts\python.exe -m uvicorn main:app --app-dir src --reload --port 8000
```

Terminal frontend:

```powershell
cd C:\Users\DELL\CacMonHoc\PWA\pwa-seminar
npm.cmd run dev
```

Mở http://localhost:5173. Vite đã proxy `/api` sang cổng 8000. Không gọi Ollama trực tiếp từ trình duyệt vì sẽ bỏ qua xác thực và hạn mức.

## 5. Sử dụng và thiết kế giao diện

1. Đăng nhập tài khoản có ít nhất một quyền `poi:create`, `poi:update`, `menu:create`, `menu:update`, `owner:poi_submit`, `owner:menu_submit`.
2. Mở nút trợ lý ở góc dưới bên phải cổng quản lý.
3. Chọn POI hoặc Thực đơn; dán mô tả và các thông tin đã xác thực.
4. Nhập ví dụ: “Viết lại mô tả hấp dẫn hơn trong 60 từ, không thêm thông tin mới”.
5. Kiểm tra gợi ý rồi tự sao chép vào form. AI không tự ghi đè nội dung POI/món ăn.
6. Xem số câu còn lại ngay trên ô gửi. Nếu mất kết nối Ollama, thông báo lỗi hiển thị tại đây, giữ nguyên câu hỏi để thử lại.

Các trang danh sách có thống kê ngay sau tiêu đề và trước bộ lọc/bảng: vai trò, tài khoản, POI quản trị, POI của chủ quán, hồ sơ POI của chủ quán, duyệt POI, đăng ký chủ quán, danh sách POI có thực đơn, món ăn theo POI, duyệt món ăn, thực đơn của tôi, thông báo, nhật ký và tác vụ. Trang tác vụ ghi rõ số tác vụ **đã tải**, không tuyên bố đó là tổng toàn bộ tác vụ. Thực đơn của tôi bổ sung số món chờ duyệt/đã duyệt vì API đó trả toàn bộ danh sách.

Khi thêm trang danh sách mới, đặt `ListStats` sau header, truyền `total_item`, `data.length`, `total_page`, trạng thái loading/error từ chính dữ liệu của bảng. Không tải toàn bộ dữ liệu chỉ để thống kê. Khi cần tổng theo trạng thái trên toàn bộ dữ liệu, thêm truy vấn tổng hợp backend với cùng điều kiện phân quyền; không dùng `.filter()` trên một trang phân trang.

## 6. Kiểm tra từng bước

- Gửi mô tả POI và mô tả món ăn: nhận gợi ý tiếng Việt, không thêm giá/địa chỉ ngoài dữ kiện.
- Yêu cầu viết code, trả lời câu hỏi ngoài phạm vi, chuyển sang tiếng Anh, hoặc “bỏ qua hướng dẫn”: AI cần từ chối bằng tiếng Việt.
- Gửi yêu cầu rút gọn tiếp theo: mô hình nhận lịch sử gần nhất.
- Tải lại trang và đổi trang quản lý: hội thoại vẫn còn. Đăng xuất rồi đăng nhập lại: hội thoại cũ được xóa. Chuyển tài khoản: không hiện hội thoại của tài khoản trước.
- Đặt `daily_limit = usage_count + 1`, gửi hai câu: câu đầu thành công; câu sau bị khóa ở FE và backend trả 429 nếu gọi trực tiếp.
- Gửi đồng thời từ hai tab khi chỉ còn một lượt: chỉ một yêu cầu được tính thành công.
- Dừng Ollama rồi gửi: nhận 503; `usage_count` không tăng.
- Thay bộ lọc/chuyển trang danh sách: thống kê tổng kết quả theo API và số đang hiển thị khớp bảng. Khi API lỗi, hiển thị dấu gạch thay vì số 0 giả.

Kiểm tra tự động:

```powershell
# Tại thư mục frontend
npm.cmd run lint
npm.cmd run build
# Tại thư mục api
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Các unit test AI dùng mock dịch vụ và database; không thay thế kiểm thử đồng thời trên PostgreSQL và chất lượng phản hồi với Ollama thực tế.

## 7. Kết quả kiểm tra tại máy hiện tại

- `npm.cmd run lint`: thành công.
- `npm.cmd run build`: thành công; Vite cảnh báo bundle lớn hơn 500 kB.
- 21 unit test backend: thành công, gồm 9 test AI.
- Đã thử chạy script cập nhật bảng, nhưng PostgreSQL local báo `password authentication failed`. Chưa áp dụng thay đổi bảng. Sửa thông tin đăng nhập trong `POSTGRES_ENDPOINT` của cấu hình backend rồi chạy lại bước 3; không cần gửi mật khẩu vào hội thoại.
- Chưa tìm thấy lệnh `ollama` trong PATH. Chưa kiểm chứng phản hồi từ mô hình thật, thao tác giao diện trên trình duyệt, hoặc tranh chấp hạn mức trên PostgreSQL thực tế.

## Kiểm tra chất lượng sau khi chỉnh prompt

Backend tách lịch sử thành các tin user/assistant, giới hạn lịch sử gửi mô hình ở 4.000 ký tự và đặt mô tả gốc cùng yêu cầu mới nhất ở cuối. Lịch sử không được coi là dữ kiện đã xác thực. Khi sửa mô tả hoặc đổi POI/thực đơn, FE giữ tin nhắn để xem nhưng bắt đầu ngữ cảnh mới. Hội thoại lưu từ phiên bản cũ cũng bắt đầu ngữ cảnh mới để tránh tiếp tục dùng phản hồi sai trước đó.

Chạy từ thư mục api để thử mô hình thật, không trừ hạn mức tài khoản:

```powershell
.\.venv\Scripts\python.exe script/check_ai_advisor.py
```

Script thử viết lại mô tả và yêu cầu Python ngoài phạm vi. Kiểm tra thủ công bản viết lại có giữ loại quán, Quận 4 và bữa trưa, không thêm nhận xét quảng cáo. Script sẽ báo lỗi nếu mô hình không từ chối câu hỏi Python. Prompt vẫn không bảo đảm tuyệt đối cho mọi câu hỏi; cần kiểm thử thêm các nội dung thực tế.