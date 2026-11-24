# Pages from a spreadsheet → Sanity

## Where each page lives

| Tab / Sanity type | URL | Example |
|---|---|---|
| products | `/{product}` | `/invoicing` (one row per product) |
| variants | `/{product}/{slug}` | `/invoicing/free`, `/time-tracking/mac` |
| audiences | `/{product}/for/{slug}` | `/invoicing/for/small-business` |
| features | `/features/{slug}` | `/features/timesheets` |
| alternatives | `/alternatives/{slug}` | `/alternatives/quickbooks` |
| comparisons | `/compare/{slug}` | `/compare/harvest-pricing` |
| guides | `/guides/{slug}` | `/guides/what-is-time-tracking-software` |

`product` is one of `invoicing`, `time-tracking`, `time-tracking-and-invoicing`.

## Import

1. Open `paidlyo-pages-template.xlsx` (or upload it to Google Sheets). It has one tab per page type
   and a **Read me** tab with the column rules. Delete the grey example row and add one row per page.
2. Export each tab you filled as CSV, named like the tab (`products.csv`, `guides.csv`, …), into
   one folder. Put the images the rows mention in an `images/` folder next to them:

   ```
   my-pages/
     guides.csv
     audiences.csv
     images/
       cover-billable-hours.png
   ```

3. Check, then import (from the project root):

   ```
   cd studio
   npm run import -- ../my-pages --dry-run   # checks every row, sends nothing
   npm run import -- ../my-pages             # uploads images, saves pages as drafts
   ```

4. Open the Studio, review the drafts and click **Publish**. The site updates within seconds.

Importing the same sheet again updates the same pages: rows are matched by `slug`, and the
import overwrites the draft, including edits you made in the Studio. Add `--publish` to skip the
review step.

`examples/` holds one valid row per page type and three images; `npm run import -- ../files/cms-templates/examples --dry-run`
shows what a passing import looks like. Don't import it for real: those pages would go live (the
products example would become the real /invoicing page).
