# GPBC Finance Platform - Premium Enterprise Design System

## 🎨 Design Philosophy

**Sacred + Modern + Premium**

A ministry-first design system with enterprise quality. This is not corporate finance, not a banking app—it's a sacred space that deserves premium treatment.

---

## 🔤 Typography

### Font Family
- **Primary**: Inter (Enterprise Quality)
- **Fallback**: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

### Typography Scale
```css
--text-xs: 11px      /* Labels, tags */
--text-sm: 13px      /* Small text, captions */
--text-base: 15px    /* Body text */
--text-lg: 17px      /* Large body */
--text-xl: 20px      /* Section headings */
--text-2xl: 24px     /* Page titles */
--text-3xl: 30px     /* Hero headings */
--text-4xl: 36px     /* Display headings */
--text-5xl: 48px     /* Hero display */
```

### Font Weights
- **500**: Medium
- **600**: Semibold
- **700**: Bold (Primary for headings)
- **800**: Extrabold (Display headings)
- **900**: Black (Hero text)

---

## 🎨 Color System

### Sacred Ministry Colors
```css
--wine: #4A0E1A          /* Primary action, sacred moments */
--wine-light: #6B1529    /* Hover states */
--wine-dark: #320A12     /* Active states */

--green: #1F6F54         /* Success, growth */
--green-light: #2A8B6A   /* Light accent */
--green-dark: #165542    /* Dark accent */

--beige: #F5F3F0         /* Background, warmth */
--white: #FFFFFF         /* Pure surfaces */
```

### Enterprise Neutrals
```css
--text: #1A1A1A          /* Primary text */
--text-muted: #666666    /* Secondary text */
--text-light: #999999    /* Tertiary text */

--border: #E0E0E0        /* Borders, dividers */
--border-light: #F0F0F0  /* Subtle borders */
```

### Glass Morphism
```css
--glass: rgba(255, 255, 255, 0.7)
--glass-border: rgba(255, 255, 255, 0.4)
```

---

## 📏 Spacing System

**Base Unit**: 4px

```css
--space-1: 4px      /* Tight spacing */
--space-2: 8px      /* Small gaps */
--space-3: 12px     /* Base padding */
--space-4: 16px     /* Standard spacing */
--space-5: 20px     /* Medium spacing */
--space-6: 24px     /* Section spacing */
--space-8: 32px     /* Large spacing */
--space-10: 40px    /* XL spacing */
--space-12: 48px    /* 2XL spacing */
--space-16: 64px    /* Section padding */
--space-20: 80px    /* Hero spacing */
```

**Usage Examples**:
- Button padding: `var(--space-3) var(--space-6)`
- Card padding: `var(--space-6)`
- Section gaps: `var(--space-8)` to `var(--space-12)`

---

## 🔲 Border Radius

```css
--radius-sm: 8px     /* Small elements (tags, badges) */
--radius-md: 12px    /* Inputs, buttons */
--radius-lg: 16px    /* Cards */
--radius-xl: 20px    /* Panels */
--radius-2xl: 24px   /* Hero sections */
```

---

## ✨ Shadows

6-level shadow scale for depth hierarchy:

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06)
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08)
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.12)
--shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.16)
--shadow-2xl: 0 24px 48px rgba(0, 0, 0, 0.20)
```

---

## 🎬 Animation System

### Spring Easing
```css
--ease-spring: cubic-bezier(0.22, 1, 0.36, 1)
```

### Duration Scale
```css
--duration-fast: 150ms    /* Micro-interactions */
--duration-base: 250ms    /* Standard transitions */
--duration-slow: 400ms    /* Complex animations */
```

### Animation Classes

**Entrance Animations**:
- `.animate-fade-in` - Fade in with subtle lift
- `.animate-slide-up` - Slide from bottom
- `.animate-slide-down` - Slide from top
- `.animate-slide-left` - Slide from left
- `.animate-slide-right` - Slide from right
- `.animate-scale-in` - Scale up entrance

**Stagger Delays**:
```css
.delay-50   { animation-delay: 50ms; }
.delay-100  { animation-delay: 100ms; }
.delay-150  { animation-delay: 150ms; }
.delay-200  { animation-delay: 200ms; }
.delay-300  { animation-delay: 300ms; }
```

---

## 🚀 Antigravity Motion System

Premium lift animations with spring easing for sacred interactions.

### Classes

**Basic Lift**:
```css
.antigravity-lift          /* -6px lift on hover */
.antigravity-lift-glow     /* Lift + soft glow edge */
.antigravity-spring        /* Gentle scale + lift */
```

**Component-Specific**:
```css
.antigravity-sidebar-item  /* Sidebar navigation items */
.antigravity-button        /* Button with ripple effect */
.antigravity-panel         /* Form panels with focus */
```

**Stagger Classes**:
```css
.antigravity-stagger-1 through .antigravity-stagger-6
```

---

## 🎯 Component Patterns

### Glass Panel
```html
<div class="glass-panel">
  <!-- Premium glass morphism with gradient borders -->
