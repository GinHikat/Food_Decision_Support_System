# Mô Tả Bộ Dữ Liệu Đã Xử Lý (`data/processed/`)

Thư mục này chứa các bộ dữ liệu đã được chuẩn hóa, làm giàu và sẵn sàng cho phân tích của hệ thống **Hỗ trợ ra quyết định thực đơn nhà hàng (Menu-DSS)**. Toàn bộ các tệp trong thư mục này được sinh tự động và có tính tái lập từ dữ liệu thô tại `data/raw/` thông qua pipeline [`demo/modules/data_pipeline.py`](../../demo/modules/data_pipeline.py).

## Tổng Quan Các Tệp Dữ Liệu

| Tên tệp | Số dòng | Số cột | Khóa chính | Mô tả |
|---|---:|---:|---|---|
| [`menu_dss_master.csv`](menu_dss_master.csv) | 39 | 22 | `id` (`dish_name`) | Danh mục thực đơn hợp nhất gồm các chỉ số tài chính, vận hành, dinh dưỡng và chất gây dị ứng. |
| [`customers.csv`](customers.csv) | 20 | 5 | `user_id` | Hồ sơ thông tin cơ bản của khách hàng (chế độ ăn, dị ứng, nguyên liệu không thích, ẩm thực yêu thích). |
| [`dining_sessions.csv`](dining_sessions.csv) | 30 | 7 | `session_id` | Ngữ cảnh cụ thể của từng bữa ăn (số người, ngân sách, thời gian chờ, loại bữa, mức độ ưu tiên). |
| [`customer_sessions_master.csv`](customer_sessions_master.csv) | 30 | 11 | `session_id` | Bảng tổng hợp nối `dining_sessions.csv` và `customers.csv` theo `user_id`. |

> **Lưu ý kỹ thuật khi đọc CSV:** Các cột chuỗi như `spice_level`, `allergens`, `allergies` và `disliked_ing` sử dụng giá trị chữ `"None"` khi không có dữ liệu. Khi nạp bằng `pandas.read_csv()`, hãy truyền thêm tham số `keep_default_na=False` để tránh bị chuyển thành `NaN`.

---

## 1. `menu_dss_master.csv` (39 dòng x 22 cột)

Được tổng hợp từ 3 bộ dữ liệu thô (`foods_dataset_.csv`, `restaurant_menu_optimization_data.csv`, `restaurant_sales_data.csv`), loại bỏ món trùng (`Lemon Iced Tea` gộp vào `Iced Lemon Tea`), quy đổi tiền tệ về USD (`1 USD = 84 INR`) và bổ sung các thuộc tính dinh dưỡng, khẩu phần, chất gây dị ứng và trạng thái còn hàng.

### Lược đồ chi tiết (Schema)

