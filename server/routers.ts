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
          itemCode: string;
          name: string;
          category: 'Motorola' | 'Samsung' | 'Redmi' | 'Realme' | 'Meizu' | 'Honor';
          purchasePrice?: number;
          sellingPrice?: number;
          availableQty?: number;
          openingStock?: number;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { createItem, getDb } = await import("./db");
        const { items } = await import("../drizzle/schema");
        const { eq, or } = await import("drizzle-orm");
        
        // Check for duplicates
        const db = await getDb();
        if (db) {
          const existing = await db.select().from(items)
            .where(or(
              eq(items.itemCode, input.itemCode),
              eq(items.name, input.name)
            ))
            .limit(1);
          
          if (existing.length > 0) {
            if (existing[0].itemCode === input.itemCode) {
              throw new Error("Item code already exists");
            }
            if (existing[0].name === input.name) {
              throw new Error("Item name already exists");
            }
          }
        }
        
        await createItem({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    bulkCreate: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          items: Array<{
            itemCode: string;
            name: string;
            category: 'Motorola' | 'Samsung' | 'Redmi' | 'Realme' | 'Meizu' | 'Honor';
            purchasePrice?: number;
            sellingPrice?: number;
            availableQty?: number;
            openingStock?: number;
          }>;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { createItem, getDb } = await import("./db");
        const { items } = await import("../drizzle/schema");
        const { eq, or, inArray } = await import("drizzle-orm");
        
        const results = {
          created: 0,
          skipped: [] as Array<{ itemCode: string; reason: string }>,
        };

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Check for duplicates in the database
        const allCodes = input.items.map(item => item.itemCode);
        const allNames = input.items.map(item => item.name);
        
        const existingItems = await db.select().from(items)
          .where(or(
            inArray(items.itemCode, allCodes),
            inArray(items.name, allNames)
          ));

        const existingCodes = new Set(existingItems.map(item => item.itemCode));
        const existingNames = new Set(existingItems.map(item => item.name));

        // Check for duplicates within the input
        const seenCodes = new Set<string>();
        const seenNames = new Set<string>();

        for (const item of input.items) {
          // Check if already exists in database
          if (existingCodes.has(item.itemCode)) {
            results.skipped.push({
              itemCode: item.itemCode,
              reason: "Item code already exists in database",
            });
            continue;
          }

          if (existingNames.has(item.name)) {
            results.skipped.push({
              itemCode: item.itemCode,
              reason: "Item name already exists in database",
            });
            continue;
          }

          // Check for duplicates within the CSV
          if (seenCodes.has(item.itemCode)) {
            results.skipped.push({
              itemCode: item.itemCode,
              reason: "Duplicate item code in CSV",
            });
            continue;
          }

          if (seenNames.has(item.name)) {
            results.skipped.push({
              itemCode: item.itemCode,
              reason: "Duplicate item name in CSV",
            });
            continue;
          }

          seenCodes.add(item.itemCode);
          seenNames.add(item.name);

          try {
            await createItem({
              userId: ctx.user.id,
              ...item,
            });
            results.created++;
          } catch (error) {
            results.skipped.push({
              itemCode: item.itemCode,
              reason: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        return results;
      }),

    update: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          id: number;
          itemCode?: string;
          name: string;
          category?: "Motorola" | "Samsung" | "Redmi" | "Realme" | "Meizu" | "Honor";
          sellingPrice?: number;
          purchasePrice?: number;
          availableQty?: number;
          openingStock?: number;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { updateItem } = await import("./db");
        await updateItem(input.id, ctx.user.id, {
          itemCode: input.itemCode,
          name: input.name,
          category: input.category,
          sellingPrice: input.sellingPrice,
          purchasePrice: input.purchasePrice,
          availableQty: input.availableQty,
          openingStock: input.openingStock,
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

    bulkUpdateOpeningStock: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          updates: Array<{
            itemCode: string;
            openingStock: number;
          }>;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { getUserItems, updateItem } = await import("./db");
        const allItems = await getUserItems(ctx.user.id);
        const results = { updated: 0, notFound: [] as string[] };

        for (const update of input.updates) {
          const item = allItems.find(i => i.itemCode === update.itemCode);
          if (item) {
            await updateItem(item.id, ctx.user.id, {
              openingStock: update.openingStock,
            });
            results.updated++;
          } else {
            results.notFound.push(update.itemCode);
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
          const stats = itemStats.get(item.name) || { totalQty: 0, orderCount: 0 };
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
            itemName: item.name,
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

    getAIInsights: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          period: "week" | "month";
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const { getUserItems, getDb } = await import("./db");
        const db = await getDb();
        if (!db) return { insights: "Database not available" };

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
        const itemStats = new Map<string, { totalQty: number; orderCount: number; availableQty: number }>();
        
        orderItems.forEach(oi => {
          const existing = itemStats.get(oi.itemName) || { totalQty: 0, orderCount: 0, availableQty: 0 };
          existing.totalQty += oi.quantity;
          existing.orderCount += 1;
          itemStats.set(oi.itemName, existing);
        });

        // Add available quantities
        allItems.forEach(item => {
          const stats = itemStats.get(item.name);
          if (stats) {
            stats.availableQty = item.availableQty || 0;
          } else {
            itemStats.set(item.name, {
              totalQty: 0,
              orderCount: 0,
              availableQty: item.availableQty || 0,
            });
          }
        });

        // Prepare data for AI analysis
        const analysisData = Array.from(itemStats.entries()).map(([name, stats]) => ({
          item: name,
          soldQty: stats.totalQty,
          orders: stats.orderCount,
          available: stats.availableQty,
          avgPerDay: (stats.totalQty / (input.period === "week" ? 7 : 30)).toFixed(2),
        }));

        const topMovers = analysisData.filter(i => i.soldQty > 0).sort((a, b) => b.soldQty - a.soldQty).slice(0, 10);
        const noMovement = analysisData.filter(i => i.soldQty === 0 && i.available > 0);
        const lowStock = analysisData.filter(i => i.available < 10 && i.soldQty > 0);

        const prompt = `You are an inventory management analyst. Analyze the following inventory data for the past ${input.period === "week" ? "week" : "month"} and provide actionable insights.

Top Moving Items:
${topMovers.map(i => `- ${i.item}: ${i.soldQty} units sold, ${i.available} available, avg ${i.avgPerDay}/day`).join('\n')}

Items with No Movement (${noMovement.length} items):
${noMovement.slice(0, 5).map(i => `- ${i.item}: ${i.available} units in stock`).join('\n')}

Low Stock Items:
${lowStock.map(i => `- ${i.item}: only ${i.available} units left, selling ${i.avgPerDay}/day`).join('\n')}

Provide:
1. Key trends and patterns
2. Items at risk of stockout
3. Slow-moving items that may need attention
4. Specific recommendations for reordering
5. Any unusual patterns or concerns

Keep the response concise, actionable, and focused on business decisions.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a helpful inventory analyst providing clear, actionable insights." },
            { role: "user", content: prompt },
          ],
        });

        return {
          insights: response.choices[0].message.content,
        };
      }),

    lowStock: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          threshold?: number;
        };
      })
      .query(async ({ ctx, input }) => {
        const { getUserItems } = await import("./db");
        const threshold = input.threshold || 10;
        const allItems = await getUserItems(ctx.user.id);
        
        return allItems
          .filter(item => (item.availableQty || 0) < threshold && (item.availableQty || 0) > 0)
          .map(item => ({
            id: item.id,
            itemCode: item.itemCode,
            name: item.name,
            category: item.category,
            availableQty: item.availableQty || 0,
            purchasePrice: item.purchasePrice,
            sellingPrice: item.sellingPrice,
          }))
          .sort((a, b) => a.availableQty - b.availableQty)
          .slice(0, 10);
      }),

    profitMargins: protectedProcedure.query(async ({ ctx }) => {
      const { getUserItems } = await import("./db");
      const allItems = await getUserItems(ctx.user.id);
      
      const itemsWithMargin = allItems
        .filter(item => item.purchasePrice && item.sellingPrice)
        .map(item => {
          const margin = (item.sellingPrice! - item.purchasePrice!);
          const marginPercent = (margin / item.purchasePrice!) * 100;
          return {
            id: item.id,
            itemCode: item.itemCode,
            name: item.name,
            category: item.category,
            purchasePrice: item.purchasePrice!,
            sellingPrice: item.sellingPrice!,
            margin,
            marginPercent: parseFloat(marginPercent.toFixed(2)),
          };
        });

      const sorted = itemsWithMargin.sort((a, b) => b.marginPercent - a.marginPercent);
      
      return {
        topMargins: sorted.slice(0, 5),
        lowMargins: sorted.slice(-5).reverse(),
      };
    }),

    getPublicCatalog: publicProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          userId: number;
          includeQty?: boolean;
        };
      })
      .query(async ({ input }) => {
        const { getUserItems } = await import("./db");
        const allItems = await getUserItems(input.userId);
        
        return allItems.map(item => ({
          itemCode: item.itemCode,
          name: item.name,
          category: item.category,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          ...(input.includeQty ? { availableQty: item.availableQty } : {}),
        }));
      }),
  }),

  googleSheets: router({
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      const { getGoogleSheetConfig } = await import("./db");
      return await getGoogleSheetConfig(ctx.user.id);
    }),

    saveConfig: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          spreadsheetId: string;
          sheetName: string;
          serviceAccountKey: string;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { upsertGoogleSheetConfig } = await import("./db");
        const { testGoogleSheetConnection } = await import("./googleSheets");

        // Test connection first
        const isValid = await testGoogleSheetConnection(input);
        if (!isValid) {
          throw new Error("Failed to connect to Google Sheets. Please check your credentials and spreadsheet ID.");
        }

        await upsertGoogleSheetConfig({
          userId: ctx.user.id,
          ...input,
          isActive: 1,
        });

        return { success: true };
      }),

    syncNow: protectedProcedure.mutation(async ({ ctx }) => {
      const { syncInventoryForUser } = await import("./syncScheduler");
      const result = await syncInventoryForUser(ctx.user.id);
      if (!result.success) {
        throw new Error(result.error || "Sync failed");
      }
      return result;
    }),

    getSyncLogs: protectedProcedure.query(async ({ ctx }) => {
      const { getSyncLogs } = await import("./db");
      return await getSyncLogs(ctx.user.id, 20);
    }),
  }),

  whatsappContacts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getWhatsappContacts } = await import("./db");
      return await getWhatsappContacts(ctx.user.id);
    }),

    create: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          name: string;
          phoneNumber: string;
          notes?: string;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { createWhatsappContact } = await import("./db");
        return await createWhatsappContact({
          userId: ctx.user.id,
          ...input,
        });
      }),

    update: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          id: number;
          name: string;
          phoneNumber: string;
          notes?: string;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { updateWhatsappContact } = await import("./db");
        return await updateWhatsappContact(input.id, ctx.user.id, {
          name: input.name,
          phoneNumber: input.phoneNumber,
          notes: input.notes,
        });
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
        const { deleteWhatsappContact } = await import("./db");
        return await deleteWhatsappContact(input.id, ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
