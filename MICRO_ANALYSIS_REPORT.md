================================================================================
COMPREHENSIVE MICRO-LEVEL PERFORMANCE ANALYSIS
================================================================================

🔴 CRITICAL ISSUES (Fix Immediately)
--------------------------------------------------------------------------------

❌ SELECT * Problems (12 found):
   routers.ts:120 - Using SELECT * (fetch only needed columns)
   routers.ts:181 - Using SELECT * (fetch only needed columns)
   routers.ts:274 - Using SELECT * (fetch only needed columns)
   routers.ts:377 - Using SELECT * (fetch only needed columns)
   routers.ts:904 - Using SELECT * (fetch only needed columns)


🟠 HIGH PRIORITY ISSUES
--------------------------------------------------------------------------------

⚠️  Missing Cache Configuration (8 found):
   StockHistory.tsx:13 - useQuery without caching options
   StockHistory.tsx:229 - useQuery without caching options
   GoogleSheetsConfig.tsx:19 - useQuery without caching options
   GoogleSheetsConfig.tsx:20 - useQuery without caching options
   Orders.tsx:43 - useQuery without caching options

⚠️  Inline Functions in JSX (29 found):
   These create new function instances on every render
   BulkItemImport.tsx:19 - Inline function in JSX (creates new function on every render)
   BulkItemImport.tsx:36 - Inline function in JSX (creates new function on every render)
   BulkItemImport.tsx:193 - Inline function in JSX (creates new function on every render)
   BulkOpeningStock.tsx:28 - Inline function in JSX (creates new function on every render)
   BulkOpeningStock.tsx:113 - Inline function in JSX (creates new function on every render)


🟡 MEDIUM PRIORITY ISSUES
--------------------------------------------------------------------------------

📊 Missing Memoization (43 found):
   BulkItemImport.tsx:67 - Array map without useMemo (causes re-renders)
   BulkItemImport.tsx:94 - Array map without useMemo (causes re-renders)
   BulkItemImport.tsx:206 - Array map without useMemo (causes re-renders)
   BulkOpeningStock.tsx:64 - Array map without useMemo (causes re-renders)
   BulkPriceUpdate.tsx:95 - Array map without useMemo (causes re-renders)

📦 Large State Objects (4 found):
   BulkItemImport.tsx:16 - Complex state object (consider splitting)
   ItemList.tsx:27 - Complex state object (consider splitting)
   PublicCatalog.tsx:21 - Complex state object (consider splitting)
   StockImport.tsx:16 - Complex state object (consider splitting)


📊 STATISTICS
--------------------------------------------------------------------------------
WHERE clauses found: 20
Unpaginated queries: 10
Mount-only useEffects: 0
Database connections: 1


💡 TOP RECOMMENDATIONS
--------------------------------------------------------------------------------
1. Add pagination to all list queries (currently unpaginated)
2. Replace inline functions with useCallback
3. Add staleTime to all useQuery calls
4. Memoize expensive computations with useMemo
5. Split large components into smaller ones
6. Add error boundaries for better error handling
7. Implement code splitting for large pages
8. Add loading skeletons instead of spinners

================================================================================