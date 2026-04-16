// SMS notification service using Twilio
// Setup instructions:
// 1. Sign up at https://www.twilio.com
// 2. Get your Account SID and Auth Token
// 3. Get a Twilio phone number
// 4. Add to .env.local:
//    EXPO_PUBLIC_TWILIO_ACCOUNT_SID=your_account_sid
//    EXPO_PUBLIC_TWILIO_AUTH_TOKEN=your_auth_token
//    EXPO_PUBLIC_TWILIO_PHONE_NUMBER=+1234567890

import Constants from "expo-constants";

const TWILIO_ACCOUNT_SID =
  Constants.expoConfig?.extra?.TWILIO_ACCOUNT_SID ||
  process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN =
  Constants.expoConfig?.extra?.TWILIO_AUTH_TOKEN ||
  process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER =
  Constants.expoConfig?.extra?.TWILIO_PHONE_NUMBER ||
  process.env.EXPO_PUBLIC_TWILIO_PHONE_NUMBER;

interface SendSMSParams {
  to: string;
  message: string;
}

export const sendMilestoneSMS = async (
  phoneNumber: string,
  level: number,
  title: string,
  prize: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("Twilio credentials not configured");
    return { success: false, error: "SMS not configured" };
  }

  const message = `🎉 Congrats! You've reached Level ${level} - ${title}!\n\nYour reward: ${prize}\n\nKeep crushing it! 💪`;

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: TWILIO_PHONE_NUMBER,
          Body: message,
        }).toString(),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Twilio SMS error:", error);
      return { success: false, error: "Failed to send SMS" };
    }

    const data = await response.json();
    console.log("SMS sent successfully:", data.sid);
    return { success: true };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: String(error) };
  }
};

export const sendSMS = async ({ to, message }: SendSMSParams) => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error("Twilio credentials not configured");
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_PHONE_NUMBER,
        Body: message,
      }).toString(),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to send SMS");
  }

  return response.json();
};
