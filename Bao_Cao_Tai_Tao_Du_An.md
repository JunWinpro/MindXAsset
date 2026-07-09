# Báo Cáo Tái Tạo Dự Án - MindX Game Asset Generator

Tài liệu này hướng dẫn chi tiết cách tái tạo lại toàn bộ dự án từ con số 0. Dự án được thiết kế với giao diện chuẩn MindX (Trắng, Đỏ, Đen), tối ưu hiệu năng và cấu trúc linh hoạt để hỗ trợ gọi đa mô hình AI (Hugging Face, Gemini, Pollinations).

## 1. Cấu Trúc Tổng Quan
Dự án được chia làm 3 phần chính (theo thiết kế hiện tại) và định hướng nâng cấp lên Python FastAPI:
1. **Frontend**: Ứng dụng ReactJS sử dụng Vite và TailwindCSS.
2. **Backend (Node.js)**: Máy chủ ExpressJS nhẹ để xử lý API nhanh (hiện đang dùng).
3. **Backend (Spring Boot)**: Máy chủ Java mạnh mẽ để quản lý logic phức tạp hơn (hiện đang dùng).
4. **Backend (Python FastAPI) - Đề xuất Kiến trúc mới**: Giải pháp tối ưu thay thế Node.js/Java để chạy các mô hình AI/Deep Learning native, xử lý bất đồng bộ tốt hơn với hàng nghìn request.

---

## 2. Hướng Dẫn Khởi Tạo Frontend (React + Vite + TailwindCSS)

**Mục tiêu**: Xây dựng giao diện Light Mode, màu chủ đạo Đỏ (MindX) / Trắng / Đen, loại bỏ hiệu ứng kính mờ (glassmorphism) để tối ưu tốc độ render và đạt chuẩn Clean UI.

### Bước 1: Khởi tạo Project
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Bước 2: Cấu hình TailwindCSS
Sửa file `tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mindx-red': '#DC2626', // Màu đỏ chủ đạo MindX
        'mindx-black': '#111827',
      }
    },
  },
  plugins: [],
}
```
Thêm vào `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #F8F9FA;
}
```

### Bước 3: Giao diện App.jsx
Sao chép mã nguồn giao diện Light Mode đã được chỉnh sửa vào `frontend/src/App.jsx`. Giao diện này cung cấp các tuỳ chọn: Ý tưởng, Mô hình (Hugging Face, Gemini, Pollinations), Loại Asset, Phong cách, Góc nhìn, và Tách nền.

---

## 3. Hướng Dẫn Khởi Tạo Backend 1: Node.js (Express)

### Bước 1: Cài đặt
```bash
mkdir backend
cd backend
npm init -y
npm install express cors dotenv axios
```

### Bước 2: Cấu hình Môi trường
Tạo file `.env`:
```env
PORT=5000
POLLINATIONS_API_KEY=your_pollinations_key
HUGGINGFACE_API_KEY=your_huggingface_key
```

### Bước 3: Logic Server (server.js)
Tạo file `server.js` và cài đặt 2 endpoints:
- `POST /api/generate-image`
- `POST /api/generate-image-hf`

**Lưu ý quan trọng cần ghi nhớ để tránh lỗi hệ thống:**
1. Endpoint Inference của HuggingFace phải là `https://api-inference.huggingface.co/models/...` thay vì `router.huggingface.co`.
2. Khi xử lý file nhị phân (hình ảnh từ AI) qua `axios` với cấu hình `responseType: 'arraybuffer'`, cần convert cẩn thận sang chuỗi Base64 bằng lệnh: `Buffer.from(response.data).toString('base64')`.

---

## 4. Hướng Dẫn Khởi Tạo Backend 2: Java Spring Boot

