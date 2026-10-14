# Project Rules for AI Agents

Tài liệu này là nguồn quy tắc chính khi agent phân tích, thiết kế hoặc chỉnh sửa dự án. Mọi thay đổi phải tuân thủ các nguyên tắc dưới đây và giữ nhất quán với code hiện có.

## 1. Bối cảnh dự án

- Dự án là frontend React phục vụ hệ thống quản lý và PWA du lịch/thuyết minh tự động.
- Ưu tiên hiện tại là xây dựng MVP có luồng nghiệp vụ hoàn chỉnh, ổn định và dễ trình bày.
- Tài liệu tham khảo nghiệp vụ nằm trong `_requirement/`. Không chỉnh sửa thư mục này nếu không được yêu cầu trực tiếp.
- Không tự ý bổ sung tính năng ngoài phạm vi yêu cầu. Khi yêu cầu chưa rõ, ưu tiên giải pháp đơn giản, dễ bảo trì.

## 2. Technology stack

Chỉ sử dụng stack đã được cấu hình:

- React 19 + Vite
- TypeScript strict
- Tailwind CSS v4
- shadcn/ui (`base-nova`, `baseColor: neutral`)
- Base UI primitives
- Lucide React cho icon
- Axios cho HTTP client

Không cài thêm thư viện nếu chức năng có thể được giải quyết hợp lý bằng stack hiện tại. Nếu thật sự cần dependency mới, phải giải thích lý do trước khi thêm.

## 3. Cấu trúc source code

```text
src/
├── assets/       # CSS global và static assets
├── components/
│   ├── ui/       # shadcn primitives, component dùng chung cấp thấp
│   └── ...       # component dùng chung cấp ứng dụng
├── hooks/        # reusable React hooks
├── lib/          # API client, utilities, config dùng chung
├── services/     # giao tiếp API và nghiệp vụ phía client
└── main.tsx      # application entry point
```

- Tách page/feature/component khi chức năng phát triển; không dồn toàn bộ UI và logic vào một file.
- Component chỉ dùng trong một feature nên đặt gần feature đó. Component dùng chung mới đưa vào `src/components/`.
- Không đặt business logic trong `src/components/ui/`.
- Không sửa trực tiếp shadcn primitive chỉ để đáp ứng một màn hình; ưu tiên `className`, composition hoặc wrapper component.
- Sử dụng alias đã cấu hình: `#components/*`, `#lib/*`, `#hooks/*`.
- Không tạo alias mới nếu chưa cập nhật đồng bộ cấu hình TypeScript/Vite/package.

## 4. TypeScript và React

- Viết functional component và React hooks; không dùng class component.
- Không sử dụng `any`. Dùng type/interface cụ thể; dùng `unknown` và type guard khi dữ liệu chưa đáng tin cậy.
- Khai báo kiểu dữ liệu API rõ ràng. Không truyền response thô xuyên suốt cây component.
- Component phải nhỏ, tập trung vào một trách nhiệm và có tên thể hiện đúng chức năng.
- Không lưu state có thể suy ra từ props/state khác. Không dùng effect cho phép tính thuần.
- Không gọi API trực tiếp rải rác trong component; đặt request trong `src/services/` hoặc lớp API dùng chung.
- Xử lý đầy đủ loading, empty, error và success state cho mọi luồng bất đồng bộ.
- Cleanup listener, timer, subscription và request có thể hủy khi component unmount.
- Không để `console.log`, mock data tạm, commented-out code hoặc TODO vô nghĩa trong code hoàn thiện.
- Tôn trọng ESLint và TypeScript hiện tại; không tắt rule bằng comment nếu chưa có lý do chính đáng.

## 5. Quy chuẩn UI doanh nghiệp

Giao diện phải tối giản, rõ ràng và phù hợp sản phẩm doanh nghiệp. Ưu tiên khả năng đọc, thao tác và phân cấp thông tin hơn hiệu ứng trang trí.

### Bắt buộc

- Dùng shadcn/ui làm nền tảng cho button, input, form, dialog, table, alert, drawer, sidebar, tooltip và các control tương ứng.
- Dùng semantic tokens có sẵn như `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`.
- Giữ palette trung tính. Màu primary dùng cho hành động chính; destructive chỉ dùng cho hành động nguy hiểm; màu trạng thái phải có ý nghĩa nhất quán.
- Dùng Geist đã cấu hình; không thêm font trang trí.
- Dùng Lucide icon với kích thước và stroke nhất quán. Icon phải hỗ trợ nội dung, không thay thế nhãn ở nơi dễ gây mơ hồ.
- Bố cục cần có phân cấp rõ: tiêu đề trang, mô tả ngắn, action, bộ lọc và nội dung chính.
- Khoảng cách sử dụng theo thang Tailwind nhất quán; ưu tiên mật độ vừa phải cho dashboard.
- Form phải có label rõ ràng, thông báo lỗi gần trường nhập và trạng thái disabled/loading khi submit.
- Table phải dễ quét, có header rõ, action gọn và có empty state.
- Hành động xóa hoặc không thể hoàn tác phải có bước xác nhận.

### Không được làm

