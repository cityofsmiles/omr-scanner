# OMR Scanner

A camera-based OMR (optical mark recognition) answer sheet scanner that runs entirely in the browser — no server, no backend, no data ever leaves the device. Built for teachers who need fast, offline-capable multiple-choice grading without paying for a commercial app or scanner hardware.

**Live app:** https://cityofsmiles.github.io/omr-scanner/
**Answer sheet template (PDF):** https://cityofsmiles.github.io/omr-scanner/answer-sheet/answer-sheet.pdf

## Features

- **Hands-free Auto-Scan** — hold a sheet up to the camera; it auto-captures once held steady, scores it, and saves it to the batch. No taps per sheet.
- **Marker-based perspective correction** — 4 corner fiducial markers let the camera correct for angle/skew, so sheets don't need to be perfectly flat or square to the lens.
- **Answer key** — type it directly, or scan a filled-in key sheet and save the detection as the key.
- **Batch scoring + item analysis** — every scanned sheet is added to a running batch. Export a CSV with per-question correct-counts across the whole class (which items the class struggled with) plus a per-student score list.
- **Installable PWA** — "Add to Home Screen" on Android/iOS for a full-screen app icon. The service worker caches the app and OpenCV.js on first load, so it keeps working **fully offline** afterward — no wifi needed in the classroom.
- **4-up answer sheet template** — one A4 page prints 4 quarter-page mini answer sheets with cutting guides, to save paper on 50-item exams.

## How it works

All image processing (marker detection, perspective warp, bubble-fill sampling) runs client-side using [OpenCV.js](https://docs.opencv.org/) in the browser. There is no backend: the app is a single static `index.html` hosted on GitHub Pages, and every scan, score, and batch entry lives only in that browser tab's memory for the current session.

## Usage

1. **Print the answer sheet** — download the [PDF](https://cityofsmiles.github.io/omr-scanner/answer-sheet/answer-sheet.pdf), print on A4, and cut along the dashed guides into 4 individual mini answer sheets.
2. **Open the app** on a phone — [cityofsmiles.github.io/omr-scanner](https://cityofsmiles.github.io/omr-scanner/). Optionally install it as a PWA (see below) for offline use and a home-screen icon.
3. **Set the section name** at the top — this becomes the exported CSV's filename.
4. **Set the number of questions** to match the test.
5. **Set the answer key** — type it into the Answer Key box (e.g. `ABCDAABCD...`), or expand "Advanced" to scan a filled-in key sheet instead.
6. **Start Auto-Scan** and hold each student's sheet up to the camera. It captures automatically once held steady, shows the score, and adds it to the batch.
7. **Export Batch Summary CSV** when done — you'll get per-item correct-counts (item analysis) and a per-student score list in one file, named after your section.

### Installing as a PWA

- **Android/Chrome:** open the site → menu → "Add to Home screen" / "Install app"
- **iPhone/Safari:** open the site → Share button → "Add to Home Screen"

Once installed, open it once with an internet connection so the service worker can cache the app and OpenCV.js — after that, it works with no connection at all.

## Repository structure

```
index.html              the app itself (camera, scanning, scoring, batch export)
manifest.json            PWA manifest (name, icons, display mode)
sw.js                     service worker — caches the app shell + OpenCV.js for offline use
icon-192.png              app icon (192x192)
icon-512.png              app icon (512x512)
answer-sheet/
  answer-sheet.tex        LaTeX/TikZ source for the printable answer sheet
  answer-sheet.pdf        compiled answer sheet, 4 mini-sheets per A4 page
```

## Customizing the answer sheet template

The `.tex` template and the app's calibration are tightly coupled — if you change one, the other needs updating to match:

| `.tex` variable | Meaning | Must match in `index.html` |
|---|---|---|
| `\numQuestions` | Total questions | "Questions" field |
| `\numChoices` | Choices per question (A, B, C...) | Advanced → "Choices" |
| `\startX`, `\startY` | First bubble's position (inches from page edge) | Advanced → "Start X/Y" (× 100) |
| `\stepX`, `\stepY` | Spacing between choices / rows (inches) | Advanced → "Choice/Row spacing" (× 100) |
| `\bubbleRadius` | Bubble circle radius (inches) | Advanced → "Bubble radius" (× 100) |
| `\rowsPerCol`, `\colOffset` | Column wrapping for multi-column layouts | Advanced → "Rows per column" / "Column X offset" |
| `\markerMargin` | Corner marker inset from the page edge (inches) | `MARKER_MARGIN_PX` constant in `index.html` (× 100) — **this one lives in code, not the UI** |

All coordinates use a **100px-per-inch** convention throughout, so any inch value in the `.tex` file becomes that value × 100 in the app's calibration fields.

After changing the template, recompile with `pdflatex answer-sheet.tex`, reprint, then use **Advanced → Redraw Grid Overlay** in the app to visually confirm the green calibration circles land on the printed bubbles before trusting a batch scan.

## Privacy

Everything — camera feed, scanned images, detected answers, the answer key, and the batch — stays in the browser tab's memory on the device doing the scanning. Nothing is uploaded to any server. Closing the tab or reloading the page without exporting will lose any unsaved batch data (the app will warn you before this happens if there's anything unexported).

## Known limitations

- The answer key and batch exist only in memory for the current session — export the CSV before closing the tab. If you're scanning a large batch, export periodically rather than only at the very end.
- Calibration assumes a single answer sheet layout at a time. Switching between different templates (e.g. 25-item vs 50-item, or a different paper size) requires re-checking the Advanced calibration values.
- Multiple teachers using the app simultaneously on separate devices is fine (each browser tab is fully independent). Sharing one device between teachers without clearing the batch in between will mix their data together.

## License

MIT — see [LICENSE](LICENSE).
