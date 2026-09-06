# BÁO CÁO TỔNG HỢP DỰ ÁN - MINDX GAME ASSET GENERATOR

Tài liệu này là bản tổng hợp toàn bộ các báo cáo, đặc tả, yêu cầu kỹ thuật và hướng dẫn của dự án MindX Game Asset Generator.

---

## PHẦN 1: ĐẶC TẢ YÊU CẦU CHỨC NĂNG (SRS)
*Nguồn: SRS_GAME_MATERIAL_TOOL*

### 1. Các yêu cầu chức năng
**Các tác nhân**
- Học sinh: Đối tượng chính sử dụng công cụ để tạo tài nguyên (sprite, tileset) cho các dự án game trên Scratch hoặc GameMaker
- AI Engine: Tác nhân hỗ trợ (Supporting Actor), đóng vai trò xử lý các thuật toán tạo sinh, tách nền và tối ưu hóa

**Danh sách các chức năng chính**
1. Sinh Background với các kích thước chuẩn
2. Sinh Sprite từ hình ảnh đầu vào
3. Sinh Tilesheet để tạo animation
4. Sinh Tileset môi trường

### 1.1 Sinh Background với các kích thước chuẩn
- **FR-01.1 Chọn kích thước chuẩn**: Hệ thống cung cấp danh sách tỉ lệ: 16:9 (1920×1080) (1280x720), 4:3 (480x360), 9:16 (1080×1920)
- **FR-01.2 Nhập mô tả phong cảnh**: Học sinh nhập văn bản mô tả bằng tiếng Việt hoặc tiếng Anh.
- **FR-01.3 Sinh ảnh nền**: AI xử lý prompt, trả về ảnh đúng kích thước, phong cách game 2D.
- **FR-01.4 Tải kết quả**: Xuất file định dạng PNG.

### 1.2 Sinh Sprite từ ảnh đầu vào
- **FR-02.1 Tải ảnh đầu vào**: Hỗ trợ định dạng JPG, PNG, WEBP. Dung lượng tối đa 10MB.
- **FR-02.2 Xóa nền tự động**: AI nhận diện chủ thể chính, tách nền, trả về ảnh trong suốt.
- **FR-02.3 Chuyển đổi Pixel Art**: Vẽ lại chủ thể theo phong cách Pixel Art 8-bit.
- **FR-02.4 Chọn kích thước đầu ra**: Hỗ trợ: 32×32, 64×64, 128×128 px.
- **FR-02.5 Tải kết quả**: Xuất file PNG, nền trong suốt.

### 1.3 Sinh Animation Tilesheet
- **FR-03.1 Sinh 10 frame**: AI tạo 10 frame liên tiếp, giữ nguyên đặc điểm nhân vật.
- **FR-03.2 Xuất Tilesheet**: Ghép 10 frame thành ảnh ngang, kích thước tổng = frame × 10.
- **FR-03.3 Preview animation**: Hiển thị ảnh động tua nhanh để kiểm tra trước khi tải.
- **FR-03.4 Tải kết quả**: Xuất file PNG.

### 1.4 Sinh Tileset Môi trường
- **FR-04.1 Nhập mô tả môi trường**: Hỗ trợ: 16x16, 32x32, 64x64 px cho mỗi ô. Mô tả loại địa hình: "đất, cỏ, đá", "gạch dungeon", "nền băng tuyết"...
- **FR-04.2 Sinh tileset**: AI tạo các tile có viền khớp nối, đảm bảo tính liền mạch khi ghép cạnh nhau trong game engine.
- **FR-04.3 Tải kết quả**: Xuất file PNG tileset.

---

## PHẦN 2: BÁO CÁO KIẾN TRÚC HỆ THỐNG
*Nguồn: Bao_Cao_Kien_Truc_MindXAsset*

### 1. Brainstorm các tính năng thử nghiệm tạo ảnh
- **Mô hình AI**: Hugging Face, Gemini, Pollinations
- **Loại Tài nguyên**: Nhân vật, Vật phẩm, Hình nền, UI, VFX
- **Phong cách (Style)**: Pixel Art, 3D Low Poly, Anime, Voxel...
- **Góc nhìn (Angle)**: Isometric, Từ trên xuống, Side-scroller...
- **Tùy chỉnh Nền**: Checkbox: Tách nền trong suốt
- **Bảng màu (Palette)**: Màu pastel, Màu rực rỡ (Vibrant), Đơn sắc (Monochrome), Tương phản cao (High Contrast)
- **Cấu hình Nâng cao**: Tạo Tile-set, Chất lượng cao / Render chi tiết, Giữ lại Seed.

### 2. Kiến trúc Hệ thống cho FastAPI
Dự án có thể sử dụng Node.js và Java Spring Boot. Nhưng để tối ưu hóa khi có nhiều người dùng và tích hợp AI thì chưa phải lựa chọn tốt nhất.
**Giải pháp Đề xuất: Tích hợp sử dụng Python FastAPI**
- Tích hợp Native: Dễ dàng nhúng PyTorch, Hugging Face Diffusers, OpenCV (tách nền, resize).
- Hiệu năng Asynchronous: Xử lý bất đồng bộ (async/await) ngay từ lõi, cho phép nhận và xử lý hàng nghìn luồng sinh ảnh mà không bị treo hệ thống.

### 3. Lưu trữ (Storage & Database)
- **Giai đoạn Thử nghiệm (MVP)**: Khuyến nghị dùng Cloudinary hoặc Firebase Storage. Triển khai nhanh, có sẵn bộ đệm CDN.
- **Giai đoạn Vận hành (Production)**: Chuyển dịch sang AWS S3 hoặc Google Cloud Storage.

---

