/**
 * Send an SMS via TextBee gateway.
 * Returns `true` if the SMS was accepted, `false` otherwise.
 */
export async function sendSms(phone: string, message: string): Promise<boolean> {
  try {
    const apiKey = process.env.TEXTBEE_API_KEY;
    const deviceId = process.env.TEXTBEE_DEVICE_ID;
    if (!apiKey || !deviceId) {
      console.error("TextBee: Missing API key or device ID");
      return false;
    }

    const response = await fetch(
      `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          recipients: [phone],
          message,
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("TextBee send error:", data);
      return false;
    }
    return true;
  } catch (err) {
    console.error("TextBee exception:", err);
    return false;
  }
}