| # | Tên cột | Kiểu dữ liệu | Mô tả ý nghĩa | Miền giá trị / Khoảng giá trị | Giá trị mẫu |
|---:|---|---|---|---|---|
| 1 | `id` | `int64` | Mã định danh duy nhất của món ăn | `1` – `39` | `1`, `25` |
| 2 | `dish_name` | `string` | Tên món ăn đã chuẩn hóa | 39 tên duy nhất | `"Bruschetta"`, `"Char Kway Teow"` |
| 3 | `category` | `string` | Phân loại món trong thực đơn | `Appetizer`, `Main Course`, `Dessert`, `Beverage` | `"Appetizer"`, `"Main Course"` |
| 4 | `cuisine_type` | `string` | Phong cách ẩm thực | `Western`, `Italian`, `Southeast Asian`, `Indian`, `Chinese`, `Cafe`, `Asian` | `"Italian"`, `"Southeast Asian"` |
| 5 | `food_type` | `string` | Phân loại chế độ ăn | `Veg`, `Non-Veg`, `Vegan` | `"Vegan"`, `"Non-Veg"` |
| 6 | `spice_level` | `string` | Mức độ cay của món | `None`, `Mild`, `Medium`, `Spicy` | `"None"`, `"Medium"` |
| 7 | `ingredients` | `string` | Danh sách nguyên liệu chính (phân tách bằng dấu phẩy) | Chuỗi ký tự | `"baguette, tomatoes, basil, garlic, olive oil"` |
| 8 | `ingredient_count` | `int64` | Số lượng nguyên liệu chính | `2` – `6` | `5`, `6` |
| 9 | `cost_price` | `float64` | Giá vốn nguyên liệu trên 1 suất (USD) | `$0.80` – `$9.00` | `4.23`, `5.00` |
| 10 | `selling_price` | `float64` | Giá bán thực tế trên 1 suất (USD) | `$2.43` – `$53.48` | `11.21`, `21.40` |
| 11 | `units_sold` | `int64` | Sản lượng bán ra trong kỳ khảo sát (suất) | `86` – `561` | `159`, `171` |
| 12 | `prep_time_min` | `int64` | Thời gian chế biến trung bình tại bếp (phút) | `2` – `25` | `8`, `12` |
| 13 | `customer_rating` | `float64` | Điểm đánh giá trung bình của thực khách (thang 5) | `4.1` – `4.9` | `4.1`, `4.8` |
| 14 | `profitability_tier` | `string` | Nhóm mức độ sinh lời tham chiếu | `High`, `Medium`, `Low` | `"Medium"`, `"High"` |
| 15 | `source_dataset` | `string` | Tên tệp dữ liệu thô gốc | `foods_dataset_.csv`, `restaurant_menu_optimization_data.csv`, `restaurant_sales_data.csv` | `"restaurant_sales_data.csv"` |
| 16 | `contribution_margin` | `float64` | Biên đóng góp lợi nhuận (`selling_price - cost_price`, USD) | `$1.63` – `$44.48` | `6.98`, `16.40` |
| 17 | `food_cost_pct` | `float64` | Tỷ lệ giá vốn trên giá bán (`cost_price / selling_price * 100`, %) | `16.31%` – `37.85%` | `37.73`, `23.36` |
| 18 | `calories` | `int64` | Năng lượng ước tính cho 1 phần ăn (kcal) | `15` – `920` | `320`, `680` |
| 19 | `serving_size` | `int64` | Khẩu phần phù hợp cho bao nhiêu người ăn | `1` – `2` | `2`, `1` |
| 20 | `satiety_score` | `int64` | Chỉ số mức độ no (`1` = Rất nhẹ/Đồ uống đến `5` = Rất no) | `1` – `5` | `2`, `5` |
| 21 | `allergens` | `string` | Nhóm chất gây dị ứng rút trích từ `ingredients` | `Dairy`, `Gluten`, `Eggs`, `Shellfish`, `Fish`, `Peanuts`, `Tree Nuts`, `Soy`, `None` | `"Gluten"`, `"Eggs, Fish, Peanuts"` |
| 22 | `is_available` | `bool` | Trạng thái còn hàng (`~90%` còn hàng, `~10%` tạm hết) | `True`, `False` | `True`, `False` |

### Dữ liệu mẫu

| `id` | `dish_name` | `category` | `selling_price` | `prep_time_min` | `calories` | `serving_size` | `satiety_score` | `allergens` | `is_available` |
|---:|---|---|---:|---:|---:|---:|---:|---|---|
| 1 | Bruschetta | Appetizer | 11.21 | 8 | 320 | 2 | 2 | Gluten | True |
| 12 | Iced Lemon Tea | Beverage | 6.28 | 3 | 110 | 1 | 1 | None | True |
| 24 | Beef Rendang | Main Course | 48.14 | 25 | 640 | 1 | 4 | None | False |
| 32 | Margherita Pizza | Main Course | 3.74 | 14 | 920 | 2 | 4 | Dairy, Gluten | True |

---

## 2. `customers.csv` (20 dòng x 5 cột)

Lưu trữ thông tin hồ sơ cố định của khách hàng và các ràng buộc về chế độ ăn uống.

### Lược đồ chi tiết (Schema)

| # | Tên cột | Kiểu dữ liệu | Mô tả ý nghĩa | Miền giá trị | Giá trị mẫu |
|---:|---|---|---|---|---|
| 1 | `user_id` | `string` | Mã định danh duy nhất của khách hàng | `U001` – `U020` | `"U001"`, `"U002"` |
| 2 | `dietary_preference` | `string` | Sở thích / Chế độ ăn uống | `Normal` (bình thường), `Veg` (chay), `Vegan` (thuần chay), `Diet` (ăn kiêng), `Meat Lover` (thích thịt), `Spicy Lover` (thích cay) | `"Normal"`, `"Veg"` |
| 3 | `allergies` | `string` | Danh sách chất gây dị ứng cần loại trừ tuyệt đối | `Dairy`, `Gluten`, `Eggs`, `Shellfish`, `Fish`, `Peanuts`, `Tree Nuts`, `Soy`, `None` | `"None"`, `"Peanuts"` |
| 4 | `disliked_ing` | `string` | Các nguyên liệu khách hàng không thích | Từ khóa nguyên liệu khớp với cột `ingredients` | `"anchovies"`, `"mushrooms"` |
| 5 | `favorite_cuisines` | `string` | Các nền ẩm thực yêu thích | `Italian`, `Western`, `Southeast Asian`, `Indian`, `Chinese`, `Cafe`, `Asian` | `"Italian, Western"` |

