## Environment Variables

Create a `backend/.env` file with the following entries (example values):

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret

# Local uploads configuration
UPLOAD_DIR=uploads

# OCR.space configuration
OCR_API_URL=https://api.ocr.space/parse/image
OCR_API_KEY=your_ocr_space_api_key
OCR_LANGUAGE=eng
```

The receipt upload workflow (local storage version):
1. Client uploads file to `POST /api/expenses/receipt` (multipart field name: `file`).
2. Server saves file under `UPLOAD_DIR/<userId>/...` and (optionally) calls the OCR API (if configured) sending the image as base64.
3. Response returns `{ receiptUrl, ocrText, ocrData }` where `receiptUrl` is a local path (`/uploads/...`) and `ocrData` may include `amount`, `currency`, `date`, `merchant`.
4. Client pre-fills expense form and submits to `POST /api/expenses` with any adjusted fields plus the `receiptUrl`, `ocrText`, and `ocrData`.

If OCR fails or is not configured, the endpoint still returns the `receiptUrl` so manual input can proceed.

### Frontend (User Dashboard) Receipt Upload

The user dashboard now supports drag & drop receipt upload with live progress:

1. Drag a PNG/JPG/PDF onto the drop zone or click browse.
2. Upload progress bar fills; on success, OCR auto-fills amount / currency / date (if parsed) and merchant name into description.
3. Adjust any fields, pick category (or click AI suggestion), then Submit.
4. The submission payload includes `receiptUrl`, `ocrText`, and `ocrData` so the server stores them with the expense.

Edge cases handled:
- Invalid file type → error toast.
- Upload or OCR failure → error toast; manual entry still possible.
- Max size 5MB enforced server-side.

To change allowed types or size, edit `uploadReceipt` in `backend/controllers/expenseController.js`.

### OCR & Fallback Heuristics

If OCR service (OCR_API_URL / OCR_API_KEY) is configured (OCR.space format), the backend sends the base64 image via `application/x-www-form-urlencoded` with fields `base64Image`, `language` (from OCR_LANGUAGE), and parses `ParsedResults[0].ParsedText`. That raw text is then processed with lightweight regex heuristics to infer amount, currency, date, and merchant.

When OCR is unavailable or returns no usable data, a filename-based fallback tries to extract:
- Amount: first number (optionally with two trailing digits separated by dash or dot).
- Date: patterns like `2025-10-04` or `2025_10_04`.
- Currency keywords in filename (usd, inr, eur).
- Merchant: remainder of filename (trimmed words).

Front-end will only auto-fill empty fields; existing manual input is never overwritten. A toast indicates whether data was extracted.

