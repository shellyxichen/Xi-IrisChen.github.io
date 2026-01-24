# Portfolio Overview - Direction 1: Brutalist Minimalism

## ✨ What's Been Built

A clean, scroll-based portfolio following **brutalist minimalism** principles inspired by Seyit Yilmaz.

### 📐 Design Philosophy

- **Back to first principles** - typography and whitespace as primary design elements
- **System fonts only** - SF Pro Display / Helvetica for maximum clarity
- **Single accent color** - Your orange (#FF5C00) used sparingly
- **Hover interactions** - Content reveals on hover (like Seyit's portfolio)
- **Extreme restraint** - No unnecessary decoration

---

## 🎯 Portfolio Structure

### 1. Hero Section (Orange Background)
```
Full viewport height
- Social icons (top left): Messenger, Instagram, GitHub
- Large name: "Shelly Chen"
- Tagline: "Designer focused on craft, delight, and shipping products at scale."
```

### 2. Focus Areas (Black, 3 Columns)
```
Three equal columns showing your expertise:

Column 1: Shipped / Products
Column 2: Craft & / Delight  
Column 3: Vibe / Coding

Each with description below
```

### 3. Projects Section (Split Screen)
```
Left (40%): Black background
- Project list as text
- Hover = white, unhovered = gray

Right (60%): Lavender background  
- Shows project image on hover
- Smooth fade transitions
```

**Projects:**
- Horizon website redesign
- Messenger stories
- IG broadcast channel
- Messenger broadcast channel

### 4. Craft Section (Full Width)
```
Black background
- Large title: "Craft, motion, and delight through Origami prototypes"
- Subtitle: "Kaizen and craft programs"
- Visual showcase of Origami work
```

### 5. Vibe Coding Section (Split Screen)
```
Left (40%): Project list
- Founded and led Stargazer program (active)
- Built reusable Horizon template
- Authored starter guides
- Weekly office hours

Right (60%): Stargazer visual
- Retro grid background
- Caption below
```

---

## 🎨 Color Palette

```css
Background: #000000 (black)
Text: #FFFFFF (white)
Secondary: #999999 (gray)
Accent: #FF5C00 (orange)
Preview BG: #E8E4FF (lavender)
```

---

## 🖱️ Interactions

### Scroll Snap Navigation ⭐ NEW
- **One scroll = One view** - Portfolio divided into 5 full-screen sections
- **CSS Scroll Snap** - Smooth snapping to each section
- **Scroll Indicator** - 5 dots on right side (orange = active)
- **Keyboard Navigation** - Arrow keys, Page Up/Down, Home/End

### Hover States
- **Project names**: Gray → White on hover
- **Project preview**: Fades in corresponding image
- **Social links**: Opacity 100% → 60%
- **Navigation**: Opacity 100% → 60%
- **Scroll dots**: Grow on hover, orange when active

### Scroll Behavior
- **Desktop**: Scroll snaps to full viewport sections
- **Mobile**: Normal continuous scroll (snap disabled)
- Sections are exactly 100vh for controlled pacing

### Accessibility
- Focus states with orange outline
- Reduced motion support for accessibility
- Semantic HTML structure
- ARIA labels on icons

---

## 📱 Responsive Behavior

### Desktop (1024px+)
- Split screen layouts (40/60)
- Large typography
- Full hover interactions

### Tablet (768px - 1024px)
- Stacked layouts (projects, vibe sections)
- Adjusted typography sizes

### Mobile (< 768px)
- Single column throughout
- Touch-optimized spacing
- Reduced padding (24px vs 48px)

---

## 📊 Analytics Integration

Already configured:
- **Google Analytics**: UA-128514351-1
- **Heap Analytics**: 3026647544

Tracks:
- Project hover events
- Social link clicks
- Section views

---

## 🚀 Next Steps

### 1. Export Images from Figma
See `IMAGE_EXPORT_GUIDE.md` for detailed instructions.

Required images:
- [ ] horizon-mockup.png
- [ ] craft-origami.png  
- [ ] stargazer.png
- [ ] messenger-stories.png (optional)
- [ ] ig-broadcast.png (optional)
- [ ] messenger-broadcast.png (optional)

### 2. Customize Content (Optional)
Edit `index.html` to:
- Update social links with your actual profiles
- Add/remove projects
- Adjust descriptions

### 3. Test Locally
```bash
# Option 1: Direct open
open index.html

# Option 2: Local server
python -m http.server 8000
# Visit: http://localhost:8000

# Option 3: Using npx
npx serve
```

### 4. Deploy
```bash
git add .
git commit -m "Launch new portfolio - Direction 1: Brutalist Minimalism"
git push origin master
```

Your site will be live at: https://xi-irischen.github.io

---

## 📂 File Structure

```
.
├── index.html                    # Main HTML (NEW)
├── assets/
│   ├── css/
│   │   └── portfolio.css         # All styles (NEW)
│   └── js/
│       └── portfolio.js          # Interactions (NEW)
├── images/
│   └── [export-your-images]      # Add Figma exports here
├── README.md                     # Documentation (NEW)
├── IMAGE_EXPORT_GUIDE.md        # Export instructions (NEW)
└── PORTFOLIO_OVERVIEW.md        # This file (NEW)
```

---

## 🎯 Design Comparison

### What Makes This "Brutalist Minimalism"?

✅ **Like Seyit's Portfolio:**
- Clean, text-first approach
- Hover to reveal content
- Black background, white text
- Minimal navigation (just home icon)
- System fonts only
- No unnecessary decoration

✅ **Your Additions:**
- Orange hero section (brand moment)
- Three-pillar focus areas
- More structured content sections
- Meta/design context

❌ **Unlike Other Portfolios:**
- No busy grid layouts
- No trendy glassmorphism or gradients
- No auto-playing videos
- No complex navigation menus
- No case study template repetition

---

## 💡 Pro Tips

### Loading Speed
- The portfolio loads instantly (minimal CSS/JS)
- Images lazy-load automatically
- No heavy frameworks or libraries

### Maintenance
- Easy to update (just HTML)
- Add projects by duplicating sections
- Swap images without touching code

### First Impressions
- Orange hero makes immediate impact
- Clean typography shows design restraint
- Hover interactions demonstrate craft

---

## 🎨 If You Want to Customize Later

### Change Colors
Edit `assets/css/portfolio.css` at line 18:
```css
:root {
    --color-accent: #FF5C00;  /* Your orange */
}
```

### Add More Projects
In `index.html`, duplicate this block:
```html
<div class="project-item" data-project="project-id">
    <h2 class="project-title">Project Name</h2>
    <p class="project-meta">Description</p>
</div>
```

And add corresponding preview:
```html
<div class="preview-content" data-preview="project-id">
    <img src="images/project.png" alt="Description" class="preview-image" />
</div>
```

---

## ✅ Quality Checklist

- [x] Responsive design (mobile, tablet, desktop)
- [x] Accessibility features (focus states, ARIA)
- [x] Analytics tracking
- [x] Smooth scroll navigation
- [x] Hover interactions
- [x] Image fallbacks for missing content
- [x] Performance optimized (minimal assets)
- [x] SEO ready (semantic HTML)
- [x] Browser compatibility (modern browsers)

---

**Status**: Ready to deploy once images are added! 🚀

The portfolio works perfectly even without images (shows "Image coming soon" placeholders). You can deploy now and add images later.
