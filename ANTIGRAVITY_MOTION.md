# Antigravity Motion System Documentation

## Overview
Premium lift animation system with spring easing, soft glow effects, and entrance animations for a luxury UI experience.

---

## CSS Classes

### Core Motion Classes

#### `.antigravity-lift`
Basic hover lift animation (-6px translateY)
```html
<div class="glass-panel antigravity-lift">
  Lifts on hover
</div>
```

#### `.antigravity-lift-glow`
Hover lift + soft edge glow effect
```html
<div class="glass-panel antigravity-lift-glow">
  Lifts with glowing edges
</div>
```

#### `.antigravity-fade-up`
Entrance animation - fades up from bottom
```html
<div class="antigravity-fade-up antigravity-visible">
  Fades up on load
</div>
```

#### `.antigravity-spring`
Gentle scale with lift on hover
```html
<button class="btn antigravity-spring">
  Spring scale effect
</button>
```

#### `.antigravity-sidebar-item`
Sidebar navigation item with indicator bar
```html
<a class="nav-item antigravity-sidebar-item">
  <Icon /> Menu Item
</a>
```

#### `.antigravity-button`
Button with ripple and lift effect
```html
<button class="btn antigravity-button">
  Premium Button
</button>
```

#### `.antigravity-panel`
Form panel with focus-within enhancement
```html
<form class="glass-panel antigravity-panel">
  Interactive form panel
</form>
```

### Staggered Animations
Add sequential delays for cascading entrance effects:
```html
<div class="antigravity-fade-up antigravity-stagger-1"></div>
<div class="antigravity-fade-up antigravity-stagger-2"></div>
<div class="antigravity-fade-up antigravity-stagger-3"></div>
<!-- Up to stagger-6 (300ms delay) -->
```

---

## React Component

### AntigravityMotion Wrapper

#### Basic Usage
```jsx
import AntigravityMotion from '../components/AntigravityMotion';

<AntigravityMotion variant="lift-glow">
  <MetricCard />
</AntigravityMotion>
```

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `'lift'` | Animation type: 'lift', 'lift-glow', 'fade-up', 'spring' |
| `delay` | number | `0` | Entrance animation delay (ms) |
| `disabled` | boolean | `false` | Disable all animations |
| `className` | string | `''` | Additional CSS classes |
| `style` | object | `{}` | Inline styles |

#### Variants
```jsx
// Basic lift
<AntigravityMotion variant="lift">
  <Card />
</AntigravityMotion>

// Lift with glow
<AntigravityMotion variant="lift-glow">
  <Card />
</AntigravityMotion>

// Fade up entrance
<AntigravityMotion variant="fade-up" delay={100}>
  <Card />
</AntigravityMotion>

// Spring scale
<AntigravityMotion variant="spring">
  <Button />
</AntigravityMotion>
```

#### Staggered Grid Example
```jsx
const cards = [1, 2, 3, 4];

<div className="grid grid-cols-4 gap-24">
  {cards.map((item, index) => (
    <AntigravityMotion 
      key={item}
      variant="fade-up" 
      delay={index * 50}
    >
      <MetricCard {...item} />
    </AntigravityMotion>
  ))}
</div>
```

---

## Implementation Examples

### Dashboard Metrics
```jsx
<section className="section-spacing">
  <h2 className="section-title">Key Metrics</h2>
  <div className="grid grid-cols-4 gap-24">
    <AntigravityMotion variant="fade-up" delay={50}>
      <MetricCard title="Revenue" value="$125K" />
    </AntigravityMotion>
    <AntigravityMotion variant="fade-up" delay={100}>
      <MetricCard title="Expenses" value="$45K" />
    </AntigravityMotion>
  </div>
</section>
```

### Sidebar Navigation
```jsx
<nav className="nav-menu">
  <NavLink className="nav-item antigravity-sidebar-item">
    <LayoutDashboard size={20} />
    <span>Dashboard</span>
  </NavLink>
</nav>
```

### Form Panel
```jsx
<AntigravityMotion variant="fade-up" delay={100}>
  <form className="glass-panel antigravity-panel">
    <input type="text" className="input" />
    <button className="btn antigravity-button">
      Submit
    </button>
  </form>
</AntigravityMotion>
```

### Buttons
```jsx
// Primary action
<button className="btn btn-primary antigravity-button">
  Save Changes
</button>

// Secondary action
<button className="btn antigravity-spring">
  Cancel
</button>
```

---

## CSS Variables

Customize the motion system globally:

```css
:root {
  --spring-easing: cubic-bezier(0.22, 1, 0.36, 1);
  --antigravity-duration: 0.4s;
  --antigravity-lift: -6px;
  --glow-color: rgba(74, 14, 26, 0.15);
}
```

---

## Accessibility

The system respects `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .antigravity,
  .antigravity-* {
    transition: none;
    animation: none;
    transform: none !important;
  }
}
```

---

## Performance Notes

- Uses `will-change` for optimal GPU acceleration
- Intersection Observer for lazy entrance animations
- Hardware-accelerated transforms (translateY, scale)
- Minimal repaints with backdrop-filter

---

## Best Practices

1. **Don't overuse** - Apply to key interactive elements only
2. **Stagger wisely** - Use 50-100ms increments for grids
3. **Test on devices** - Verify performance on mobile
4. **Respect motion preferences** - System auto-disables for accessibility
5. **Combine variants** - Mix `antigravity-lift-glow` with `antigravity-panel`

---

## Browser Support

- Chrome/Edge 88+
- Firefox 94+
- Safari 15.4+
- Mobile Safari 15.4+

Graceful degradation for older browsers (no animation, functional UI).
