Step 1 — Frontend triggers initialization
User clicks "Pay". Frontend POSTs to your backend (`/api/payment/initialize`) with `{ email, amount }`.

Step 2 — Backend generates reference & calls Paystack
Your server generates a unique reference, then POSTs to `https://api.paystack.co/transaction/initialize` with `{ email, amount_in_kobo, reference }` using your secret key in the Authorization header. Initializing from the backend ensures you have full control of the transaction details — never call the Paystack API directly from the frontend. 

Step 3 — Backend returns `access_code` to frontend
The response data object contains an `access_code` needed to complete the transaction. Your backend sends `{ access_code, reference }` to the frontend.

Step 4 — Frontend opens Popup
Frontend calls `popup.resumeTransaction(access_code, { onSuccess, onCancel })`. The `resumeTransaction` method triggers the checkout in the browser, letting the user choose their preferred payment channel.

Step 5 — `onSuccess` fires with reference
Paystack calls your `onSuccess(transaction)` callback. `transaction.reference` is the same reference your backend generated. Frontend POSTs this reference to your backend (`/api/payment/verify/:reference`).

Step 6 — Backend verifies with Paystack
Your server GETs `https://api.paystack.co/transaction/verify/:reference` using the secret key. Note: `response.status` is the API call status — the actual transaction status is in `response.data.status`. Also confirm `response.data.amount` matches what you charged to prevent tampering.

Step 7 — Backend delivers value
If `data.status === "success"` and `amount` matches — mark the order as paid in your DB, then return a success response to the frontend.

Step 8 — Frontend redirects to `/my-orders`
On receiving the success response from your backend, call `router.push("/my-orders")` (React Router) or `navigate("/my-orders")`. Only redirect here — never on `onSuccess` alone, always wait for your backend verification to confirm.

NOTE: strings in the prompt may not match my current implementation, so you should first understand my implementation and then follow the steps. it's just to give context.

The critical rule throughout: all requests to the Paystack API must be initiated from your server — your frontend only ever talks to your own backend.