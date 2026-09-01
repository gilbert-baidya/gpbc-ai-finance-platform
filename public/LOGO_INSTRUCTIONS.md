# GPBC Logo Setup Instructions

## To add the official GPBC logo to tax certificates:

1. **Save the logo image** (the image with the Trinity symbol and "Grace and Praise Bangladeshi Church" text)

2. **Name it exactly:** `gpbc-logo.png`

3. **Place it in this directory:** `/public/`

4. **Final path should be:** `/public/gpbc-logo.png`

5. **Refresh your browser** - The logo will automatically appear in:
   - Tax Certificate letters
   - IRS contribution statements
   - Any official church documents

## Logo Specifications:
- **Format:** PNG (recommended) or JPG
- **Size:** At least 400x400 pixels for best quality
- **Background:** Transparent PNG works best
- **Display size:** Automatically scaled to 128px height (h-32)

## If logo doesn't appear:
- Check the file is named exactly `gpbc-logo.png` (case-sensitive)
- Verify it's in the `/public/` folder (not `/public/assets/` or elsewhere)
- Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check browser console for any image loading errors

The component has built-in error handling - if the logo file is not found, it will gracefully hide and show only the text header.
