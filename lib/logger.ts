import { prisma } from "@/lib/prisma";

interface LogPayload {
  path: string;
  message: string;
  error?: unknown;
  payload?: any;
}

/**
 * Utility function to handle system errors.
 * 1. Saves the error to the database for historical and dashboard tracking.
 * 2. Attempts to send a notification to a Discord/Slack webhook if configured.
 * 3. Falls back to console.error.
 */
export async function logError({ path, message, error, payload }: LogPayload) {
  const stackTrace = error instanceof Error ? error.stack : undefined;
  const actualMessage = error instanceof Error ? error.message : message;
  const stringifiedPayload = payload ? JSON.stringify(payload) : undefined;

  // 1. Log to console for local development and basic server logs
  console.error(`[ERROR] ${path}: ${actualMessage}`, error);

  try {
    // 2. Save to Database
    await prisma.systemError.create({
      data: {
        path,
        message: actualMessage,
        stackTrace,
        payload: stringifiedPayload,
      },
    });
  } catch (dbError) {
    console.error(`[FATAL] Failed to save error to database:`, dbError);
    // Fallback: log original error so it's not swallowed
    console.error(`[FATAL] Original error that failed to save:`, error);
  }

  // 3. Send to Webhook (if configured)
  const webhookUrl = process.env.SYSTEM_ERROR_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      // Create an AbortController with a strict 4-second timeout to prevent
      // Serverless Compute Time billing issues if the Discord/Slack API hangs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Discord uses "content" field for messages
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `🚨 **SYSTEM ERROR** 🚨\n**Path:** \`${path}\`\n**Message:** ${actualMessage}\n\`\`\`json\n${stringifiedPayload || "{}"}\n\`\`\``,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (webhookError: any) {
      if (webhookError.name === "AbortError") {
        console.error(`[FATAL] Webhook request timed out after 4000ms`);
      } else {
        console.error(
          `[FATAL] Failed to send webhook notification:`,
          webhookError,
        );
      }
    }
  }
}
