import { ENV } from "./_core/env";

interface SendMessageParams {
  phone: string;
  message: string;
}

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send WhatsApp message using Green API
 * @param phone - Phone number in international format (e.g., "96550123456")
 * @param message - Message text to send
 */
export async function sendWhatsAppMessage({
  phone,
  message,
}: SendMessageParams): Promise<SendMessageResponse> {
  try {
    const url = `${ENV.greenApiUrl}/waInstance${ENV.greenApiInstanceId}/sendMessage/${ENV.greenApiToken}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: `${phone}@c.us`,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Green API error:", errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      messageId: data.idMessage,
    };
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add delay between messages to avoid rate limiting
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