---

## 3. `dining_sessions.csv` (30 dòng x 7 cột)

Lưu trữ thông tin ngữ cảnh cụ thể cho từng phiên dùng bữa để phục vụ lọc ràng buộc và gán trọng số MCDM.

### Lược đồ chi tiết (Schema)

| # | Tên cột | Kiểu dữ liệu | Mô tả ý nghĩa | Miền giá trị / Khoảng giá trị | Giá trị mẫu |
|---:|---|---|---|---|---|
| 1 | `session_id` | `string` | Mã định danh phiên dùng bữa | `S001` – `S030` | `"S001"`, `"S002"` |
| 2 | `user_id` | `string` | Khóa ngoại tham chiếu tới `customers.csv` | `U001` – `U020` | `"U001"`, `"U002"` |
| 3 | `party_size` | `int64` | Số lượng người ăn trong bữa đó | `1` – `6` người | `2`, `1` |
| 4 | `budget_limit` | `float64` | Ngân sách tối đa cho cả bữa ăn (USD) | `$10.0` – `$220.0` | `65.0`, `15.0` |
| 5 | `max_wait_time` | `int64` | Thời gian chờ tối đa chấp nhận được (phút) | `10` – `30` phút | `25`, `15` |
| 6 | `meal_type` | `string` | Loại bữa ăn | `Breakfast` (sáng), `Lunch` (trưa), `Dinner` (tối), `Snack` (ăn nhẹ) | `"Dinner"`, `"Lunch"` |
| 7 | `priority` | `string` | Tiêu chí ưu tiên chính để đặt trọng số MCDM | `Cost-Saving` (tiết kiệm), `Taste & Experience` (ăn ngon/trải nghiệm), `Healthy & Diet` (ăn kiêng healthy) | `"Taste & Experience"`, `"Cost-Saving"` |

---

## 4. `customer_sessions_master.csv` (30 dòng x 11 cột)

Bảng tổng hợp đã nối sẵn (`dining_sessions.csv` LEFT JOIN `customers.csv` theo `user_id`), kết hợp đầy đủ 7 trường ngữ cảnh bữa ăn và 4 trường thông tin khách hàng để động cơ DSS/gợi ý sử dụng trực tiếp.

### Quy tắc liên kết giữa Dữ liệu Khách hàng và Thực đơn cho thuật toán DSS

- **Ràng buộc cứng (Hard Filtering - Loại bỏ món không phù hợp):**
  - `menu.is_available == True` (chỉ chọn món còn hàng)
  - `menu.prep_time_min <= session.max_wait_time` (thời gian nấu không vượt quá thời gian chờ)
  - `menu.allergens` không giao với `customer.allergies` (loại trừ tuyệt đối chất gây dị ứng)
  - `menu.food_type` thỏa mãn `customer.dietary_preference` (ví dụ: `Vegan` chỉ nhận `Vegan`; `Veg` nhận `Veg` hoặc `Vegan`)
- **Ràng buộc mềm & Tiêu chí chấm điểm MCDM (Scoring):**
  - **Phù hợp ngân sách:** So sánh `menu.selling_price` với `session.budget_limit / session.party_size`
  - **Khớp khẩu vị & sở thích:** Thưởng điểm nếu `menu.cuisine_type` nằm trong `customer.favorite_cuisines`, xét `menu.customer_rating`, và trừ điểm nếu `menu.ingredients` chứa `customer.disliked_ing`
  - **Sức khỏe & Độ no:** Đánh trọng số cao cho `menu.calories` và `menu.satiety_score` khi `session.priority == "Healthy & Diet"` hoặc `customer.dietary_preference == "Diet"`
  - **Hiệu quả kinh doanh nhà hàng:** Kết hợp `menu.contribution_margin` và `menu.units_sold` (tích hợp Menu Engineering)