## PHẦN 3: YÊU CẦU TÍCH HỢP TỪ TEAM DEV GỬI TEAM AI
*Nguồn: AI_Integration_Requirements*

Hạng mục: Bổ sung siêu dữ liệu (Metadata) cho tính năng Tạo Sprite Sheet / Animation.

Để chức năng "Cắt Sprite Sheet Thủ Công và Tự Động" trên giao diện (Frontend) hoạt động chính xác, team Dev cần phía AI khi trả về kết quả hình ảnh, vui lòng trả kèm một Object JSON chứa Metadata của cấu trúc ảnh đó.

```json
{
  "image": "data:image/png;base64,...",
  "metadata": {
    "total_frames": 8,
    "layout_format": "horizontal", 
    "frame_width": 64,
    "frame_height": 64,
    "columns": 8,
    "rows": 1
  }
}
```

**Lý do cần thiết:**
Hiện tại, khi team AI chỉ trả về một bức ảnh to (Image) duy nhất, team Dev ở Frontend/Backend phải cho người dùng TỰ ĐIỀN THỦ CÔNG số lượng khung hình và TỰ ĐO kích thước để cắt. Nếu có Metadata từ AI trả về, hệ thống sẽ tự động vẽ lưới cắt (Grid) chuẩn xác 100% và chạy được Preview Animation mượt mà ngay lập tức.

---

## PHẦN 4: BÁO CÁO NGHIÊN CỨU, TEST CASE VÀ TIẾN ĐỘ AI
*Nguồn: ai_asset_content*

### 1. Nghiên cứu Pipeline prompt-to-image (Pollinations.ai)
- **Background**: loại bỏ nhân vật, người, HUD/UI lẫn vào khung cảnh.
- **Sprite**: loại bỏ nền cảnh, nhiều vật thể/nhiều tư thế trong 1 ảnh.
- **Sprite sheet**: tránh các khung hình lệch tỉ lệ, ghép dính vào nhau.
- **Tile**: tránh việc model tự vẽ nguyên bộ tileset, có lưới/thước kẻ.

### 2. Xử lý hậu kỳ pixel art
- `remove_background`: tách nền trước khi resize.
- `fit_to_canvas (LANCZOS)`: canh khung theo tỉ lệ chuẩn trước khi pixel hoá.
- `apply_pixel_art_effect`: resample BOX khi thu nhỏ, NEAREST khi phóng to.
- `reduce_palette`: giới hạn số màu để ra đúng pixel art.
- `binarize_alpha`: ép kênh alpha về 0 hoặc 255.

### 3. Tiến độ hiện tại
- **Pipeline sinh ảnh cơ bản**: Đã hoàn thành (generate_background, generate_sprite).
- **Sửa lỗi chất lượng pixel art**: Đã hoàn thành.
- **Sinh tileset dạng lưới cho GameMaker**: Đã hoàn thành.
- **Bộ preset tile dựng sẵn**: Đã hoàn thành.
- **Tilesheet hoạt ảnh**: Đang thực hiện (generate_tileset_pack cho sprite chuyển động).
- **Image-to-image (model kontext)**: Tạm chặn (yêu cầu xác thực/credit).

---

## PHẦN 5: HƯỚNG DẪN TÁI TẠO DỰ ÁN & TÍNH NĂNG HIỆN TẠI
*Nguồn: Bao_Cao_Tai_Tao_Du_An*

Tài liệu này hướng dẫn chi tiết cách tái tạo lại toàn bộ dự án từ con số 0. Dự án được thiết kế với giao diện chuẩn MindX (Trắng, Đỏ, Đen), tối ưu hiệu năng và cấu trúc linh hoạt để hỗ trợ gọi đa mô hình AI.

### 1. Cấu Trúc Tổng Quan
Dự án được chuẩn hóa kiến trúc sử dụng Node.js Express làm máy chủ API trung tâm kết nối với AI Engine:
1. **Frontend**: Ứng dụng ReactJS sử dụng Vite và TailwindCSS.
2. **Backend Chính Thức (Node.js Express)**: Máy chủ API duy nhất phục vụ toàn bộ chức năng giao diện (`backend/server.js`, port 5000), tích hợp với Python CLI module (`ai_module`).
3. **Module Tham Khảo (Không chạy song song)**:
   - `springboot-backend`: Bản thiết kế Java Spring Boot mẫu (cấu hình port 8080 nếu chạy độc lập).
   - `python-backend`: Bản thiết kế đề xuất FastAPI cho giai đoạn mở rộng microservices trong tương lai.

### 2. Frontend (React + Vite + TailwindCSS)
Giao diện Light Mode, màu chủ đạo Đỏ (MindX) / Trắng / Đen. Giao diện này cung cấp các tuỳ chọn: Ý tưởng, Mô hình (Hugging Face, Gemini, Pollinations), Loại Asset, Phong cách, Góc nhìn, và Tách nền.

### 3. Cấu Hình Biến Môi Trường (Backend)
Sao chép file mẫu và điền API Keys trước khi chạy:
```bash
cd backend
cp .env.example .env
# Chỉnh sửa file .env với API Key thật (POLLINATIONS_API_KEY, HUGGINGFACE_API_KEY, CLOUDINARY_*)
```

### 4. Khởi Chạy Ứng Dụng (Standard Execution)
Chỉ cần khởi chạy 2 tiến trình sau:
1. **Backend (Node.js)**:
   ```bash
   cd backend
   node server.js
   ```
   *(Backend chạy tại `http://localhost:5000`)*

2. **Frontend (React Vite)**:
   ```bash
   cd frontend
   npm run dev
   ```
   *(Truy cập `http://localhost:5173` trên trình duyệt để sử dụng đầy đủ các chức năng).*

