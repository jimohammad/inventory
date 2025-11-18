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
          supplierInvoiceNumber?: string;
          currency: "USD" | "AED" | "KWD";
          exchangeRate: string;
          exchangeRateKWD?: string;
          totalAmount: string;
          bankName?: "National Bank of Kuwait" | "Commercial Bank of Kuwait";
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
          supplierInvoiceNumber: input.supplierInvoiceNumber,
          currency: input.currency,
          exchangeRate: input.exchangeRate,
          exchangeRateKWD: input.exchangeRateKWD,
          totalAmount: input.totalAmount,
          bankName: input.bankName,
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
          supplierInvoiceNumber?: string;
          currency: "USD" | "AED" | "KWD";
          exchangeRate: string;
          exchangeRateKWD?: string;
          totalAmount: string;
          bankName?: "National Bank of Kuwait" | "Commercial Bank of Kuwait";
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
          supplierInvoiceNumber: input.supplierInvoiceNumber,
          currency: input.currency,
          exchangeRate: input.exchangeRate,
          exchangeRateKWD: input.exchangeRateKWD,
          totalAmount: input.totalAmount,
          bankName: input.bankName,
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

  items: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserItems } = await import("./db");
      return getUserItems(ctx.user.id);
    }),

    create: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          itemCode?: string;
          itemName: string;
          category?: string;
          description?: string;
          defaultUnitPrice?: string;
          availableQty?: number;
          notes?: string;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { createItem } = await import("./db");
        const id = await createItem({
          userId: ctx.user.id,
          ...input,
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
          itemCode?: string;
          itemName: string;
          category?: string;
          description?: string;
          defaultUnitPrice?: string;
          availableQty?: number;
          notes?: string;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { updateItem } = await import("./db");
        await updateItem(input.id, ctx.user.id, {
          itemCode: input.itemCode,
          itemName: input.itemName,
          category: input.category,
          description: input.description,
          defaultUnitPrice: input.defaultUnitPrice,
          availableQty: input.availableQty,
          notes: input.notes,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as { id: number };
      })
      .mutation(async ({ ctx, input }) => {
        const { deleteItem } = await import("./db");
        await deleteItem(input.id, ctx.user.id);
        return { success: true };
      }),

    getById: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as { id: number };
      })
      .query(async ({ ctx, input }) => {
        const { getItemById } = await import("./db");
        return getItemById(input.id, ctx.user.id);
      }),

    importStock: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          items: Array<{
            itemCode: string;
            quantity: number;
          }>;
          notes?: string;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { getUserItems, updateItem, addStockHistory, getItemById } = await import("./db");
        const allItems = await getUserItems(ctx.user.id);
        const results = { updated: 0, notFound: [] as string[] };

        for (const stockItem of input.items) {
          const item = allItems.find(i => i.itemCode === stockItem.itemCode);
          if (item) {
            const oldQty = item.availableQty || 0;
            const newQty = stockItem.quantity;
            const change = newQty - oldQty;

            await updateItem(item.id, ctx.user.id, {
              availableQty: newQty,
            });

            await addStockHistory({
              userId: ctx.user.id,
              itemId: item.id,
              changeType: "import",
              quantityChange: change,
              quantityAfter: newQty,
              notes: input.notes,
            });

            results.updated++;
          } else {
            results.notFound.push(stockItem.itemCode);
          }
        }

        return results;
      }),

    getMovementAnalysis: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          period: "week" | "month";
        };
      })
      .query(async ({ ctx, input }) => {
        const { getUserItems, getDb } = await import("./db");
        const db = await getDb();
        if (!db) return [];

        const allItems = await getUserItems(ctx.user.id);
        const now = new Date();
        const startDate = new Date();
        
        if (input.period === "week") {
          startDate.setDate(now.getDate() - 7);
        } else {
          startDate.setMonth(now.getMonth() - 1);
        }

        // Get purchase order items in the period
        const { purchaseOrders: pos, purchaseOrderItems: poi } = await import("../drizzle/schema");
        const { and: andOp, eq: eqOp, gte } = await import("drizzle-orm");
        
        const orderItems = await db.select({
          itemName: poi.itemName,
          quantity: poi.quantity,
          orderDate: pos.orderDate,
        })
        .from(poi)
        .innerJoin(pos, eqOp(poi.purchaseOrderId, pos.id))
        .where(
          andOp(
            eqOp(pos.userId, ctx.user.id),
            gte(pos.orderDate, startDate)
          )
        );

        // Aggregate by item name
        const itemStats = new Map<string, { totalQty: number; orderCount: number }>();
        
        orderItems.forEach(oi => {
          const existing = itemStats.get(oi.itemName) || { totalQty: 0, orderCount: 0 };
          existing.totalQty += oi.quantity;
          existing.orderCount += 1;
          itemStats.set(oi.itemName, existing);
        });

        // Combine with item details
        const analysis = allItems.map(item => {
          const stats = itemStats.get(item.itemName) || { totalQty: 0, orderCount: 0 };
          const daysInPeriod = input.period === "week" ? 7 : 30;
          const avgPerDay = stats.totalQty / daysInPeriod;
          
          let movementCategory: "fast" | "medium" | "slow" | "none";
          if (stats.totalQty === 0) {
            movementCategory = "none";
          } else if (avgPerDay >= 5) {
            movementCategory = "fast";
          } else if (avgPerDay >= 1) {
            movementCategory = "medium";
          } else {
            movementCategory = "slow";
          }

          return {
            id: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            category: item.category,
            availableQty: item.availableQty,
            soldQty: stats.totalQty,
            orderCount: stats.orderCount,
            avgPerDay: parseFloat(avgPerDay.toFixed(2)),
            movementCategory,
          };
        });

        return analysis.sort((a, b) => b.soldQty - a.soldQty);
      }),
  }),
});

export type AppRouter = typeof appRouter;
