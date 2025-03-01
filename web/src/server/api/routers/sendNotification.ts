import { env } from "@/env";

const sendDiscordMessage = async ({
  message,
  discordWebhookUrl
}: {
  message: string;
  discordWebhookUrl: string;
}) => {
  const response = await fetch(discordWebhookUrl, {
    method: "POST",
    body: JSON.stringify({ content: message }),
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    console.error("Failed to send Discord message:", await response.text());
    throw new Error("Failed to send Discord message");
  }
};

export const sendNotification = async ({
  message,
}: {
  message: string;
}) => {
  console.log("sending message", message);

  await sendDiscordMessage({
    message,
    discordWebhookUrl: env.DISCORD_WEBHOOK_URL
  });
};
