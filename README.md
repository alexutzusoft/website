# Alexutzu's Personal Website 🚀

A sleek, interactive personal website for Alexutzu - a 14-year-old software developer, CEO, and relentless innovator. Built with pure HTML, CSS, and vanilla JavaScript, featuring dark glassy UI aesthetics and cutting-edge interactive elements.

## ✨ Features

### 🎨 **1. Full-screen Animated SVG Cover**
- Hand-drawn style logo that morphs from a dot into initials "AU" on load
- Parallax effect on background sketches that move subtly with cursor movement
- Responsive hero section with animated scroll indicator

### 🤖 **2. Interactive "About Me" Room**
- Virtual room scene created with HTML/CSS
- Animated chatbot avatar with blinking eyes and random speech
- Clickable objects (coffee mug ☕, bookshelf 📚, computer 💻, trophy 🏆)
- Speech-bubble overlays with personal bio snippets
- Smooth animations and hover effects

### 🎮 **3. Skill Timeline as Game Map**
- Horizontal game map with "levels" for each skill/project
- Animated SVG path that draws on scroll
- Hoverable skill levels that reveal "loot boxes" with:
  - Python code snippets
  - C# examples
  - AI architecture diagrams
  - Robotics demonstrations
  - Cybersecurity matrix effects

### 💻 **4. Live Code Playground**
- Real-time JavaScript code editor with syntax highlighting
- Live canvas output for graphics and animations
- Safe code execution environment (dangerous functions blocked)
- Auto-run on code changes with debouncing
- Responsive design for mobile devices

### 🎵 **5. Ambient Soundscapes**
- Per-section audio tracks that auto-play on section enter
- Audio muted by default with toggle control
- Smooth transitions between section soundtracks
- Web Audio API integration for sound effects

### 🕵️ **6. Easter Egg**
- Hidden search input that listens for secret keyword: "matrix"
- Matrix-style ASCII art overlay with animated rain effect
- Procedural matrix character generation
- Sound effects and glowing animations

### 🌅 **7. Adaptive Theme**
- Automatic theme switching based on local time
- **Daytime** (06:00-18:00): Cool green and blue tones
- **Evening** (18:00-06:00): Warm orange and amber tones
- Live theme indicator in top-right corner

### ✍️ **8. Animated Footer**
- Digitized handwritten signature SVG with draw animation
- Social media icons with flourish animations on hover
- Elegant typography and inspirational quote

## 🗂️ Project Structure

```
/
├── index.html              # Main HTML structure
├── css/
│   └── style.css          # Complete CSS with animations
├── js/
│   └── script.js          # Interactive JavaScript functionality
├── assets/
│   ├── favicon.svg        # Website favicon
│   ├── audio/             # Ambient soundtracks
│   │   ├── README.md      # Audio requirements guide
│   │   ├── hero-ambient.mp3
│   │   ├── about-ambient.mp3
│   │   ├── skills-ambient.mp3
│   │   └── playground-ambient.mp3
│   └── images/
│       └── ai-architecture.svg  # Neural network diagram
└── README.md              # This file
```

## 🚀 Getting Started

### Quick Setup
1. **Clone or download** the project files
2. **Open `index.html`** in a modern web browser
3. **Experience the magic!** All features work out of the box

### For Full Experience
1. **Add audio files** to `assets/audio/` (see `assets/audio/README.md` for specifications)
2. **Customize content** in `index.html` to match your personal details
3. **Adjust colors** in `css/style.css` CSS variables section
4. **Deploy** to your favorite hosting service

