# CSD Recall

Trang học kiểu Quizlet được trích xuất từ 3 file slide HTML. Mặt trước là ảnh slide, mặt sau là speaker notes chứa đáp án và giải thích.

## Mở trên máy

Chạy server local:

```bash
node server.js
```

Sau đó mở:

```text
http://127.0.0.1:4173
```

## Host bằng GitHub Pages

1. Tạo một GitHub repository mới.
2. Upload hoặc push toàn bộ các file này lên branch `main`:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `DESIGN.md`
   - `.nojekyll`
   - `data/slides.json`
   - thư mục `slides/`
3. Vào repository trên GitHub: `Settings` -> `Pages`.
4. Chọn `Deploy from a branch`.
5. Chọn branch `main`, folder `/root`, rồi bấm `Save`.
6. Mở URL GitHub Pages GitHub cấp.

Không cần upload `node_modules`, `qa-desktop.png`, `qa-mobile.png`, `chunks/`, hoặc các file `SEMESTER_*.html` gốc.

## Trích xuất lại dữ liệu

Nếu file slide gốc thay đổi, đặt các file `SEMESTER_*.html` trong thư mục này rồi chạy:

```bash
node extract-slides.js
```

Lệnh này tạo lại `data/slides.json` và các ảnh SVG trong `slides/`.

## Lưu tiến độ

Tiến độ học lưu bằng `localStorage` trên từng trình duyệt. Nếu đổi máy hoặc đổi trình duyệt, tiến độ sẽ không tự đi theo.
