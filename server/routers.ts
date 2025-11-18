import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  purchaseOrders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getPurchaseOrdersByUserId } = await import("./db");
      return await getPurchaseOrdersByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null || !("id" in raw)) {
          throw new Error("Invalid input: id is required");
        }
        const { id } = raw as { id: unknown };
        if (typeof id !== "number") {
          throw new Error("Invalid input: id must be a number");
        }
        return { id };
      })
      .query(async ({ ctx, input }) => {
        const { getPurchaseOrderById, getPurchaseOrderItems, getDocuments } = await import("./db");
        const order = await getPurchaseOrderById(input.id, ctx.user.id);
        if (!order) return null;
        
        const items = await getPurchaseOrderItems(input.id);
        const docs = await getDocuments(input.id);
        
        return { ...order, items, documents: docs };
      }),

    create: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          poNumber: string;
          supplier: string;
          currency: "USD" | "AED";
          exchangeRate: string;
          totalAmount: string;
          notes?: string;
          status: "draft" | "confirmed" | "completed" | "cancelled";
          orderDate: Date;
          items: Array<{
            itemName: string;
            description?: string;
            quantity: number;
            unitPrice: string;
            totalPrice: string;
          }>;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { createPurchaseOrder, createPurchaseOrderItem } = await import("./db");
        
        const orderId = await createPurchaseOrder({
          userId: ctx.user.id,
          poNumber: input.poNumber,
          supplier: input.supplier,
          currency: input.currency,
          exchangeRate: input.exchangeRate,
          totalAmount: input.totalAmount,
          notes: input.notes,
          status: input.status,
          orderDate: input.orderDate,
        });
        
        for (const item of input.items) {
          await createPurchaseOrderItem({
            purchaseOrderId: orderId,
            itemName: item.itemName,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          });
        }
        
        return { id: orderId };
      }),

    update: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          id: number;
          poNumber: string;
          supplier: string;
          currency: "USD" | "AED";
          exchangeRate: string;
          totalAmount: string;
          notes?: string;
          status: "draft" | "confirmed" | "completed" | "cancelled";
          orderDate: Date;
          items: Array<{
            itemName: string;
            description?: string;
            quantity: number;
            unitPrice: string;
            totalPrice: string;
          }>;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { updatePurchaseOrder, deletePurchaseOrderItems, createPurchaseOrderItem } = await import("./db");
        
        await updatePurchaseOrder(input.id, ctx.user.id, {
          poNumber: input.poNumber,
          supplier: input.supplier,
          currency: input.currency,
          exchangeRate: input.exchangeRate,
          totalAmount: input.totalAmount,
          notes: input.notes,
          status: input.status,
          orderDate: input.orderDate,
        });
        
        // Delete existing items and recreate
        await deletePurchaseOrderItems(input.id);
        
        for (const item of input.items) {
          await createPurchaseOrderItem({
            purchaseOrderId: input.id,
            itemName: item.itemName,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          });
        }
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null || !("id" in raw)) {
          throw new Error("Invalid input: id is required");
        }
        const { id } = raw as { id: unknown };
        if (typeof id !== "number") {
          throw new Error("Invalid input: id must be a number");
        }
        return { id };
      })
      .mutation(async ({ ctx, input }) => {
        const { deletePurchaseOrder } = await import("./db");
        await deletePurchaseOrder(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  documents: router({
    upload: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          purchaseOrderId: number;
          documentType: "delivery_note" | "invoice" | "payment_tt";
          fileName: string;
          fileUrl: string;
          fileKey: string;
          mimeType: string;
          fileSize: number;
        };
      })
      .mutation(async ({ input }) => {
        const { createDocument } = await import("./db");
        await createDocument(input);
        return { success: true };
      }),

    delete: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null || !("id" in raw)) {
          throw new Error("Invalid input: id is required");
        }
        const { id } = raw as { id: unknown };
        if (typeof id !== "number") {
          throw new Error("Invalid input: id must be a number");
        }
        return { id };
      })
      .mutation(async ({ input }) => {
        const { deleteDocument } = await import("./db");
        await deleteDocument(input.id);
        return { success: true };
      }),
  }),

  suppliers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getSuppliersByUserId } = await import("./db");
      return await getSuppliersByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null || !("id" in raw)) {
          throw new Error("Invalid input: id is required");
        }
        const { id } = raw as { id: unknown };
        if (typeof id !== "number") {
          throw new Error("Invalid input: id must be a number");
        }
        return { id };
      })
      .query(async ({ ctx, input }) => {
        const { getSupplierById } = await import("./db");
        return await getSupplierById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          name: string;
          contactPerson?: string;
          phone?: string;
          email?: string;
          address?: string;
          notes?: string;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { createSupplier } = await import("./db");
        const id = await createSupplier({
          userId: ctx.user.id,
          name: input.name,
          contactPerson: input.contactPerson,
          phone: input.phone,
          email: input.email,
          address: input.address,
          notes: input.notes,
        });
        return { id };
      }),

    update: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          id: number;
          name: string;
          contactPerson?: string;
          phone?: string;
          email?: string;
          address?: string;
          notes?: string;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { updateSupplier } = await import("./db");
        await updateSupplier(input.id, ctx.user.id, {
          name: input.name,
          contactPerson: input.contactPerson,
          phone: input.phone,
          email: input.email,
          address: input.address,
          notes: input.notes,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null || !("id" in raw)) {
          throw new Error("Invalid input: id is required");
        }
        const { id } = raw as { id: unknown };
        if (typeof id !== "number") {
          throw new Error("Invalid input: id must be a number");
        }
        return { id };
      })
      .mutation(async ({ ctx, input }) => {
        const { deleteSupplier } = await import("./db");
        await deleteSupplier(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
