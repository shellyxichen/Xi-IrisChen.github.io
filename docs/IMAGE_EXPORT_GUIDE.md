# Image Export Guide from Figma

## Quick Export Instructions

### From your Figma prototype:
https://www.figma.com/proto/kq6mJ6edQqNG4blEzOpTXC/Portfolio

### Images to Export:

#### 1. Horizon Website Redesign (`horizon-mockup.png`)
- **Frame**: Slide 3 (the laptop mockup with Meta Avatars)
- **Export**: Select the frame → Right click → Export → PNG at 2x
- **Save as**: `images/horizon-mockup.png`

#### 2. Craft & Origami (`craft-origami.png`)  
- **Frame**: Slide 4 (the mobile screens showing Origami prototypes)
- **Export**: Select the entire frame → PNG at 2x
- **Save as**: `images/craft-origami.png`

#### 3. Stargazer Program (`stargazer.png`)
- **Frame**: Slide 5 (retro grid background with "STARGAZER" text)
- **Export**: Select the frame → PNG at 2x
- **Save as**: `images/stargazer.png`

#### 4. Other Projects
For Messenger Stories, IG Broadcast, and Messenger Broadcast:
- Export relevant mockups/screenshots from your Figma file
- Save with corresponding names

## Export Settings in Figma

1. **Select the frame** you want to export
2. **Right sidebar** → Scroll to "Export" section
3. Click **"+"** to add export setting
4. Choose:
   - Format: **PNG**
   - Size: **2x** (for retina displays)
   - Optional: Check "Preview" to see crop
5. Click **"Export [frame name]"**
6. Save to your `/images` folder with the correct filename

## Quick Figma Keyboard Shortcuts

- Select frame: Click on frame name in layers panel
- Export selected: `Cmd/Ctrl + Shift + E`
- Preview mode: Click "Present" button (top right)

## Alternative: Screenshot Method

If you need quick placeholders:

1. Open your Figma prototype in **Present mode**
2. Navigate to each slide
3. Take screenshot:
   - **Mac**: `Cmd + Shift + 4` → Drag to select area
   - **Windows**: `Win + Shift + S` → Drag to select
4. Crop and save to `/images` folder

## Image Naming Convention

Match these exact filenames in the HTML:

```
images/
├── horizon-mockup.png          # Horizon website redesign
├── messenger-stories.png       # Messenger stories
├── ig-broadcast.png           # Instagram broadcast channel
├── messenger-broadcast.png    # Messenger broadcast channel
├── craft-origami.png          # Origami prototypes showcase
└── stargazer.png              # Stargazer program
```

## Temporary Placeholder

Until you export the real images, the portfolio will show "Image coming soon" placeholders. The layout and interactions will work perfectly—you'll just see gray boxes where images should be.

## Need Help?

The JavaScript file (`assets/js/portfolio.js`) has built-in fallback handling, so the site won't break if images are missing. Just export and add them when ready!
