# Đặc Tả Bài Toán & Phương Án Thiết Kế Hệ Thống (Menu-DSS)

Tài liệu tổng hợp toàn bộ nội dung xác định bài toán, cấu trúc dữ liệu, mô hình thuật toán, ý tưởng giao diện demo và phương án gán trọng số / tính điểm cho bài tập lớn môn **Hệ Hỗ Trợ Ra Quyết Định (Decision Support System - HUST)**.

---

## I. Xác Định Bài Toán

### 1. Định vị đối tượng và Phạm vi
- **Đối tượng:** Người tiêu dùng (thực khách) đến nhà hàng và chọn món.
- **Phạm vi:** Chọn món tại 1 nhà hàng cụ thể, thực đơn (menu) tạm thời cố định với số lượng món xác định.

### 2. Cấu trúc dữ liệu
- **Dữ liệu cứng (Ràng buộc lọc):**
  - **Loại món:** Khai vị, món chính, canh/rau, tráng miệng, đồ uống.
  - **Thành phần (để tìm khả năng dị ứng):** Hải sản, đậu phộng, gluten, sữa,...
  - **Loại chế độ ăn riêng (Optional):** Chay, Halal (không cồn, không thịt lợn), Healthy, Không cay,...
- **Dữ liệu mềm (trong bảng quyết định):**
  - **Chi phí:** Giá tiền.
  - **Điểm đánh giá:** Rating.
  - **Mức độ no / Lượng calo** (Optional).

### 3. Mô hình thuật toán
Từ menu gốc của nhà hàng, quy trình xử lý gồm 2 giai đoạn chính:
1. **Phương án HỘI & LOẠI BỎ DẦN (Conjunctive / Elimination):**
   - Loại bỏ các món gây dị ứng, không phù hợp chế độ ăn, tạm hết hàng và các món vượt quá ngân sách tối đa.
   - Phân bổ danh mục (ví dụ tham chiếu: 1 khai vị, 2 món chính, 1 canh, 1 tráng miệng / người) $\rightarrow$ Sinh **danh sách các combo bữa ăn khả thi**.
2. **Chuẩn hóa $\rightarrow$ Gán trọng số $\rightarrow$ Tích hợp hoặc TOPSIS:**
   - Trọng số phụ thuộc vào nhu cầu đầu vào của người dùng.
   - Ví dụ:
     - Ưu tiên *Tiết kiệm* $\rightarrow$ $w_{\text{giá}} = 0.6$
     - Ưu tiên *Best-seller* $\rightarrow$ $w_{\text{rating}} = 0.6$ (hoặc $w_{\text{phổ biến}}$)

### 4. Dữ liệu hệ thống
*(Xem mô tả chi tiết các tệp dữ liệu đã triển khai tại [`data/processed/data_desc.md`](../data/processed/data_desc.md))*

#### 4.1. Dữ liệu món ăn nhà hàng (`menu_dss_master.csv`)
Bên cạnh các trường cơ bản (tên món, loại món, nguyên liệu, giá vốn, giá bán, sản lượng, thời gian chế biến, rating), bổ sung các trường:
- `calories` / `satiety_score`: Năng lượng và mức độ no.
- `serving_size` / `portion_size`: Khẩu phần dành cho mấy người.
- `allergens`: Chất gây dị ứng (phiên bản curated từ `ingredients` để chú trọng vào các nguyên liệu gây dị ứng).
- `is_available`: Trạng thái còn hàng hay tạm hết.

#### 4.2. Dữ liệu đầu vào của khách hàng (`customers.csv` & `dining_sessions.csv`)
- **Thông tin cơ bản (Customer Profile):**
  - `user_id`: Mã định danh khách hàng.
  - `dietary_preference`: Chay (`Veg`), thuần chay (`Vegan`), ăn kiêng (`Diet`), bình thường (`Normal`), thích ăn thịt (`Meat Lover`), thích ăn cay (`Spicy Lover`).
  - `allergies`: Danh sách các chất gây dị ứng.
  - `disliked_ing`: Các nguyên liệu không thích.
  - `favorite_cuisines`: Các món / nền ẩm thực yêu thích.
