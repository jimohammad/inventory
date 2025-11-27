import { describe, it, expect } from "vitest";
import { sendWhatsAppMessage, sendDailySalesSummaryWhatsApp } from "./whatsappNotification";

describe("WhatsApp Notification", () => {
  it("should have Green API credentials configured", () => {
    expect(process.env.GREEN_API_URL).toBeDefined();
    expect(process.env.GREEN_API_INSTANCE_ID).toBeDefined();
    expect(process.env.GREEN_API_TOKEN).toBeDefined();
    expect(process.env.WHATSAPP_NOTIFICATION_NUMBER).toBeDefined();
  });

  it("should validate Green API credentials by checking account state", async () => {
    const apiUrl = process.env.GREEN_API_URL;
    const instanceId = process.env.GREEN_API_INSTANCE_ID;
    const apiToken = process.env.GREEN_API_TOKEN;

    // Call Green API getStateInstance endpoint to validate credentials
    const endpoint = `${apiUrl}/waInstance${instanceId}/getStateInstance/${apiToken}`;

    const response = await fetch(endpoint);
    
    expect(response.ok).toBe(true);

    const data = await response.json();
    
    // Green API returns stateInstance: "authorized" or "notAuthorized"
    expect(data).toHaveProperty("stateInstance");
    
    // Log the state for debugging
    console.log("[WhatsApp Test] Instance state:", data.stateInstance);
    
    // The instance should be in a valid state (not necessarily authorized, but API should respond)
    expect(["authorized", "notAuthorized", "blocked", "sleepMode", "starting"]).toContain(
      data.stateInstance
    );
  }, 10000); // 10 second timeout for API call

  it("should send daily sales summary via WhatsApp", async () => {
    const testSummaryData = {
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Kuwait',
      }),
      totalItemsSold: 25,
      totalRevenue: 650.500,
      topSellingItems: [
        {
          name: 'Samsung Galaxy A17 5G',
          code: 'SAM-A17-256',
          quantitySold: 8,
          revenue: 200.400,
        },
        {
          name: 'Xiaomi Redmi Note 12',
          code: 'XIA-RN12-128',
          quantitySold: 6,
          revenue: 150.300,
        },
        {
          name: 'Honor X9C',
          code: 'HON-X9C-256',
          quantitySold: 5,
          revenue: 125.250,
        },
      ],
      lowStockItems: [
        {
          name: 'Honor X9C',
          code: 'HON-X9C-256',
          availableQty: 7,
        },
        {
          name: 'Samsung F16 8GB',
          code: 'SAM-F16-8GB',
          availableQty: 12,
        },
      ],
    };

    const success = await sendDailySalesSummaryWhatsApp(testSummaryData);
    
    expect(success).toBe(true);
    console.log('[WhatsAppTest] Daily sales summary WhatsApp sent successfully');
  }, 30000); // 30 second timeout for WhatsApp sending
});
