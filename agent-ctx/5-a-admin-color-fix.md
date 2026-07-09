# Task 5-a — Admin Color Contrast Fix

## Agent
full-stack-developer (admin color fix)

## Task
Fix transparent button text in admin components: replace `bg-primary text-white` → `bg-primary text-primary-foreground` (and check for `bg-coral text-white` → `bg-coral text-coral-foreground`).

## Files Edited (9 admin components)
| File | Occurrences Replaced |
|---|---|
| `src/components/admin/AmenitiesAdmin.tsx` | 1 |
| `src/components/admin/RoomsAdmin.tsx` | 3 |
| `src/components/admin/DashboardAdmin.tsx` | 1 |
| `src/components/admin/CalendarAdmin.tsx` | 1 |
| `src/components/admin/ReportsAdmin.tsx` | 1 |
| `src/components/admin/BookingsAdmin.tsx` | 7 |
| `src/components/admin/SettingsAdmin.tsx` | 3 |
| `src/components/admin/AdminLogin.tsx` | 1 |
| `src/components/admin/GalleryAdmin.tsx` | 4 |
| **Total** | **22** |

`bg-coral text-white` was NOT present in any admin file — no changes needed there.

## Verification
- `grep -rn 'bg-primary text-white' src/components/admin/` → NONE
- `grep -rn 'bg-coral text-white' src/components/admin/` → NONE
- `bun run lint` → **0 errors, 2 warnings** (pre-existing RHF `watch()` warnings in BookingsAdmin.tsx:798 and RoomsAdmin.tsx:415 — acceptable).

## Notes for Downstream Agents
- Public (non-admin) components were NOT touched per instructions. If the same `bg-primary text-white` pattern exists in public components, it will need a separate fix pass (separate task).
- `hover:bg-primary/90` and `bg-primary/10|15|30|40` tint classes were left untouched — they are background-only and don't carry text contrast issues.
- The fix relies on `--primary-foreground` being defined as `#FFFFFF` (light) and `#0A1F25` (dark) in `src/app/globals.css`. If those values ever change, contrast will need re-verification.
