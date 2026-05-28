Build a multi-step custom order and checkout flow.  clicks on product "customize & order" button reroutes user to this flow.
Steps:

1. Select outfit style (Agbada, Ankara, Kaftan, Aso-Oke, Babariga, Iro & Buba, etc.) with thumbnail previews
2. Choose fabric/color from swatches or upload your own fabric photo. Option to add a note for the tailor about fabric preferences.
3. Enter measurements (chest, waist, hips, height, shoulder width) with a helpful size guide tooltip. Option to save measurements for future orders.
4. Personalization (embroidery style, neckline type, sleeve length, lining, accessories, special requests)
5. Delivery details:
    - Full name, phone number, delivery address
    - Preferred delivery date (date picker)
    - Delivery method: Standard or Express (with price difference shown)
6. Order Summary:
    - Itemized breakdown (outfit cost, customization fee, delivery fee)
    - Estimated delivery date
Edit button per section to go back and change
Promo/discount code input field
Total amount boldly displayed
"Proceed to Payment" CTA button
Payment (Paystack Checkout):
7. Payment methods: Card, Bank Transfer, USSD, Mobile Money — all powered by Paystack
    - NOTE: this is dummy, real paystack checkout will be integrated
    - Show Paystack branded UI/modal or inline form
    - Display padlock icon and "Secured by Paystack" trust badge
    - Total amount clearly shown before confirming
    - "Place Order & Pay" CTA button    
8. Order Confirmation:
    - Success screen with order ID and summary
    - Paystack transaction reference number displayed
    - "Track your order" button
    - Email confirmation notice
    - Estimated delivery date displayed prominently
    - progress bar at top showing all 8 steps with warm color combo to show/mark steps
    - fully mobile-friendly.