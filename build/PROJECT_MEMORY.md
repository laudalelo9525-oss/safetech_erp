# Safetech Precast Fleet & Dispatch Logistics - Project Memory

This document serves as the persistent memory, architectural blueprint, and development knowledge base for the **Safetech Precast Logistics & Dispatch Dashboard** application. It outlines the core business constraints, user requirements, data schemas, pages, and systems interactions implemented to date.

---

## 1. Project Overview & Aesthetic System
* **Business Context**: Safetech Precast Building Manufacturing LLC is a precast concrete fabrication and logistics operation in Dubai, UAE. The application tracks concrete element production, transport scheduling, yard dispatch gates, and delivery reports.
* **Design Philosophy**:
  * **Interactive & 3D Glassmorphism**: High-fidelity dark mode dashboards with glowing neon inputs, frosted-glass panels (`glass-panel`), and micro-animations for hover and selection states.
  * **Color Palette (Red & Black)**: Directly matching the Safetech corporate branding—Vibrant Crimson Red (`text-red-500` / `#ef4444`) and Matte Concrete Black/Charcoal (`bg-neutral-900` / `bg-slate-950`).
  * **Accessibility**: Guest authentication mode is enabled by default to allow instant testing and local network previews without login barriers.

---

## 2. Core Logistics Constraints & Business Rules
* **The 24-Hour Logistics Boundary**:
  > *"The date should be one day will be counted for 24 hours like from 06:00 (GMT+4) to next day 06:00 (GMT+4). This is the daily time report timeline. If any report generated for 1.5 days, then it should show the dates and times for the report."*
  * All timestamp filtering on the reports panel strictly operates inside GMT+4 boundaries (e.g. June 29, 2026 starts at `2026-06-29T06:00:00+04:00` and ends at `2026-06-30T06:00:00+04:00`).
* **Protected Gate Security Parameters**:
  * The yard gate controller manages **Diesel status** (fuel filled), **Driver Check** (documents/safety clearance), and **Leaving Status** (exited gate).
  * **CRITICAL RULE**: Saving or editing a delivery note or updating project information must **NEVER** overwrite or touch the gate-level security values (Diesel status, Driver Availability/Checks, and Leaving status).
* **Delivery Note Document Constraints**:
  * Must print cleanly on exactly **one sheet of A4 size paper** for up to **20 entries**.
  * If a delivery exceeds 20 entries, it must paginated onto a second sheet using the exact same structure.
  * Page subtotals flow as `PAGE SUBTOTAL (Carried Forward)` on early pages and transition to `GRAND TOTAL` on the final page.
  * Rows must be spacious and legible (`h-[22px]` table row heights, `text-[9.5px]` font size, and `32px` security stamps) to ensure physical readability.
* **Delivery Report Document Constraints**:
  * Must be formatted to fit a large **A3 size paper** sheet (`297mm` x `420mm`).
  * Incorporates real-time visual charts (using Recharts) displaying trailer type distributions and project trips/volumes side-by-side.

---