- Không dùng gradient trang trí, glassmorphism, neon, glow hoặc shadow quá mạnh.
- Không dùng quá nhiều màu accent trên cùng màn hình.
- Không lạm dụng card: nội dung không cần nhóm thì không bọc card; tránh card lồng nhiều tầng.
- Không bo góc quá lớn, pill button tràn lan hoặc dùng badge cho nội dung thông thường.
- Không dùng emoji làm icon giao diện.
- Không thêm animation phô trương, parallax, hiệu ứng bay/nảy hoặc transition làm chậm thao tác.
- Không dùng ảnh nền trang trí nếu không mang giá trị nghiệp vụ.
- Không hard-code màu tùy ý như `text-blue-500` hoặc mã hex khi semantic token có thể đáp ứng.

## 6. Responsive và accessibility

- Thiết kế mobile-first và hoạt động tốt từ màn hình điện thoại đến desktop.
- Không tạo horizontal overflow ngoài các vùng chủ động như bảng dữ liệu.
- Navigation, dialog, drawer và table phải có phương án phù hợp trên mobile.
- Mọi control tương tác phải dùng phần tử semantic (`button`, `a`, `input`, ...), không dùng `div` giả button.
- Đảm bảo thao tác bằng bàn phím, focus visible và thứ tự tab hợp lý.
- Icon button bắt buộc có accessible name (`aria-label`) và tooltip khi cần.
- Input phải liên kết label; ảnh có `alt`; heading theo đúng thứ bậc.
- Không truyền tải trạng thái chỉ bằng màu sắc; kết hợp text hoặc icon.
- Tôn trọng `prefers-reduced-motion` và giữ contrast dễ đọc.

## 7. API, authentication và dữ liệu

- Dùng API client dùng chung trong `src/lib/api.ts`; không tạo Axios instance mới tùy tiện.
- Request cần authentication phải tuân theo cơ chế hiện có, bao gồm cookie/credential nếu backend yêu cầu.
- Không lưu access token, refresh token hoặc dữ liệu nhạy cảm trong source code hay log trình duyệt.
- Không đưa secret/backend key vào biến môi trường có tiền tố `VITE_`; mọi biến `VITE_*` đều có thể bị lộ cho client.
- Xử lý lỗi API thành thông báo thân thiện; không hiển thị stack trace hoặc raw server error cho người dùng.
- Validate dữ liệu ở ranh giới nhập liệu và không tin tưởng dữ liệu từ API một cách tuyệt đối.
- Với danh sách có thể lớn, chuẩn bị pagination/filter từ API thay vì tải tất cả rồi lọc trên client.

## 8. PWA và hiệu năng

- PWA/Service Worker/Workbox thuộc frontend công khai dành cho khách tham quan; không cache dữ liệu quản trị hoặc response chứa thông tin nhạy cảm.
- Không áp dụng cache chung cho mutation (`POST`, `PUT`, `PATCH`, `DELETE`).
- Với dữ liệu công khai: chọn chiến lược cache theo độ mới cần thiết; ảnh/audio/static asset có thể ưu tiên cache, API động nên ưu tiên network và có fallback phù hợp.
- Lazy-load màn hình hoặc tài nguyên nặng khi có lợi ích rõ ràng.
- Tránh render lại không cần thiết, nhưng không lạm dụng `useMemo`/`useCallback` khi chưa có vấn đề đo được.
- Luôn cung cấp feedback cho thao tác kéo dài và ngăn submit lặp.

## 9. Nội dung và ngôn ngữ

- Nội dung giao diện mặc định phải rõ ràng, ngắn gọn và chuyên nghiệp.
- Không dùng câu đùa, tiếng lóng hoặc placeholder thiếu nghiêm túc trong sản phẩm.
- Không trộn tiếng Việt và tiếng Anh trong cùng một màn hình, ngoại trừ tên riêng hoặc thuật ngữ kỹ thuật cần thiết.
- Chuẩn bị text theo hướng dễ đưa vào i18n; tránh ghép câu từ nhiều đoạn động nếu làm thay đổi ngữ pháp.
- Format ngày giờ, số và tiền tệ theo locale thay vì nối chuỗi thủ công.

## 10. Quy trình thay đổi

Trước khi hoàn tất một thay đổi, agent phải:

1. Đọc code liên quan và tái sử dụng pattern/component hiện có.
2. Giữ phạm vi thay đổi nhỏ nhất đủ giải quyết yêu cầu.
3. Không xóa hoặc ghi đè code chưa rõ nguồn gốc nếu chưa kiểm tra.
4. Chạy kiểm tra tối thiểu:

```bash
npm run lint
npm run build
```

5. Sửa lỗi do thay đổi của mình gây ra; không che lỗi bằng cách tắt TypeScript/ESLint.
6. Báo rõ file đã thay đổi, kết quả kiểm tra và giới hạn còn lại nếu có.

## 11. Definition of Done

Một tính năng chỉ được xem là hoàn thành khi:

- Luồng chính hoạt động đúng theo yêu cầu nghiệp vụ.
- Có loading, empty, error và success state phù hợp.
- Responsive trên mobile và desktop.
- Có keyboard/focus/accessibility cơ bản.
- UI nhất quán với shadcn và quy chuẩn doanh nghiệp ở trên.
- Không lộ secret hoặc cache dữ liệu nhạy cảm.
- `npm run lint` và `npm run build` thành công.
