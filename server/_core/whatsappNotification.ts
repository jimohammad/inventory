/**
 * WhatsApp Notification Helper using Green API
 * Sends WhatsApp messages to configured phone numbers
 */

interface WhatsAppMessageParams {
  phoneNumber: string;
  message: string;
}

interface GreenAPIResponse {
  idMessage: string;
}

/**
 * Send a WhatsApp message using Green API
 * @param params - Phone number and message content
 * @returns Promise with message ID or error
 */
export async function sendWhatsAppMessage(
  params: WhatsAppMessageParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiUrl = process.env.GREEN_API_URL;
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;

  if (!apiUrl || !instanceId || !apiToken) {
    console.error("[WhatsApp] Missing Green API credentials");
    return {
      success: false,
      error: "WhatsApp API credentials not configured",
    };
  }

  try {
    // Format phone number (remove + and spaces)
    const formattedPhone = params.phoneNumber.replace(/[+\s]/g, "");

    // Green API endpoint for sending messages
    const endpoint = `${apiUrl}/waInstance${instanceId}/sendMessage/${apiToken}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: `${formattedPhone}@c.us`,
        message: params.message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[WhatsApp] API error:", response.status, errorText);
      return {
        success: false,
        error: `WhatsApp API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as GreenAPIResponse;

    console.log("[WhatsApp] Message sent successfully:", data.idMessage);

    return {
      success: true,
      messageId: data.idMessage,
    };
  } catch (error) {
    console.error("[WhatsApp] Failed to send message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send order notification to configured WhatsApp number
 * @param orderDetails - Order information to send
 */
export async function sendOrderNotification(orderDetails: {
  orderNumber: string;
  salesmanName: string;
  items: Array<{ itemCode: string; itemName: string; quantity: number; price: string }>;
  totalValue: string;
  totalQuantity: number;
}): Promise<boolean> {
  const notificationNumber = process.env.WHATSAPP_NOTIFICATION_NUMBER;

  if (!notificationNumber) {
    console.error("[WhatsApp] Notification number not configured");
    return false;
  }

  // Format order message
  const itemsList = orderDetails.items
    .map(
      (item) =>
        `• ${item.itemName}\n  Code: ${item.itemCode} | Qty: ${item.quantity} | ${item.price}`
    )
    .join("\n\n");

  const message = `🛒 *NEW ORDER RECEIVED*

📋 Order: ${orderDetails.orderNumber}
👤 Salesman: ${orderDetails.salesmanName}

📦 *Items:*
${itemsList}

💰 *Total:* ${orderDetails.totalQuantity} pcs | KWD ${orderDetails.totalValue}

View order details at your dashboard.`;

  const result = await sendWhatsAppMessage({
    phoneNumber: notificationNumber,
    message,
  });

  return result.success;
}

/**
 * Send daily sales summary notification to configured WhatsApp number
 * @param summaryData - Sales summary information
 */
export async function sendDailySalesSummaryWhatsApp(summaryData: {
  date: string;
  totalItemsSold: number;
  totalRevenue: number;
  topSellingItems: Array<{
    name: string;
    code: string;
    quantitySold: number;
    revenue: number;
  }>;
  lowStockItems: Array<{
    name: string;
    code: string;
    availableQty: number;
  }>;
}): Promise<boolean> {
  const notificationNumber = process.env.WHATSAPP_NOTIFICATION_NUMBER;

  if (!notificationNumber) {
    console.error('[WhatsApp] Notification number not configured for daily summary');
    return false;
  }

  // Format top selling items
  const topSellersText = summaryData.topSellingItems.length > 0
    ? summaryData.topSellingItems
        .slice(0, 5)
        .map(
          (item, index) =>
            `${index + 1}. ${item.name}\n   ${item.code} | ${item.quantitySold} sold | KWD ${item.revenue.toFixed(3)}`
        )
        .join('\n\n')
    : 'No sales recorded today';

  // Format low stock items
  const lowStockText = summaryData.lowStockItems.length > 0
    ? summaryData.lowStockItems
        .slice(0, 5)
        .map(
          (item) =>
            `⚠️ ${item.name}\n   ${item.code} | Only ${item.availableQty} left`
        )
        .join('\n\n')
    : 'All items have sufficient stock';

  // Build message
  const message = `📊 *DAILY SALES SUMMARY*
📅 ${summaryData.date}

💰 *Today's Performance:*
• Total Items Sold: ${summaryData.totalItemsSold}
• Total Revenue: KWD ${summaryData.totalRevenue.toFixed(3)}

🏆 *Top Selling Items:*
${topSellersText}

${summaryData.lowStockItems.length > 0 ? `📦 *Low Stock Alerts:*\n${lowStockText}\n\n` : ''}✅ Full report sent to your email.`;

  const result = await sendWhatsAppMessage({
    phoneNumber: notificationNumber,
    message,
  });

  return result.success;
}
