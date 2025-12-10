import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { sendTestEmail } from "./dailyEmailScheduler";
import { triggerManualSync } from "../syncScheduler";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  sendTestEmail: adminProcedure
    .mutation(async () => {
      const success = await sendTestEmail();
      return {
        success,
      } as const;
    }),

  triggerGoogleSheetSync: adminProcedure
    .mutation(async () => {
      try {
        await triggerManualSync();
        return {
          success: true,
        } as const;
      } catch (error) {
        console.error('[SystemRouter] Manual sync failed:', error);
        return {
          success: false,
        } as const;
      }
    }),
});
