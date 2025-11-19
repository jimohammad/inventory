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

## UI Improvements

- [x] Increase sidebar menu font size for better visibility

## Dashboard Enhancements

- [x] Backend API for low stock items query
- [x] Backend API for profit margin analysis
- [x] Frontend: Low stock widget on dashboard
- [x] Frontend: Profit margin widget on dashboard
- [x] Implement keyboard shortcuts (Ctrl+N for new PO, Ctrl+I for new item, Ctrl+K for search, Ctrl+H for home)
- [x] Add keyboard shortcuts help dialog
- [x] Display keyboard shortcuts hints in UI

## Shareable Inventory Catalog

- [x] Backend API for public catalog (item code, name, category, purchase price, selling price)
- [x] Backend API for internal catalog (includes available quantity)
- [x] Frontend: Share link generator in Items page
- [x] Frontend: Public catalog view page (no authentication required)
- [x] Frontend: Internal catalog view page (no authentication required)
- [x] Display items in clean table/card format
- [x] Add search and filter by category
- [x] Add copy link button for easy sharing

## WhatsApp Share Feature

- [x] Add WhatsApp share buttons to Share Catalog dialog
- [x] Open WhatsApp with pre-filled message and catalog link
- [x] Support both public and internal catalog links

## Search Field Font Size

- [x] Increase Items page search field font size to 25px

## WhatsApp Broadcast Feature

- [x] Create WhatsApp contacts database table (name, phone number, notes)
- [x] Add backend procedures for WhatsApp contacts CRUD operations
- [x] Build WhatsApp Contacts management page with add/edit/delete functionality
- [x] Implement broadcast dialog with contact selection
- [x] Add sequential WhatsApp link opening functionality
- [x] Add navigation menu item for WhatsApp Contacts

## Bug Fixes

- [x] Fix bulk CSV item import - items not showing after import (fixed database schema sync issues - added missing columns and removed duplicates)
- [x] Fix 404 error when opening catalog links from WhatsApp broadcast
- [ ] Fix WhatsApp broadcast catalog link sharing - links still not working when sent via WhatsApp
- [x] Fix price display formatting to show 3 decimal places (e.g., 24.500 KWD) instead of rounded amounts
- [x] Change price columns from INT to DECIMAL to support decimal values (e.g., 24.500)

## Bulk Price Update Feature

- [x] Create backend procedure for bulk price updates (by percentage or fixed amount)
- [x] Add category filter support for bulk updates
- [x] Build bulk price update UI page with preview functionality
- [x] Add bulk price update button to Items page
- [x] Support selling price only, purchase price only, or both prices update
- [x] Add preview showing example calculation before applying changes

## Performance Optimization - Module Removal

- [x] Drop purchase orders database tables
- [x] Drop suppliers database table
- [x] Remove purchase order backend routers and procedures
- [x] Remove supplier backend routers and procedures
- [x] Remove purchase order frontend pages
- [x] Remove supplier frontend pages
- [x] Remove purchase order and supplier navigation menu items
- [x] Update dashboard to remove purchase order widgets
- [x] Clean up unused imports and dependencies

## Catalog Improvements

- [x] Remove purchase price from public catalog display (show only selling price)
- [x] Remove purchase price from internal catalog as well
- [x] Redesign catalog item cards for better visual appeal and conciseness
- [x] Increase category badge size and font for better navigation

## UI/UX Improvements

- [x] Add item count badges to category filters (e.g., "Samsung (16)")
- [x] Redesign app color scheme with appealing palette for better user experience
- [x] Update primary colors, backgrounds, and accent colors
- [x] Ensure consistent color theme across all pages

## Dashboard Search Enhancement

- [x] Add prominent search field to dashboard with autocomplete functionality
- [x] Style search with light black background and green text
- [x] Implement item suggestions dropdown showing matching items
- [x] Use larger font size for better visibility
- [x] Navigate to item details on selection

## Items Page Search Enhancement

- [x] Add Mac-style animated search field to Items page
- [x] Implement smooth expand/collapse animations
- [x] Use larger font size for better readability
- [x] Add autocomplete dropdown with item suggestions
- [x] Apply Mac-inspired design with subtle shadows and blur effects

## Sidebar Menu Mac-Style Animations

- [x] Apply Mac-style gradient glow effects to sidebar menu items
- [x] Add smooth hover and active state transitions
- [x] Implement backdrop blur effects on menu items
- [x] Add subtle shadow and border animations
- [x] Ensure consistent teal/emerald color scheme

## Sidebar Dark Theme Enhancement

- [x] Darken sidebar background color for better contrast
- [x] Update menu item base colors to darker shades
- [x] Ensure teal/emerald glow effects stand out against dark background
- [x] Test readability and visual hierarchy

## Sidebar Background Lightness Adjustment

- [x] Lighten sidebar background by 50% (from oklch 0.15 to approximately 0.30)
- [x] Maintain good contrast with glow effects
- [x] Test visual balance and readability

## WhatsApp Contacts Button Redesign

- [x] Make "Broadcast to Selected" and "Add Contact" buttons adjacent (side-by-side)
- [x] Ensure both buttons have equal width and height
- [x] Apply dark background color to both buttons
- [x] Use emerald/teal text color
- [x] Add Mac-style hover effects (gradient glow, backdrop blur, smooth transitions)
- [x] Maintain consistent design with sidebar menu items

## Unified Mac-Style UI Enhancements

- [x] Create reusable MacButton component with Mac-style effects
- [x] Replace existing buttons with MacButton component across all pages
- [x] Implement animated page transitions with fade/slide effects
- [x] Add teal glow effect on page load for cohesive experience
- [x] Apply Mac-style hover effects to stat cards (Total Items, Low Stock, etc.)
- [x] Apply Mac-style hover effects to widget cards (Low Stock Alert, Profit Margins)
- [x] Add gentle lift animation and shadow glow on card hover
- [x] Test all enhancements across Dashboard, Items, Suppliers, and other pages
