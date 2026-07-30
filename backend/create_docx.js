const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const path = require('path');

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    text: "Yêu cầu Tích hợp AI Team - Dev Team",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    children: [
                        new TextRun("Tài liệu này liệt kê các yêu cầu kỹ thuật và định dạng dữ liệu mà đội ngũ Dev cần đội ngũ AI cung cấp để đảm bảo tính năng \"Game Asset Studio\" hoạt động hoàn hảo khi kết nối lên nền tảng web."),
                    ],
                }),
                new Paragraph({
                    text: "1. Yêu cầu về tham số và cấu hình",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph("Cần hỗ trợ chạy qua CLI command cho tất cả các tính năng."),
                new Paragraph({ text: "- Phải có flag --web-json để xuất JSON output thuần túy ra stdout (không được in log linh tinh làm hỏng chuỗi JSON).", bullet: { level: 0 } }),
                new Paragraph({ text: "- Lệnh tạo Background cần nhận tham số size (VD: --size background_hd, --size background_4k), --time (day/night/dusk/dawn)", bullet: { level: 0 } }),
                new Paragraph({ text: "- Lệnh tạo Character/Item (Sprite) cần nhận tham số size, pose, style.", bullet: { level: 0 } }),
                new Paragraph({ text: "- Lệnh tạo Tilesheet (hoạt ảnh ngang) cần nhận tham số --frames, --action (chạy, nhảy, đứng yên).", bullet: { level: 0 } }),
                new Paragraph({ text: "- Lệnh tạo Tileset (map/gạch) cần nhận tham số --columns, --cell-size (VD: 32x32, 64x64).", bullet: { level: 0 } }),
                
                new Paragraph({
                    text: "2. Định dạng JSON trả về (--web-json)",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph("Mọi response khi có --web-json cần phải có cấu trúc tối thiểu như sau:"),
                new Paragraph({
                    text: `{\n  "asset_id": "uuid-string",\n  "image": "data:image/png;base64,iVBORw0KGgo...",\n  "metadata": {\n    "columns": 8,\n    "rows": 4,\n    "frame_width": 32,\n    "frame_height": 32,\n    "format": "png",\n    "seed": 12345\n  },\n  "warnings": []\n}`,
                    style: "Code",
                }),
                new Paragraph({ text: "Chi tiết Metadata bắt buộc phải có cho các loại asset:", heading: HeadingLevel.HEADING_3 }),
                new Paragraph({ text: "Tileset / Tilesheet:", bullet: { level: 0 } }),
                new Paragraph({ text: "columns: Tổng số cột (số ô theo chiều ngang).", bullet: { level: 1 } }),
                new Paragraph({ text: "rows: Tổng số hàng (số ô theo chiều dọc, đối với tilesheet thường rows = 1).", bullet: { level: 1 } }),
                new Paragraph({ text: "frame_width: Chiều rộng của 1 ô (frame).", bullet: { level: 1 } }),
                new Paragraph({ text: "frame_height: Chiều cao của 1 ô.", bullet: { level: 1 } }),
                new Paragraph({ text: "- Nhờ có metadata này, Dev team mới có thể lập trình module tự động cắt ảnh (auto slice) và Preview Animation cho người dùng cuối trên Web.", bullet: { level: 0 } }),
                
                new Paragraph({
                    text: "3. Quản lý Môi trường & Dependency",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({ text: "- Đóng gói toàn bộ mã nguồn AI thành 1 folder gọn gàng (VD: ai_module).", bullet: { level: 0 } }),
                new Paragraph({ text: "- Cần file requirements.txt cập nhật đầy đủ và chính xác tất cả các thư viện cần thiết.", bullet: { level: 0 } }),
                new Paragraph({ text: "- (Tùy chọn) Cung cấp file .env.example hoặc hướng dẫn cách cấu hình khóa API (như Hugging Face, Pollinations) bên trong folder AI nếu cần.", bullet: { level: 0 } }),
                
                new Paragraph({
                    text: "4. Xử lý Lỗi (Error Handling)",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph("Trong trường hợp AI bị lỗi tạo ảnh, module AI không được sập server mà phải xuất ra JSON báo lỗi, VD:"),
                new Paragraph({
                    text: `{\n  "error": "Mô tả lỗi chi tiết (VD: Server timeout, API Key hết hạn)"\n}`,
                    style: "Code",
                }),
                new Paragraph(""),
                new Paragraph("Trân trọng,"),
                new Paragraph("Đội ngũ Dev.")
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(path.join(__dirname, "..", "YeuCau_TeamAI.docx"), buffer);
    console.log("Created YeuCau_TeamAI.docx successfully");
});