### Bước 1: Khởi tạo Project Spring Boot
Sử dụng Spring Initializr (https://start.spring.io/):
- Project: Maven
- Language: Java (17+)
- Dependencies: Spring Web, Lombok.

### Bước 2: Cấu hình application.properties
Mở `src/main/resources/application.properties` và cấu hình bảo mật:
```properties
server.port=5000
pollinations.api.key=your_pollinations_key
huggingface.api.key=your_huggingface_key
```

### Bước 3: Viết Controller
Trong `GenerateImageController.java`, tạo REST endpoints tương ứng.
**Quy tắc bảo mật bắt buộc:**
- Tuyệt đối không hardcode API Key (Vd: `sk_z8VxYkQq...`) trong source code. Luôn luôn gọi qua biến môi trường hoặc `@Value("${pollinations.api.key}")`.
- Sử dụng `URLEncoder.encode(text, StandardCharsets.UTF_8.toString())` để chuẩn hoá Prompt URL, tránh lỗi dập link HTTP khi có ký tự đặc biệt.

---

## 5. Hướng Dẫn Kiến Trúc Đề Xuất (Tương lai): Python FastAPI

Theo như **Báo cáo Kiến trúc hệ thống** đã được phê duyệt, dự án cần sử dụng Python FastAPI để tối ưu hoá hiệu suất khi có lượng lớn người dùng (High Concurrency) và dễ dàng nhúng các thư viện Xử lý Ảnh nội bộ (OpenCV, PyTorch Diffusers).

### Cài đặt môi trường
```bash
mkdir fastapi-backend
cd fastapi-backend
python -m venv venv
source venv/bin/activate # (Mac/Linux) hoặc venv\Scripts\activate (Windows)
pip install fastapi uvicorn httpx python-dotenv
```

### Code Khung FastAPI (main.py) mẫu để nâng cấp
Tạo file `main.py` để thay thế dần Node.js và Java trong giai đoạn 2 của dự án:
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import base64
import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MindX Asset Generator FastAPI")

class ImageRequest(BaseModel):
    prompt: str
    model: str = "flux"
    assetType: str = ""
    artStyle: str = ""
    perspective: str = ""
    transparent: bool = False

@app.post("/api/generate-image")
async def generate_image(req: ImageRequest):
    if not req.prompt:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp prompt")
    
    final_prompt = f"{req.prompt}, {req.assetType}, {req.artStyle} style, {req.perspective} perspective"
    encoded_prompt = urllib.parse.quote(final_prompt)
    url = f"https://gen.pollinations.ai/image/{encoded_prompt}?model={req.model}"
    
    if req.transparent:
        url += "&transparent=true"
        
    api_key = os.getenv("POLLINATIONS_API_KEY")
    headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            base64_image = base64.b64encode(response.content).decode('utf-8')
            return {"image": f"data:image/jpeg;base64,{base64_image}"}
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail="Lỗi từ API Pollinations")

if __name__ == "__main__":
    import uvicorn
    # Cấu hình port 5000 để chạy song song hoặc thay thế hoàn toàn Backend cũ
    uvicorn.run(app, host="0.0.0.0", port=5000)
```

**Cách chạy Server**: `uvicorn main:app --reload --port 5000`

---

## 6. Tổng Kết và Chạy Ứng Dụng (Demo)
Để khởi chạy hệ thống ngay lập tức nhằm phục vụ buổi Demo:
1. **Mở Terminal 1 (Giao diện Frontend)**: 
   ```bash
   cd frontend
   npm run dev
   ```
2. **Mở Terminal 2 (Chọn 1 trong 2 Backend)** (Do cả 2 đều sử dụng cổng 5000 nên chỉ chạy 1):
   - Nếu chạy **Node.js**:
     ```bash
     cd backend
     node server.js
     ```
   - Nếu chạy **Spring Boot**:
     ```bash
     cd springboot-backend
     ./mvnw spring-boot:run
     ```
3. Truy cập vào đường dẫn Frontend trên trình duyệt (thường là `http://localhost:5173`). Bạn sẽ thấy giao diện **Light Mode Đỏ - Trắng - Đen** hoạt động rất nhanh và mượt mà!
