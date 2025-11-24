import { describe, it, expect } from "vitest";
import { sendWhatsAppMessage } from "./whatsappNotification";

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
});