## 3. Data Schema & Mock Database Structures
The mock database operates on local storage (`localStorage`) inside [supabaseClient.ts](file:///gemini/build/src/lib/supabaseClient.ts) and is seeded with actual production data:

### A. `trailers` (Master Trailer Fleet)
Contains **72 actual master trailers** with assigned drivers and mobile contacts:
```typescript
type TrailerRow = {
  id: string          // Unique key, e.g. 't1'
  plate_no: string    // E.g. '44292'
  supplier: string    // E.g. 'Hil (AF)', 'Diplomacy'
  type: string        // E.g. 'Trailer - A-Frame', 'Trailer - Flatbed'
  driver_name: string // E.g. 'Gurwinder Singh'
  driver_mobile: string // E.g. '056 3770181'
}
```

### B. `dispatch_log` (Yard gate log status)
Tracks gate exits, fuel fills, and assigned destinations:
```typescript
type DispatchLogRow = {
  id: string
  trailer_id: string
  plate_no: string
  supplier_name: string
  trailer_type: string
  driver_name: string
  driver_mobile: string
  project_no: string
  do_no: string
  shift: 'Day' | 'Night'
  diesel_status: boolean   // FUEL CHECK (Gate-protected)
  driver_status: boolean   // DRIVER CHECK (Gate-protected)
  dn_status: boolean       // DO / Delivery Note printed
  leaving_status: boolean  // false = At Yard, true = Exited (Gate-protected)
  remarks: string
  log_date: string         // YYYY-MM-DD
}
```

### C. `deliveries` (Committed delivery logs)
Stores dispatched precast concrete elements for daily billing:
```typescript
type DeliveryRow = {
  id: string
  project_no: string
  project_name: string
  location: string
  trailer_id: string
  element_type: string
  element_count: number
  dn_no: string
  volume_cum: number
  weight_tons: number
  delivery_date: string         // YYYY-MM-DD
  delivery_timestamp: string    // ISO string with GMT+4 offset, e.g., 'YYYY-MM-DDT10:00:00+04:00'
  remarks: string
}
```

### D. `fleet_status` (Kanban Board synchronization)
Drives the drag-and-drop logistics boards in real-time:
```typescript
type FleetStatusRow = {
  id: string
  trailer_id: string
  status_text: 'IN FACTORY EMPTY' | 'UNDER LOADING AT SY' | 'SHIFTING AT SITE'
  site_location: string
  driver_name: string
  status_timestamp: string
}
```

---

## 4. Page Architecture & Implementations

### A. Delivery Note Generator ([DeliveryNotePage.tsx](file:///gemini/build/src/pages/DeliveryNotePage.tsx))
* **Searchable combobox**: Allows selection of trailers from the master list. Choosing a trailer auto-fills the Plate No, Tail No, Trailer Type, Subcontractor/Transporter name, and the assigned Driver's Name and Mobile instantly.
* **Date Sync**: Incorporates an HTML5 `type="date"` input. When printing, it dynamically formats ISO dates to the official `"29 - JUNE - 2026"` design.
* **Double-way sync**: Committing a delivery note updates the corresponding `dispatch_log` record with the `project_no` and `do_no`, and transitions `fleet_status` to `UNDER LOADING AT SY` without altering Diesel, Driver clearance, or Gate exit flags.

### B. Logistics Dispatch controls ([DispatchForm.tsx](file:///gemini/build/src/pages/DispatchForm.tsx))
* **Dual entry modes**:
  1. **One-by-One Dropdown Update**: Search and select any vehicle to edit logistics flags or remarks.
  2. **Bulk CSV Upload**: Parses dispatch files, auto-aligning columns matching the format of `FLEETUPDATE LASTEST MASTER.csv` to update status parameters in bulk.
* **Real-time widgets**: Dashboard logs showing count grids (Total Fleet, At Yard, Dispatched, Shift runs).
* **Active Logistics Grid**: A spreadsheet-style table with live search and inline status buttons to adjust dispatch parameters on the fly.
* **Template recovery**: Action links generating custom CSV, Excel, and PDF blank templates preloaded with the 72 master trailers.

### C. Daily Delivery Operations Report ([DeliveryReportPage.tsx](file:///gemini/build/src/pages/DeliveryReportPage.tsx))
* **Standard A3 layout**: Large canvas featuring:
  * Category split sections (PRECAST on left, HCS on right) rendered side-by-side.
  * Real-time Pie and Bar charts illustrating load distribution.
  * 28-row detailed operations tracking list.
* **Timeline filters**: Dynamic Daily (06:00 to 06:00 GMT+4), Weekly, Monthly, and custom periods.
* **Excel export**: Generates encoded spreadsheets of the report parameters at the click of a button.

---

## 5. Development & Sandbox notes
* **Android SDCard Block**: To run dev tooling (like `vitest` or building), execute commands from the native ext4 partition (`/root/build`) rather than sandboxed directories to bypass write/execute blockages.
* **Vite Building**: Run `/usr/bin/node /root/build/node_modules/vite/bin/vite.js build` to build.
* **Testing**: Run `/usr/bin/node /root/build/node_modules/vitest/vitest.mjs run` to run unit test suites.
