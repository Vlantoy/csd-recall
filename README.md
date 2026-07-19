# CSD Recall

Trang học kiểu Quizlet cho 3 file slide HTML trong thư mục này.

## Mở trên máy

Nếu chỉ xem giao diện thì có thể mở `index.html` trực tiếp. Để nút "Lật thẻ" điều khiển đúng slide bên trong file nguồn, chạy server local:

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
   - `chunks/SEMESTER_1_MKT101.html.part001`
   - `chunks/SEMESTER_1_MKT101.html.part002`
   - `chunks/SEMESTER_1_MKT101.html.part003`
   - `SEMESTER_2_ECO121 (1).html`
   - `SEMESTER_2_FIN202.html`
3. Vào repository trên GitHub: `Settings` -> `Pages`.
4. Chọn `Deploy from a branch`.
5. Chọn branch `main`, folder `/root`, rồi bấm `Save`.
6. Mở URL GitHub Pages GitHub cấp.

Không cần upload `node_modules`, `qa-desktop.png`, hoặc `qa-mobile.png`.

`SEMESTER_1_MKT101.html` lớn hơn giới hạn 100MB của GitHub, nên bản Pages dùng 3 file chunk trong thư mục `chunks/`. File gốc vẫn có thể giữ ở máy, nhưng không cần push lên GitHub.

## Lưu tiến độ

Tiến độ học lưu bằng `localStorage` trên từng trình duyệt. Nếu đổi máy hoặc đổi trình duyệt, tiến độ sẽ không tự đi theo.
