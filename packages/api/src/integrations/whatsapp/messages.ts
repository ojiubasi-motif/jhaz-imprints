/**
 * WhatsApp message generators for customer and tailor notifications.
 * All messages are personalized and include full context where needed.
 */

interface OrderMessage {
  id: string;
  productName: string;
  deliveryDate: Date;
  measurement?: {
    bust?: number;
    waist?: number;
    hip?: number;
    shoulder?: number;
    sleeveLen?: number;
    height?: number;
  };
  totalPrice: number;
  fabricOption?: string;
  colorOption?: string;
  styleOption?: string;
  customerName?: string;
  tailorName?: string;
  tailorPhone?: string;
}

/**
 * Order confirmation message sent to customer.
 * Uses WhatsApp template message format with placeholders.
 */
export function orderConfirmedMessage(order: OrderMessage): string {
  const formattedDate = order.deliveryDate.toLocaleDateString("en-NG", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return `Hello ${order.customerName || "there"}! 🎉

Your order for a ${order.productName} has been confirmed!

📋 Order Details:
• Order ID: ${order.id}
• Style: ${order.styleOption || "Classic"}
• Fabric & Color: ${order.fabricOption || "Standard"} — ${order.colorOption || "Default"}
• Estimated Delivery: ${formattedDate}
• Total: ₦${order.totalPrice.toLocaleString("en-NG")}

📐 Your Measurements:
• Bust: ${order.measurement?.bust || "—"}cm
• Waist: ${order.measurement?.waist || "—"}cm
• Hip: ${order.measurement?.hip || "—"}cm
• Shoulder: ${order.measurement?.shoulder || "—"}cm
• Sleeve: ${order.measurement?.sleeveLen || "—"}cm
• Height: ${order.measurement?.height || "—"}cm

We'll update you at every stage of production. Thank you for choosing Jhaz-imprints! 🙏`;
}

/**
 * Status update message sent to customer.
 * Plain text message with progress emoji.
 */
export function statusUpdatedMessage(
  order: OrderMessage,
  newStatus: string
): string {
  const statusEmoji: Record<string, string> = {
    CONFIRMED: "✅",
    IN_PRODUCTION: "✨",
    SHIPPED: "🚚",
    DELIVERED: "📦",
    CANCELLED: "❌",
  };

  const emoji = statusEmoji[newStatus] || "📍";

  return `${emoji} Order Update

Your order ${order.id} (${order.productName}) has been updated to: *${newStatus}*

Estimated delivery: ${order.deliveryDate.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}

Questions? Chat with us anytime! 💬`;
}

/**
 * New order alert message sent TO THE TAILOR.
 * Includes COMPLETE measurement summary and all order details.
 * Critical: Must include ALL measurement fields, not subset.
 */
export function newOrderAlertMessage(order: OrderMessage): string {
  const formattedDate = order.deliveryDate.toLocaleDateString("en-NG", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return `🔔 NEW ORDER ALERT

Customer: ${order.customerName || "Guest"}
Order ID: ${order.id}
Outfit: ${order.productName}

📐 COMPLETE MEASUREMENTS (cm):
• Bust: ${order.measurement?.bust ?? "NOT PROVIDED"}
• Waist: ${order.measurement?.waist ?? "NOT PROVIDED"}
• Hip: ${order.measurement?.hip ?? "NOT PROVIDED"}
• Shoulder: ${order.measurement?.shoulder ?? "NOT PROVIDED"}
• Sleeve Length: ${order.measurement?.sleeveLen ?? "NOT PROVIDED"}
• Height: ${order.measurement?.height ?? "NOT PROVIDED"}

🎨 SPECIFICATIONS:
• Style: ${order.styleOption || "Classic"}
• Fabric: ${order.fabricOption || "Standard"}
• Color: ${order.colorOption || "Default"}

💰 Order Value: ₦${order.totalPrice.toLocaleString("en-NG")}
📅 Delivery Target: ${formattedDate}
⏰ Production Days Available: Check dashboard

📋 Next Step: Review measurements and confirm production readiness on dashboard.`;
}
