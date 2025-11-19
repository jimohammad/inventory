# Purchase Order Manager - TODO

## Core Features

- [x] Database schema for purchase orders with multiple items
- [x] Database schema for document uploads (delivery notes, invoices, payment TT)
- [x] Backend API for creating purchase orders
- [x] Backend API for updating/editing purchase orders
- [x] Backend API for deleting purchase orders
- [x] Backend API for listing all purchase orders
- [x] Backend API for viewing single purchase order details
- [x] Backend API for uploading documents (PDF/JPG)
- [x] Frontend: Dashboard layout with navigation
- [x] Frontend: Purchase order list page with search/filter
- [x] Frontend: Create new purchase order form
- [x] Frontend: Edit existing purchase order form
- [x] Frontend: View purchase order details page
- [x] Frontend: Document upload interface
- [x] Frontend: Currency conversion display (USD/AED)
- [x] Frontend: Multi-item management in forms
- [x] Testing and bug fixes
- [x] Initial checkpoint and deployment

## Supplier Management Features

- [x] Database schema for suppliers with contact information
- [x] Backend API for creating suppliers
- [x] Backend API for listing suppliers
- [x] Backend API for updating suppliers
- [x] Backend API for deleting suppliers
- [x] Frontend: Suppliers list page
- [x] Frontend: Add supplier form
- [x] Frontend: Edit supplier form
- [x] Frontend: Integrate supplier selection in purchase order forms
- [x] Frontend: Auto-fill supplier details when selected

## Dashboard & Enhancement Features

- [x] Add KWD currency support to database schema
- [x] Add bank name field to purchase orders
- [x] Add supplier invoice number field to purchase orders
- [x] Update backend API to support new fields
- [x] Create dashboard page with PO summary cards
- [x] Add KWD conversion display in dashboard
- [x] Add bank selection dropdown (NBK/CBK)
- [x] Implement advanced search (item, supplier, date, invoice number)
- [x] Add large font search field for better visibility
- [x] Add supplier invoice number to PO forms
- [x] Create purchase history view for suppliers
- [x] Display total spending per supplier

## Items Management Features

- [x] Create items database table with category field
- [x] Backend API for creating items
- [x] Backend API for listing items
- [x] Backend API for updating items
- [x] Backend API for deleting items
- [x] Frontend: Items management page
- [x] Frontend: Add item form with category
- [x] Frontend: Edit item form
- [x] Remove manual supplier entry from PO forms
- [x] Update PO forms to use item dropdown selection
- [x] Add category filter for items

## Inventory Tracking & Analysis Features

- [x] Add item code field to items table
- [x] Add available quantity field to items table
- [x] Create stock history table for tracking changes
- [x] Backend API for CSV import of stock data
- [x] Backend API for stock movement analysis
- [x] Backend API for fast/slow moving item reports
- [x] Frontend: Add item code and quantity fields to item forms
- [x] Frontend: CSV import interface for weekly stock updates
- [x] Frontend: Inventory analysis dashboard
- [x] Frontend: Fast/slow moving items report with filters
- [x] Frontend: Weekly/monthly sales quantity analysis
- [x] Calculate item movement based on PO quantities

## UX Improvements

- [x] Add Import Stock button to Inventory Analysis page for quick access

## AI-Powered Analysis Features

- [x] Backend API endpoint for AI inventory analysis
- [x] LLM integration to analyze movement data
- [x] Frontend: AI Insights card on Inventory Analysis page
- [x] Display AI-generated recommendations
- [x] Identify trends and patterns
- [x] Predict slow-moving items
- [x] Suggest optimal reorder quantities

## Google Sheets Integration

- [x] Add Google Sheets API integration
- [x] Backend: Google Sheets import service
- [x] Backend: Scheduled daily sync job
- [x] Frontend: Google Sheets configuration page
- [x] Frontend: Manual sync trigger button
- [x] Store Google Sheets URL and credentials
- [x] Map sheet columns to item codes and quantities
- [x] Add sync status and last sync time display
- [x] Add sync history/logs

## Item Management Improvements

- [x] Remove description field from items table
- [x] Remove notes field from items table
- [x] Add purchase price field to items table
- [x] Add unique constraint on item code
- [x] Add unique constraint on item name
- [x] Backend: Validate duplicate item code on create
- [x] Backend: Validate duplicate item name on create
- [x] Frontend: Remove description and notes from CreateItem form
- [x] Frontend: Remove description and notes from EditItem form
- [x] Frontend: Add purchase price field to CreateItem form
- [x] Frontend: Add purchase price field to EditItem form
- [x] Frontend: Update ItemList search to include item code
- [x] Frontend: Display purchase price in ItemList

## Performance Optimization

- [x] Diagnose slow startup issue
- [x] Optimize Dashboard initial data loading
- [x] Implement lazy loading for non-critical data
- [x] Add loading skeletons for better perceived performance
- [x] Optimize database queries with proper indexing
- [x] Reduce number of simultaneous queries on startup
- [x] Cache frequently accessed data

## Category Dropdown Feature

- [x] Update items table category field to enum type
- [x] Define predefined categories: Motorola, Samsung, Redmi, Realme, Meizu, Honor
- [x] Update backend validation for category field
- [x] Update CreateItem form with category dropdown
- [x] Update EditItem form with category dropdown
- [x] Update ItemList to display categories correctly

## UI and Performance Improvements

- [x] Rename defaultPrice to sellingPrice in database schema
- [x] Update all references to default price in backend
- [x] Update all UI labels from "Default Price" to "Selling Price"
- [x] Diagnose slow menu opening issue
- [x] Fix menu performance problems
- [x] Add opening stock field to items
- [x] Add opening stock input in CreateItem form
- [x] Add opening stock display in ItemList
- [x] Add opening stock to stock history tracking

## Google Sheets Sync Fix & Stock Management

- [x] Debug Google Sheets auto-sync not running at 2 AM
- [x] Fix scheduler timezone or cron configuration
- [x] Add bulk opening stock import via CSV
- [x] Clarify difference between Available Qty and Opening Stock in UI
- [x] Add tooltips/help text explaining stock fields
- [x] Test auto-sync functionality

## Bulk Item Import Feature

- [x] Backend API for bulk item creation from CSV
- [x] Validate item codes are unique during bulk import
- [x] Frontend: Bulk item import page with CSV upload
- [x] CSV template with all item fields (code, name, category, prices, stock)
- [x] Display import results (success count, errors)
- [x] Add bulk import button to Items page
