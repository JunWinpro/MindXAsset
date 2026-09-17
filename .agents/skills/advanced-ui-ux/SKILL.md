---
name: advanced-ui-ux
description: Chuyên gia thiết kế UI/UX nâng cao. Hướng dẫn cách tạo Liquid Navigation, Interactive Mascots, Morph SVG và áp dụng Impeccable Design. Sử dụng khi người dùng yêu cầu thiết kế giao diện "đẹp, hiện đại, khoa học".
---

# Kỹ năng (Skill) Advanced UI/UX Design

Khi người dùng yêu cầu thiết kế giao diện đẹp, hiện đại, khoa học, hoặc đặc biệt nhắc đến Liquid Navigation, Mascot tương tác, bạn **BẮT BUỘC** phải tuân thủ các nguyên tắc và sử dụng các thư viện/kỹ thuật dưới đây.

## 1. Hệ tư tưởng "Impeccable" (Chống AI Slop)
Đừng thiết kế như một con Bot vô tri. Hãy suy nghĩ như một Art Director:
- **KHÔNG sử dụng CSS mặc định nhàm chán:** Tránh dùng `linear-gradient` xanh-đỏ thông thường, tránh dùng `border-radius: 8px` khắp mọi nơi.
- **Micro-interactions:** Mọi nút bấm, thẻ (card) phải có trạng thái `:hover`, `:active` và `:focus-visible`. 
- **Animation chuẩn mực:** Sử dụng `cubic-bezier` mượt mà (ví dụ: `cubic-bezier(0.4, 0, 0.2, 1)`) thay vì `ease` hay `linear`.
- **Z-index có hệ thống:** Luôn sử dụng biến hoặc quản lý logic các tầng z-index (semantic z-index) thay vì gõ bừa `z-index: 9999`.
- **Chất lượng hiển thị (Aesthetics):** Các bóng đổ (box-shadow) phải mềm mại và có độ trong suốt (ví dụ: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`).

## 2. Liquid Navigation (Gooey Effect)
Để tạo một Menu (Bottom Nav) có chất lỏng (Liquid) dính lấy nhau, bạn phải dùng filter `blur` và `contrast` ở cấp độ container cha.

**Mẫu CSS thuần:**
```css
.liquid-nav-container {
  /* BẮT BUỘC: Nền cha phải có màu tương phản, thường là màu trắng hoặc đen */
  background: #fff;
  filter: contrast(20); /* Tạo độ gắt để hợp nhất vùng mờ */
}

.liquid-item {
  /* Đối tượng bên trong sẽ có độ mờ */
  filter: blur(10px);
  /* Khi hai đối tượng .liquid-item tiến gần nhau, chúng sẽ 'nóng chảy' và dính vào nhau */
}
```

*Nâng cao (SVG Filter):* 
Gắn thẻ SVG `<filter>` ẩn chứa `<feGaussianBlur>` và `<feColorMatrix>` vào trang web và áp dụng `filter: url(#gooey)` lên container. Kỹ thuật này giảm giật lag trên Safari so với dùng CSS filter.

## 3. Morph SVG (Biến đổi hình khối)
Đừng dùng các thẻ `<svg>` tĩnh tĩnh. Để làm UI khoa học và hiện đại, hãy biến đổi (morph) chúng.
- Nếu dùng React, sử dụng **Framer Motion** để thay đổi thuộc tính `d` của thẻ `<path>` (đảm bảo hai đường path có cùng số lượng điểm).
- Nếu hình phức tạp, đề xuất người dùng sử dụng thư viện **Flubber** (nội suy path SVG không cùng số lượng điểm).
- **Cách làm với Framer Motion:**
  ```jsx
  <motion.path 
    initial={{ d: "M 0 0..." }} 
    animate={{ d: isHovered ? "M 10 10..." : "M 0 0..." }} 
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  />
  ```

## 4. Interactive Mascot (Linh vật tương tác)
Nếu người dùng muốn có một Mascot tương tác (như con cú Duolingo, mắt nhìn theo chuột, hoặc gõ phím), hãy hướng dẫn họ theo một trong hai cách:

1. **Dùng RIVE (Tốt nhất cho Production):**
   Đề xuất sử dụng `rive-react`. Đây là tiêu chuẩn công nghiệp mới cho Animation (nhẹ hơn Lottie, có State Machine).
   - Thiết lập State Machine cho "Idle", "Follow Cursor", "Success".
   - Liên kết con trỏ chuột (`onMouseMove`) với biến (input) X và Y của Rive State Machine.

2. **Dùng SVG/Hình ảnh + Framer Motion (Đơn giản, React-native style):**
   Nếu dùng các hình ảnh có sẵn (như file hình quái vật png), hãy chia nhỏ mắt, mũi, tay ra làm các Component riêng biệt. 
   - Lấy toạ độ chuột `clientX`, `clientY`.
   - Tính toán khoảng cách (delta) so với vị trí của Mascot.
   - Dùng hook `useSpring` của Framer Motion để dịch chuyển tròng mắt (pupils) giới hạn trong khoảng `[-10px, 10px]`.
   
   ```jsx
   const { x, y } = useMousePosition();
   // transform x, y into pupil movement
   <motion.div style={{ x: pupilX, y: pupilY }} className="pupil" />
   ```

Khi nhận được yêu cầu từ người dùng để thiết kế UI theo phong cách trên, hãy chủ động phân tích bài toán và đề xuất ÁP DỤNG các kỹ thuật này để gây ấn tượng mạnh (Wow effect) cho họ.