</div>
```

### Glass Card
```html
<div class="glass-card">
  <!-- Lighter glass variant for nested content -->
</div>
```

### Form Input
```html
<div class="form-group">
  <label class="form-label">Field Name</label>
  <input type="text" class="form-input" />
</div>
```

### Buttons
```html
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-secondary">Secondary Action</button>
<button class="btn btn-ghost">Ghost Button</button>
<button class="btn btn-outline">Outline Button</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>

<!-- Loading state -->
<button class="btn btn-primary btn-loading">Processing...</button>
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

**Responsive Utilities**:
```css
.md\:grid-cols-2
.lg\:grid-cols-3
.lg\:grid-cols-4
.md\:hidden
.lg\:block
```

---

## 🔄 Loading States

### Skeleton Loaders
```html
<div class="skeleton skeleton-card"></div>
<div class="skeleton skeleton-title"></div>
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-avatar"></div>
```

### Spinner
```html
<div class="spinner"></div>
<div class="spinner spinner-lg"></div>
```

### Loading Overlay
```html
<div class="loading-overlay">
  <div class="spinner"></div>
</div>
```

---

## 🎭 Empty States

```html
<div class="empty-state">
  <div class="empty-icon">
    <!-- Icon component -->
  </div>
  <h3 class="empty-title">No Data Yet</h3>
  <p class="empty-subtitle">Get started by creating your first entry.</p>
  <button class="btn btn-primary">Create Entry</button>
</div>
```

---

## 🛠️ Utility Classes

### Flexbox
```css
.flex, .flex-col, .flex-wrap
.items-center, .items-start
.justify-center, .justify-between, .justify-end
.flex-1
```

### Grid
```css
.grid
.grid-cols-1, .grid-cols-2, .grid-cols-3, .grid-cols-4
.gap-2, .gap-3, .gap-4, .gap-6, .gap-8
```

### Spacing
```css
.p-4, .p-6, .p-8
.px-4, .px-6
.py-4, .py-6
.mt-4, .mt-6
.mb-4, .mb-6
```

### Display
```css
.hidden, .visible, .invisible
.overflow-hidden, .overflow-auto
```

### Position
```css
.relative, .absolute, .fixed
.z-10, .z-20, .z-50
```

---

## 🌙 Dark Mode Support

All glass morphism, borders, and text colors automatically adapt to `prefers-color-scheme: dark`.

---

## ♿ Accessibility

### Reduced Motion
All animations respect `prefers-reduced-motion: reduce` and disable transforms automatically.

---

## 📋 Implementation Checklist

✅ **Foundation**
- [x] Inter font implemented
- [x] Comprehensive CSS variables (spacing, typography, shadows, colors)
- [x] Dark mode support
- [x] Spring easing standard

✅ **Components**
- [x] Typography hierarchy (.h1, .h2, .section-title, .body-text)
- [x] Glass morphism system (.glass-panel, .glass-card)
- [x] Form system (.form-group, .form-input, .form-label)
- [x] Button system (.btn, variants, sizes, loading states)

✅ **Animations**
- [x] Entrance animations (@keyframes fadeIn, slideUp, etc.)
- [x] Antigravity motion system (lift, glow, spring)
- [x] Stagger delays
- [x] Reduced motion support

✅ **States**
- [x] Loading states (skeleton, spinner, overlay)
- [x] Empty states
- [x] Hover feedback
- [x] Focus states

✅ **Layout**
- [x] Spacing system applied to App.css
- [x] Responsive utilities
- [x] Mobile-first breakpoints
- [x] Grid and flexbox utilities

---

## 🎯 Next Steps

1. **Review Component CSS Files**: Update individual component styles (MetricCard.css, Sidebar.css, etc.) to use new design tokens
2. **Apply Utility Classes**: Replace hardcoded values with utility classes where appropriate
3. **Test Dark Mode**: Verify all components look correct in dark mode
4. **Mobile Testing**: Test responsive behavior on actual devices
5. **Animation Polish**: Add entrance animations to key UI moments
6. **Loading States**: Implement skeleton loaders in data-heavy components
7. **Empty States**: Add empty state designs for all list/grid views

---

## 📚 Resources

- **Font**: [Inter by Rasmus Andersson](https://rsms.me/inter/)
- **Easing**: [Cubic Bezier Generator](https://cubic-bezier.com/#.22,1,.36,1)
- **Colors**: Ministry-first palette (Wine #4A0E1A, Green #1F6F54)

---

*Built with ❤️ for sacred spaces that deserve premium quality*