### Browser Requirements
- **Modern browsers** (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- **JavaScript enabled**
- **Local file access** (for audio files) or web server hosting

## 🎛️ Customization Guide

### Personal Information
Edit the HTML content in `index.html`:
- Hero section title and description
- About section room objects and speech bubbles
- Skills timeline projects and code snippets
- Footer signature and social links

### Visual Styling
Modify CSS variables in `css/style.css`:
```css
:root {
  --accent-color: #00ff88;      /* Primary accent color */
  --secondary-color: #ff6b6b;   /* Secondary accent color */
  --primary-bg: #0a0a0f;        /* Main background */
  --glass-bg: rgba(255, 255, 255, 0.1);  /* Glass effect */
}
```

### Interactive Features
Customize JavaScript behavior in `js/script.js`:
- Easter egg keyword (default: "matrix")
- Parallax sensitivity
- Animation timings
- Audio settings

### Audio Soundscapes
Add your own ambient tracks to `assets/audio/`:
- Must be MP3 format for browser compatibility
- 2-3 minute duration with seamless looping
- Low volume (-12dB) for background ambience
- See detailed specifications in `assets/audio/README.md`

## 🛠️ Technical Features

### Performance Optimized
- **Pure vanilla JavaScript** - no frameworks, fast loading
- **CSS Grid and Flexbox** - modern responsive layouts
- **Hardware-accelerated animations** - smooth 60fps interactions
- **Lazy loading** - resources load as needed

### Accessibility
- **Semantic HTML5** structure
- **ARIA labels** for interactive elements
- **Keyboard navigation** support
- **Reduced motion** preferences respected
- **High contrast** mode support

### Modern Web Standards
- **CSS Custom Properties** for theming
- **Intersection Observer** for scroll animations
- **Web Audio API** for sound effects
- **Canvas API** for live graphics
- **SVG animations** for scalable graphics

## 🎯 Interactive Elements

### Logo Animation Sequence
1. Small dot appears and expands
2. Dot fades out as initials fade in
3. Letter paths animate with drawing effect
4. Final logo glows with accent color

### Avatar Behaviors
- **Blinking animation** every 4 seconds
- **Random eye movements** every 3-5 seconds
- **Speech updates** when objects are clicked
- **Floating animation** for speech bubble

### Skill Level Interactions
- **Hover to reveal** loot box with details
- **Pulsing animations** for skill icons
- **Sound effects** on hover (when audio enabled)
- **Smooth transitions** for all states

### Code Playground Features
- **Live execution** of JavaScript code
- **Error handling** with user-friendly messages
- **Security filtering** blocks dangerous functions
- **Canvas integration** for graphics output
- **Responsive design** adapts to screen size

## 🌐 Deployment Options

### Static Hosting (Recommended)
- **Netlify** - Drag and drop deployment
- **Vercel** - Git integration and custom domains
- **GitHub Pages** - Free hosting for public repos
- **Firebase Hosting** - Google's static hosting

### Traditional Web Hosting
- **cPanel hosting** - Upload files via FTP
- **Shared hosting** - Most providers support static sites
- **VPS/Dedicated** - Full control over server

### CDN Integration
For optimal performance, consider using a CDN for assets:
- CloudFlare for global distribution
- AWS CloudFront for enterprise needs
- Azure CDN for Microsoft integration

## 🔧 Troubleshooting

### Audio Not Playing
- Check browser autoplay policies
- Ensure audio files are in correct format (MP3)
- Verify file paths in HTML audio elements
- Use browser developer tools to check for errors

### Animations Not Smooth
- Enable hardware acceleration in browser
- Close other resource-intensive applications
- Check if "reduce motion" is enabled in OS accessibility settings

### Mobile Issues
- Test responsive breakpoints in developer tools
- Ensure touch events work properly
- Check viewport meta tag configuration

## 📱 Mobile Responsiveness

The website is fully responsive with specific optimizations for:
- **Phone screens** (320px+): Stacked layout, simplified interactions
- **Tablet screens** (768px+): Adapted grid layouts, touch-friendly buttons
- **Desktop screens** (1200px+): Full feature set, optimal spacing

## 🎨 Design Philosophy

### Dark, Glassy UI
- **Glassmorphism** effects with backdrop filters
- **Subtle glows** and shadows for depth
- **High contrast** text for readability
- **Smooth animations** for premium feel

### Color Psychology
- **Green accents** represent growth and innovation
- **Blue tones** convey trust and technology
- **Orange evening theme** creates warmth and creativity
- **Dark backgrounds** reduce eye strain and focus attention

## 🚀 Future Enhancements

Potential additions for future versions:
- **WebGL particles** for enhanced visual effects
- **Voice recognition** for easter egg activation
- **Progressive Web App** features for mobile installation
- **Blog integration** for sharing development journey
- **Portfolio gallery** with project showcases
- **Contact form** with email integration

## 📄 License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

## 👨‍💻 About Alexutzu

14-year-old software developer, CEO, and relentless innovator building the future with Python, C#, AI platforms, and sleek dark UIs. Mission: Scale projects to fund big dreams and change how people experience technology—all before turning 18.

---

**Built with ❤️ and lots of ☕ by Alexutzu**

*"Innovation is the ability to see change as an opportunity - not a threat."*