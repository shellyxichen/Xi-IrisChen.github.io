# Shelly Chen - Portfolio

A brutalist minimalism portfolio inspired by Seyit Yilmaz's clean design approach.

## Design Direction

**Direction 1: Brutalist Minimalism** - Back to first principles with:
- Clean black background with white typography
- System fonts for maximum clarity
- **Scroll snap navigation** - One scroll, one view (5 sections total)
- Hover interactions reveal project details
- Extreme whitespace and breathing room
- Single accent color (orange #FF5C00)

## Portfolio Structure (5 Scroll Sections)

1. **Hero** - Orange section with name and tagline
2. **Focus Areas** - Three pillars (Shipped, Craft, Vibe)
3. **Projects** - Hover-to-reveal project showcase
4. **Craft** - Origami prototypes and motion work
5. **Vibe Coding** - Stargazer education program

## Adding Your Project Images

To complete your portfolio, add these images to the `/images` folder:

### Required Images:

1. **horizon-mockup.png** - Horizon website redesign (laptop mockup showing Meta Avatars interface)
2. **messenger-stories.png** - Messenger stories interface mockup
3. **ig-broadcast.png** - Instagram broadcast channel design
4. **messenger-broadcast.png** - Messenger broadcast channel design
5. **craft-origami.png** - Showcase of Origami prototypes (the mobile screens collage)
6. **stargazer.png** - Stargazer program visual (the retro grid background)

### Image Guidelines:

- **Format**: PNG preferred for transparency, JPG for photos
- **Size**: Max width 2400px for retina displays
- **Optimization**: Compress images for web (use TinyPNG or similar)
- **Aspect Ratios**: 
  - Laptop mockups: ~16:10
  - Mobile screens: Keep original device ratios
  - Background graphics: 16:9 or wider

## File Structure

```
.
├── index.html              # Main portfolio page
├── assets/
│   ├── css/
│   │   └── portfolio.css   # All styles
│   └── js/
│       └── portfolio.js    # Interactions
└── images/
    └── [your-images].png   # Project images
```

## Customization

### Colors
Edit in `assets/css/portfolio.css`:
```css
:root {
    --color-bg: #000000;
    --color-text: #FFFFFF;
    --color-text-secondary: #999999;
    --color-accent: #FF5C00;  /* Your orange */
}
```

### Content
Update project details in `index.html`:
- Hero section (name, tagline)
- Focus areas (Shipped, Craft, Vibe descriptions)
- Project list (titles, descriptions)
- Social links

### Analytics
Already configured with:
- Google Analytics (UA-128514351-1)
- Heap Analytics (3026647544)

## Local Development

1. Open `index.html` in a browser, or
2. Use a local server:
```bash
python -m http.server 8000
# or
npx serve
```

## Deployment

This portfolio is designed for GitHub Pages:
1. Push to `master` branch
2. Enable GitHub Pages in repository settings
3. Your site will be live at `https://xi-irischen.github.io`

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Features

- ✅ **Scroll snap navigation** - 5 distinct full-viewport sections
- ✅ **Scroll indicator** - Dots on right side show current section
- ✅ **Keyboard navigation** - Arrow keys, Page Up/Down, Home/End
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Hover-to-reveal project previews (like Seyit's portfolio)
- ✅ Accessibility features (focus states, reduced motion support)
- ✅ Analytics tracking
- ✅ Graceful image fallbacks

### Navigation Options

- **Scroll/Swipe** - Natural scrolling snaps to sections
- **Scroll Dots** - Click dots on right to jump to any section
- **Keyboard** - Arrow keys or Page Up/Down to navigate
- **Home Icon** - Returns to top

## Credits

Design inspiration:
- [Seyit Yilmaz](https://www.seyityilmaz.com/) - Brutalist minimalism
- Direction concept: Back to first principles, Staff Designer portfolio
