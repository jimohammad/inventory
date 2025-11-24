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

  items: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserItems, getDb } = await import("./db");
      const allItems = await getUserItems(ctx.user.id);
      const db = await getDb();
      
      if (!db) return allItems;
      
      // Calculate sales velocity for each item (last 30 days)
      const { stockHistory } = await import("../drizzle/schema");
      const { eq, and, gte, sql } = await import("drizzle-orm");
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const salesData = await db.select({
        itemId: stockHistory.itemId,
        totalSold: sql<number>`SUM(ABS(${stockHistory.quantityChange}))`,
      })
      .from(stockHistory)
      .where(
        and(
          eq(stockHistory.userId, ctx.user.id),
          eq(stockHistory.changeType, "sale"),
          gte(stockHistory.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(stockHistory.itemId);
      
      const salesMap = new Map<number, number>();
      salesData.forEach(row => {
        salesMap.set(row.itemId, Number(row.totalSold) || 0);
      });
      
      // Add sales velocity to each item
      return allItems.map(item => {
        const soldLast30Days = salesMap.get(item.id) || 0;
        const salesVelocity = (soldLast30Days / 30) * 7; // units per week
        
        let velocityStatus: "fast" | "moderate" | "slow" | "none" = "none";
        if (salesVelocity >= 3) {
          velocityStatus = "fast";
        } else if (salesVelocity >= 1) {
          velocityStatus = "moderate";
        } else if (salesVelocity > 0) {
          velocityStatus = "slow";
        }
        
        return {
          ...item,
          salesVelocity: Number(salesVelocity.toFixed(1)),
          velocityStatus,
        };
      });
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
          purchasePrice?: string;
          sellingPrice?: string;
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
            purchasePrice?: string;
            sellingPrice?: string;
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
          sellingPrice?: string;
          purchasePrice?: string;
          availableQty?: number;
          openingStock?: number;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { updateItem, getDb } = await import("./db");
        const { items, priceHistory } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // Get current item data before update
        const db = await getDb();
        if (db) {
          const currentItem = await db.select().from(items)
            .where(eq(items.id, input.id))
            .limit(1);
          
          if (currentItem.length > 0) {
            const oldItem = currentItem[0];
            const oldPurchasePrice = oldItem.purchasePrice ? parseFloat(oldItem.purchasePrice) : null;
            const oldSellingPrice = oldItem.sellingPrice ? parseFloat(oldItem.sellingPrice) : null;
            const newPurchasePrice = input.purchasePrice ? parseFloat(input.purchasePrice) : null;
            const newSellingPrice = input.sellingPrice ? parseFloat(input.sellingPrice) : null;
            
            // Check if prices have changed
            const purchasePriceChanged = oldPurchasePrice !== newPurchasePrice;
            const sellingPriceChanged = oldSellingPrice !== newSellingPrice;
            
            // Record price history if any price changed
            if (purchasePriceChanged || sellingPriceChanged) {
              await db.insert(priceHistory).values({
                userId: ctx.user.id,
                itemId: input.id,
                purchasePrice: input.purchasePrice || oldItem.purchasePrice,
                sellingPrice: input.sellingPrice || oldItem.sellingPrice,
                changedAt: new Date(),
              });
            }
          }
        }
        
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

    bulkUpdatePrices: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          category?: 'Motorola' | 'Samsung' | 'Redmi' | 'Realme' | 'Meizu' | 'Honor';
          priceType: 'selling' | 'purchase' | 'both';
          adjustmentType: 'percentage' | 'fixed';
          adjustmentValue: number;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { items } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Build the WHERE clause
        let whereClause = eq(items.userId, ctx.user.id);
        if (input.category) {
          whereClause = sql`${whereClause} AND ${items.category} = ${input.category}`;
        }

        // Calculate the adjustment
        const adjustment = (currentPrice: string | null) => {
          if (!currentPrice) return null;
          const price = parseFloat(currentPrice);
          if (isNaN(price)) return null;
          
          let newPrice: number;
          if (input.adjustmentType === 'percentage') {
            newPrice = price * (1 + input.adjustmentValue / 100);
          } else {
            newPrice = price + input.adjustmentValue;
          }
          
          // Ensure price doesn't go negative
          return Math.max(0, newPrice).toFixed(3);
        };

        // Get all items that match the criteria
        const itemsToUpdate = await db.select().from(items).where(whereClause);
        
        let updatedCount = 0;
        for (const item of itemsToUpdate) {
          const updates: any = {};
          
          if (input.priceType === 'selling' || input.priceType === 'both') {
            const newPrice = adjustment(item.sellingPrice as any);
            if (newPrice !== null) {
              updates.sellingPrice = newPrice;
            }
          }
          
          if (input.priceType === 'purchase' || input.priceType === 'both') {
            const newPrice = adjustment(item.purchasePrice as any);
            if (newPrice !== null) {
              updates.purchasePrice = newPrice;
            }
          }
          
          if (Object.keys(updates).length > 0) {
            await db.update(items)
              .set(updates)
              .where(eq(items.id, item.id));
            updatedCount++;
          }
        }
        
        return { 
          success: true, 
          updatedCount,
          message: `Updated ${updatedCount} item(s) successfully`
        };
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
        const { stockHistory } = await import("../drizzle/schema");
        const { eq, and, gte, sum, sql } = await import("drizzle-orm");
        
        // Calculate date range based on period
        const now = new Date();
        const periodStart = new Date();
        if (input.period === "week") {
          periodStart.setDate(now.getDate() - 7);
        } else {
          periodStart.setMonth(now.getMonth() - 1);
        }
        
        // Get sold quantities from stock history for the period
        const soldData = await db.select({
          itemId: stockHistory.itemId,
          totalSold: sql<number>`SUM(ABS(${stockHistory.quantityChange}))`,
        })
        .from(stockHistory)
        .where(
          and(
            eq(stockHistory.userId, ctx.user.id),
            eq(stockHistory.changeType, "sale"),
            gte(stockHistory.createdAt, periodStart)
          )
        )
        .groupBy(stockHistory.itemId);
        
        // Create a map of itemId to soldQty
        const soldMap = new Map<number, number>();
        soldData.forEach(row => {
          soldMap.set(row.itemId, Number(row.totalSold) || 0);
        });
        
        // Calculate analysis with sold quantities
        const daysInPeriod = input.period === "week" ? 7 : 30;
        const analysis = allItems.map(item => {
          const soldQty = soldMap.get(item.id) || 0;
          const avgPerDay = soldQty / daysInPeriod;
          
          let movementCategory: "fast" | "medium" | "slow" | "none" = "none";
          if (soldQty > 0) {
            const avgPerWeek = (soldQty / daysInPeriod) * 7;
            if (avgPerWeek >= 3) {
              movementCategory = "fast";
            } else if (avgPerWeek >= 1) {
              movementCategory = "medium";
            } else {
              movementCategory = "slow";
            }
          }
          
          return {
            id: item.id,
            itemCode: item.itemCode,
            itemName: item.name,
            category: item.category,
            availableQty: item.availableQty,
            soldQty,
            orderCount: 0,
            avgPerDay: Number(avgPerDay.toFixed(2)),
            movementCategory,
          };
        });

        return analysis;
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
        
        // Prepare data for AI analysis based on current inventory
        const analysisData = allItems.map(item => ({
          item: item.name,
          category: item.category,
          available: item.availableQty || 0,
          sellingPrice: item.sellingPrice,
          purchasePrice: item.purchasePrice,
        }));

        const lowStock = analysisData.filter(i => i.available < 10);
        const outOfStock = analysisData.filter(i => i.available === 0);
        const wellStocked = analysisData.filter(i => i.available >= 50);

        const prompt = `You are an inventory management analyst. Analyze the following current inventory data and provide actionable insights.

Total Items: ${analysisData.length}

Low Stock Items (< 10 units):
${lowStock.slice(0, 10).map(i => `- ${i.item} (${i.category}): ${i.available} units available`).join('\n')}

Out of Stock Items:
${outOfStock.slice(0, 10).map(i => `- ${i.item} (${i.category}): OUT OF STOCK`).join('\n')}

Well Stocked Items (>= 50 units):
${wellStocked.slice(0, 5).map(i => `- ${i.item} (${i.category}): ${i.available} units`).join('\n')}

Provide:
1. Key inventory health observations
2. Items that need immediate restocking
3. Items that may be overstocked
4. Specific recommendations for inventory management
5. Any concerns or patterns

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
          const sellingPrice = parseFloat(item.sellingPrice as any);
          const purchasePrice = parseFloat(item.purchasePrice as any);
          const margin = sellingPrice - purchasePrice;
          const marginPercent = (margin / purchasePrice) * 100;
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

    getHistory: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          itemId: number;
        };
      })
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return { history: [], stats: { totalSales: 0, totalRestocks: 0, currentStock: 0 } };

        const { stockHistory, items } = await import("../drizzle/schema");
        const { eq, and, desc, sql } = await import("drizzle-orm");
        
        // Fetch stock history for the item (last 100 entries)
        const history = await db.select({
          id: stockHistory.id,
          changeType: stockHistory.changeType,
          quantityChange: stockHistory.quantityChange,
          quantityAfter: stockHistory.quantityAfter,
          notes: stockHistory.notes,
          createdAt: stockHistory.createdAt,
        })
        .from(stockHistory)
        .where(
          and(
            eq(stockHistory.itemId, input.itemId),
            eq(stockHistory.userId, ctx.user.id)
          )
        )
        .orderBy(desc(stockHistory.createdAt))
        .limit(100);
        
        // Get current item info
        const [item] = await db.select({
          availableQty: items.availableQty,
        })
        .from(items)
        .where(eq(items.id, input.itemId))
        .limit(1);
        
        // Calculate statistics
        const totalSales = history
          .filter(h => h.changeType === "sale")
          .reduce((sum, h) => sum + Math.abs(h.quantityChange), 0);
        
        const totalRestocks = history
          .filter(h => h.changeType === "restock")
          .reduce((sum, h) => sum + Math.abs(h.quantityChange), 0);
        
        return {
          history,
          stats: {
            totalSales,
            totalRestocks,
            currentStock: item?.availableQty || 0,
          },
        };
      }),

    getPriceHistory: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          itemId: number;
        };
      })
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return [];

        const { priceHistory } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        
        // Fetch price history for the item (last 50 entries)
        const history = await db.select()
          .from(priceHistory)
          .where(
            and(
              eq(priceHistory.userId, ctx.user.id),
              eq(priceHistory.itemId, input.itemId)
            )
          )
          .orderBy(desc(priceHistory.changedAt))
          .limit(50);
        
        return history;
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
        
        // Filter out items with zero stock
        const availableItems = allItems.filter(item => item.availableQty > 0);
        
        return availableItems.map(item => ({
          id: item.id,
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

  alerts: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { alertSettings } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const settings = await db.select().from(alertSettings)
        .where(eq(alertSettings.userId, ctx.user.id))
        .limit(1);
      
      // Return default settings if none exist
      if (settings.length === 0) {
        return {
          lowStockThreshold: 10,
          criticalStockThreshold: 5,
          defaultReorderQuantity: 50,
          emailNotificationsEnabled: false,
        };
      }
      
      return {
        ...settings[0],
        emailNotificationsEnabled: settings[0].emailNotificationsEnabled === 1,
      };
    }),

    updateSettings: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        return raw as {
          lowStockThreshold: number;
          criticalStockThreshold: number;
          defaultReorderQuantity: number;
          emailNotificationsEnabled: boolean;
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { alertSettings } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // Validate thresholds
        if (input.criticalStockThreshold >= input.lowStockThreshold) {
          throw new Error("Critical threshold must be less than low stock threshold");
        }
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Check if settings exist
        const existing = await db.select().from(alertSettings)
          .where(eq(alertSettings.userId, ctx.user.id))
          .limit(1);
        
        const settingsData = {
          userId: ctx.user.id,
          lowStockThreshold: input.lowStockThreshold,
          criticalStockThreshold: input.criticalStockThreshold,
          defaultReorderQuantity: input.defaultReorderQuantity,
          emailNotificationsEnabled: input.emailNotificationsEnabled ? 1 : 0,
        };
        
        if (existing.length === 0) {
          // Insert new settings
          await db.insert(alertSettings).values(settingsData);
        } else {
          // Update existing settings
          await db.update(alertSettings)
            .set(settingsData)
            .where(eq(alertSettings.userId, ctx.user.id));
        }
        
        return { success: true };
      }),

    getAlerts: protectedProcedure.query(async ({ ctx }) => {
      const { getDb, getUserItems } = await import("./db");
      const { alertSettings, stockHistory } = await import("../drizzle/schema");
      const { eq, and, gte, sql, lte, or } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) return { alerts: [], summary: { critical: 0, lowStock: 0 } };
      
      // Get alert settings
      const settings = await db.select().from(alertSettings)
        .where(eq(alertSettings.userId, ctx.user.id))
        .limit(1);
      
      const lowThreshold = settings[0]?.lowStockThreshold || 10;
      const criticalThreshold = settings[0]?.criticalStockThreshold || 5;
      const reorderQty = settings[0]?.defaultReorderQuantity || 50;
      
      // Get all items
      const allItems = await getUserItems(ctx.user.id);
      
      // Calculate sales velocity for each item (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const salesData = await db.select({
        itemId: stockHistory.itemId,
        totalSold: sql<number>`SUM(ABS(${stockHistory.quantityChange}))`,
      })
      .from(stockHistory)
      .where(
        and(
          eq(stockHistory.userId, ctx.user.id),
          eq(stockHistory.changeType, "sale"),
          gte(stockHistory.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(stockHistory.itemId);
      
      const salesMap = new Map<number, number>();
      salesData.forEach(row => {
        salesMap.set(row.itemId, Number(row.totalSold) || 0);
      });
      
      // Filter items that need reorder and calculate urgency
      const alerts = allItems
        .filter(item => item.availableQty <= lowThreshold)
        .map(item => {
          const soldLast30Days = salesMap.get(item.id) || 0;
          const salesVelocity = (soldLast30Days / 30) * 7; // units per week
          const dailyVelocity = salesVelocity / 7;
          
          // Calculate days until stockout
          let daysUntilStockout = 0;
          if (dailyVelocity > 0) {
            daysUntilStockout = Math.floor(item.availableQty / dailyVelocity);
          }
          
          const alertLevel = item.availableQty <= criticalThreshold ? "critical" : "low";
          
          return {
            ...item,
            salesVelocity: Number(salesVelocity.toFixed(1)),
            daysUntilStockout,
            alertLevel,
            suggestedReorder: reorderQty,
          };
        })
        .sort((a, b) => {
          // Sort: critical first, then by days until stockout (ascending)
          if (a.alertLevel === "critical" && b.alertLevel !== "critical") return -1;
          if (a.alertLevel !== "critical" && b.alertLevel === "critical") return 1;
          return a.daysUntilStockout - b.daysUntilStockout;
        });
      
      const summary = {
        critical: alerts.filter(a => a.alertLevel === "critical").length,
        lowStock: alerts.filter(a => a.alertLevel === "low").length,
      };
      
      return { alerts, summary };
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

  orders: router({
    create: publicProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        const input = raw as {
          salesmanName: string;
          notes?: string;
          items: Array<{
            itemId: number;
            itemCode: string;
            itemName: string;
            quantity: number;
            price: number;
          }>;
        };
        if (!input.salesmanName || !input.items || input.items.length === 0) {
          throw new Error("Invalid order data");
        }
        return input;
      })
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { orders, orderItems, items, stockHistory } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        // Generate unique order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Calculate totals
        const totalItems = input.items.length;
        const totalQuantity = input.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = input.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order record
        const [order] = await db.insert(orders).values({
          userId: 1, // Public orders don't require authentication
          orderNumber,
          salesmanName: input.salesmanName,
          status: "received",
          totalItems,
          totalQuantity,
          totalValue: totalValue.toString(),
          notes: input.notes || null,
        }).$returningId();

        const orderId = order.id;

        // Create order items and deduct stock
        for (const item of input.items) {
          console.log('[DEBUG] Inserting order item:', { orderId, itemId: item.itemId, itemCode: item.itemCode });
          // Insert order item
          await db.insert(orderItems).values({
            orderId,
            itemId: item.itemId,
            itemCode: item.itemCode,
            itemName: item.itemName,
            quantity: item.quantity,
            price: item.price.toString(),
            subtotal: (item.price * item.quantity).toString(),
          });

          // Get current item stock
          const [currentItem] = await db.select()
            .from(items)
            .where(eq(items.id, item.itemId))
            .limit(1);

          if (!currentItem) {
            throw new TRPCError({ code: "NOT_FOUND", message: `Item ${item.itemCode} not found` });
          }

          const newQuantity = (currentItem.availableQty || 0) - item.quantity;

          if (newQuantity < 0) {
            throw new TRPCError({ 
              code: "BAD_REQUEST", 
              message: `Insufficient stock for ${item.itemName}. Available: ${currentItem.availableQty}, Requested: ${item.quantity}` 
            });
          }

          // Update item stock
          await db.update(items)
            .set({ 
              availableQty: newQuantity,
              lastSoldDate: new Date(),
            })
            .where(eq(items.id, item.itemId));

          // Record stock history
          await db.insert(stockHistory).values({
            userId: currentItem.userId,
            itemId: item.itemId,
            changeType: "sale",
            quantityChange: -item.quantity,
            quantityAfter: newQuantity,
            notes: `Order #${orderNumber} - ${input.salesmanName}`,
          });
        }

        // Send WhatsApp notification
        try {
          const { sendOrderNotification } = await import("./_core/whatsappNotification");
          const orderDetails = {
            orderNumber,
            salesmanName: input.salesmanName,
            items: input.items.map(item => ({
              itemCode: item.itemCode,
              itemName: item.itemName,
              quantity: item.quantity,
              price: `KWD ${item.price.toFixed(3)}`,
            })),
            totalValue: totalValue.toFixed(3),
            totalQuantity,
          };
          await sendOrderNotification(orderDetails);
        } catch (error) {
          console.error("[WhatsApp] Failed to send order notification:", error);
          // Don't fail the order if WhatsApp notification fails
        }

        return {
          success: true,
          orderNumber,
          orderId,
        };
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { orders, orderItems } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");

        // Get all orders for the user
        const allOrders = await db.select()
          .from(orders)
          .where(eq(orders.userId, ctx.user.id))
          .orderBy(desc(orders.createdAt));

        // Get order items for each order
        const ordersWithItems = await Promise.all(
          allOrders.map(async (order) => {
            const items = await db.select()
              .from(orderItems)
              .where(eq(orderItems.orderId, order.id));

            return {
              ...order,
              items,
            };
          })
        );

        return ordersWithItems;
      }),

    getByOrderNumber: publicProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        const input = raw as { orderNumber: string };
        if (!input.orderNumber) {
          throw new Error("Order number is required");
        }
        return input;
      })
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { orders, orderItems } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        // Optimized: Get order and items in parallel
        const [orderResult, itemsResult] = await Promise.all([
          db.select()
            .from(orders)
            .where(eq(orders.orderNumber, input.orderNumber))
            .limit(1),
          db.select()
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(eq(orders.orderNumber, input.orderNumber))
        ]);

        if (orderResult.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        const order = orderResult[0];
        const items = itemsResult.map(row => row.orderItems);

        return {
          ...order,
          items,
        };
      }),

    delete: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        const input = raw as { orderId: number };
        if (!input.orderId) {
          throw new Error("Order ID is required");
        }
        return input;
      })
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { orders, orderItems } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");

        // Verify the order belongs to the user
        const [order] = await db.select()
          .from(orders)
          .where(and(
            eq(orders.id, input.orderId),
            eq(orders.userId, ctx.user.id)
          ))
          .limit(1);

        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found or access denied" });
        }

        // Delete order items first (foreign key constraint)
        await db.delete(orderItems)
          .where(eq(orderItems.orderId, input.orderId));

        // Delete the order
        await db.delete(orders)
          .where(eq(orders.id, input.orderId));

        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input((raw: unknown) => {
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid input");
        }
        const input = raw as { orderId: number; status: "received" | "delivered" };
        if (!input.orderId || !input.status) {
          throw new Error("Order ID and status are required");
        }
        if (input.status !== "received" && input.status !== "delivered") {
          throw new Error("Status must be 'received' or 'delivered'");
        }
        return input;
      })
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { orders } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");

        // Verify the order belongs to the user
        const [order] = await db.select()
          .from(orders)
          .where(and(
            eq(orders.id, input.orderId),
            eq(orders.userId, ctx.user.id)
          ))
          .limit(1);

        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found or access denied" });
        }

        // Update order status
        await db.update(orders)
          .set({ status: input.status })
          .where(eq(orders.id, input.orderId));

        return { success: true, status: input.status };
      }),
  }),
});

export type AppRouter = typeof appRouter;