- **Ngữ cảnh cụ thể 1 bữa ăn (Dining Session):**
  - `session_id`: Mã phiên dùng bữa.
  - `party_size`: Lần ăn đó có mấy người.
  - `budget_limit`: Ngân sách tối đa.
  - `max_wait_time`: Thời gian có thể chờ tối đa (optional hoặc default).
  - `meal_type`: Bữa sáng (`Breakfast`) / trưa (`Lunch`) / tối (`Dinner`) / ăn nhẹ (`Snack`).
  - `priority` (để đặt trọng số MCDM):
    - Tiết kiệm (`Cost-Saving`)
    - Ăn ngon / trải nghiệm món mới (`Taste & Experience`)
    - Ăn kiêng healthy (`Healthy & Diet`)

### 5. Ý tưởng giao diện demo
*(Đã hiện thực hóa tại [`frontend/`](../frontend/))*

- **Đầu vào:** Thanh trượt (slider) để người dùng chọn mức độ ưu tiên và nhập các thông số đầu vào, ví dụ:
  - Ưu tiên giá rẻ, best-seller, ăn kiêng, ăn chay.
  - Ngân sách (`Budget`), số người đi (`party_size`), dị ứng, thời gian chờ.
  - Nút mở thực đơn toàn bộ nhà hàng để tra cứu chi tiết các món.
- **Đầu ra:** Hiển thị so sánh các kịch bản thực đơn (dạng bảng đối chiếu & lưới 2×2 nén gọn, nhấn vào để xem đầy đủ chi tiết):
  - **Option A (Cân bằng nhất):** Điểm TOPSIS cao nhất theo trọng số hiện tại.
  - **Option B (Chú trọng 1 thuộc tính — Chi phí):** Tối ưu nhất về chi phí.
  - **Option C (Chú trọng trải nghiệm):** Trải nghiệm ẩm thực tốt nhất (Rating cao, hợp gu, đa dạng món).
  - **Option D (Bổ sung — Best-seller):** Combo gồm các món được gọi nhiều nhất hiện nay.
- **Thành phần trực quan bổ sung:**
  - **Biểu đồ Radar (Spider Chart)** so sánh các phương án theo 4 trục: **Giá tiền** – **Cân bằng dinh dưỡng** – **Rating** – **Tính đa dạng**.

---

## II. Phương Án Gán Trọng Số và Tính Điểm

### 1. Các phương pháp & công thức áp dụng
- **AHP (Analytic Hierarchy Process):** Xác định trọng số các tiêu chí thông qua ma trận so sánh cặp và kiểm tra tỷ số nhất quán ($CR < 0.1$).
- **TOPSIS:** Chuẩn hóa vector ma trận quyết định, nhân trọng số, xác định giải pháp lý tưởng dương ($A^+$) và lý tưởng âm ($A^-$), tính khoảng cách Euclid ($D_i^+, D_i^-$) và độ tương đồng $C_i = \frac{D_i^-}{D_i^+ + D_i^-}$.
- **WSM (Weighted Sum Model):** Tính tổng điểm có trọng số sau khi chuẩn hóa Min-Max về thang $[0, 1]$.
- **Rule-based (Hệ luật):** Áp dụng cho tầng lọc cứng (dị ứng, trạng thái còn hàng, chế độ ăn, giới hạn thời gian chờ) và phân loại nhóm món ăn.

### 2. Hai góc nhìn bài toán DSS mở rộng

#### A. Hệ thống Định giá & Đề xuất món ăn cho Quản lý nhà hàng (B2B)
- Phân loại danh mục theo ma trận Kỹ thuật thực đơn (Menu Engineering): **Stars**, **Plowhorses**, **Puzzles**, **Dogs**.
- Ứng dụng **Quy hoạch tuyến tính (Linear Programming)** để tự động gợi ý các **Combo** ghép nhóm món *Puzzle* (lợi nhuận cao, ít người gọi) với *Plowhorse* (bán chạy, biên lợi nhuận thấp) nhằm tối ưu hóa tổng biên đóng góp.

#### B. Hệ thống Gợi ý Thực đơn cá nhân hóa cho Khách hàng đi ăn (B2C)
- Ứng dụng **MCDM**, **TOPSIS** và **Weighted Scoring** kết hợp bộ lọc ràng buộc cứng (dị ứng, chế độ ăn, ngân sách, số người, thời gian chờ) để xếp hạng món ăn và tổng hợp các kịch bản bữa ăn tối ưu theo thời gian thực.
