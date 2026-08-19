# WebReceipt Style Guide

## Design System for Hackathon Submission

### Color Palette

#### Primary Colors
- **Purple**: `#a371f7` - Primary brand color, evokes creativity and trust
- **Blue**: `#58a6ff` - Secondary accent, represents technology and reliability
- **Gradient**: Linear gradient from `#667eea` to `#764ba2` - Used for CTAs and highlights

#### Semantic Colors
- **Success**: `#3fb950` - For positive states, achievements, validation
- **Error**: `#f85149` - For errors, failures, warnings
- **Warning**: `#d29922` - For caution states, pending items
- **Info**: `#58a6ff` - For informational content

#### Neutral Colors
- **Background**: `#0a0e17` - Main background
- **Surface**: `#161b22` - Cards, panels
- **Border**: `#30363d` - Dividers, outlines
- **Text Primary**: `#e6edf3` - Main text
- **Text Secondary**: `#8b949e` - Supporting text

### Typography

#### Font Family
- **Primary**: Inter (weights: 400, 500, 600, 700, 800, 900)
- **Monospace**: DM Mono (weights: 400, 500) - For code, data

#### Type Scale
- **Hero Title**: 48px / 56px / 64px (mobile / tablet / desktop)
- **Section Title**: 32px / 40px / 48px
- **Card Title**: 20px / 24px
- **Body**: 16px (minimum for accessibility)
- **Small**: 14px
- **Caption**: 12px

#### Line Heights
- **Tight**: 1.1 (headings)
- **Normal**: 1.5 (body text)
- **Relaxed**: 1.8 (long-form content)

### Spacing

#### Scale (4px base unit)
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px

#### Component Spacing
- **Card padding**: 32px
- **Button padding**: 12px 24px
- **Input padding**: 16px 12px
- **Section spacing**: 96px

### Components

#### Buttons
- **Primary**: Gradient background, rounded-full, hover scale effect
- **Secondary**: Transparent with border, hover background effect
- **Icon buttons**: 44x44px minimum touch target
- **Loading state**: Spinner animation

#### Inputs
- **Floating labels**: Animate from center to top on focus
- **Validation**: Inline success/error messages with icons
- **Focus states**: Purple ring, scale animation
- **Error shake**: Shake animation on invalid input

#### Cards
- **Background**: Semi-transparent white
- **Border**: Subtle white border
- **Hover**: Lift effect with shadow
- **Radius**: 16px (large radius for modern feel)

#### Navigation
- **Desktop**: Persistent sidebar (256px width)
- **Mobile**: Bottom tab bar with icons
- **Active state**: Gradient background with pulse indicator
- **Hover**: Background color change

### Micro-interactions

#### Button Hover
```css
.btn-hover {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-hover:hover {
  transform: scale(1.05);
}
.btn-hover:active {
  transform: scale(0.98);
}
```

#### Loading Spinner
```css
.spinner {
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--purple);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 0.8s linear infinite;
}
```

#### Success Check Animation
```css
@keyframes success-check {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}
```

#### Error Shake
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

#### Progress Bar
```css
.progress-bar {
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Accessibility

#### WCAG 2.1 AA Compliance
- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Touch targets**: Minimum 44x44px for all interactive elements
- **Keyboard navigation**: Visible focus states (2px purple outline)
- **Screen readers**: Proper ARIA labels and semantic HTML
- **Reduced motion**: Respects `prefers-reduced-motion` preference

#### Focus Management
```css
*:focus-visible {
  outline: 2px solid var(--purple);
  outline-offset: 2px;
}
```

### Responsive Design

#### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

#### Mobile-First Approach
- Default styles for mobile
- Progressive enhancement for larger screens
- Touch-optimized interactions on mobile
- Bottom navigation for easy thumb reach

### Performance

#### Optimization Strategies
- **System fonts**: No external font loading for body text
- **Lazy loading**: Images and components loaded on demand
- **Code splitting**: Route-based chunking
- **Tree shaking**: Unused code elimination
- **CSS optimization**: Purge unused styles

#### Target Metrics
- **Lighthouse Performance**: > 95
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Cumulative Layout Shift**: < 0.1

### Gamification Elements

#### Progress Indicators
- **XP Bar**: Gradient fill with smooth animation
- **Level Display**: Trophy icon with level number
- **Streak Counter**: Flame icon with ping animation

#### Achievements
- **Locked state**: Reduced opacity, grayscale
- **Unlocked state**: Full color, glow effect
- **Progress**: Percentage indicator for in-progress achievements

#### Quick Stats
- **Daily activity**: Zap icon
- **Accuracy rate**: Target icon
- **User rating**: Star icon

### Dark/Light Mode

#### Implementation
- **System preference detection**: Matches OS setting
- **Manual toggle**: User can override
- **Smooth transition**: 200ms fade between modes
- **Persistence**: Saved in localStorage

#### Theme Colors
```css
/* Dark mode (default) */
--bg: #0a0e17
--text: #e6edf3

/* Light mode */
--bg: #ffffff
--text: #1a1a1a
```

### Empty States

#### Design Principles
- **Friendly tone**: Encouraging, not blaming
- **Clear action**: Single primary CTA
- **Visual interest**: Animated icon, gradient background
- **Context-aware**: Different for each empty state type

#### Types
- **No contracts**: "Create your first contract"
- **No evidence**: "Evidence will appear here"
- **No search results**: "Try different terms"
- **Error state**: "Something went wrong"

### Innovation Features

#### AI-Powered Search
- **Smart autocomplete**: Predictive suggestions
- **Natural language**: Query with sentences
- **Context awareness**: Understands user intent
- **Learning**: Improves with usage

#### Voice Navigation
- **Web Speech API**: Browser-native voice recognition
- **Command patterns**: "Create contract", "Show evidence"
- **Feedback**: Visual confirmation of voice commands

#### Real-time Updates
- **WebSocket integration**: Live data synchronization
- **Optimistic UI**: Instant feedback, rollback on error
- **Presence indicators**: Show active users

### Success Metrics

#### Usability Targets
- **Time to primary task**: Reduced by 40%
- **SUS score**: ≥ 80
- **Task completion rate**: ≥ 90%
- **Error rate**: ≤ 5%

#### Engagement Metrics
- **Daily active users**: +25%
- **Session duration**: +30%
- **Feature adoption**: +40%
- **User satisfaction**: ≥ 4.5/5

### Component Library

#### File Structure
```
components/
├── navigation.tsx      # Mobile bottom bar + Desktop sidebar
├── empty-state.tsx    # Context-aware empty states
├── gamification.tsx   # Progress, achievements, stats
├── form-input.tsx     # Floating labels, validation
├── ui/
│   ├── card.tsx       # Reusable card components
│   ├── button.tsx     # Button variants
│   ├── badge.tsx      # Status badges
│   ├── progress.tsx   # Progress bars
│   ├── alert.tsx      # Notifications
│   └── tabs.tsx       # Tab navigation
```

#### Usage Examples

##### Navigation
```tsx
import { Navigation } from '@/components/navigation'

// Auto-adapts to mobile/desktop
<Navigation />
```

##### Empty State
```tsx
import { EmptyState } from '@/components/empty-state'

<EmptyState 
  type="contracts"
  action={{
    label: "Create Contract",
    onClick: () => router.push('/contracts/new')
  }}
/>
```

##### Gamification
```tsx
import { GamificationPanel, achievementDefinitions } from '@/components/gamification'

<GamificationPanel 
  streak={7}
  level={3}
  xp={750}
  maxXp={1000}
  achievements={achievementDefinitions}
/>
```

### Design Principles

#### Zero-Clutter Minimalism
- Every element must earn its place
- Generous white space
- Clear visual hierarchy
- Subtle shadows for depth

#### One-Second Clarity
- Value proposition above the fold
- Single primary CTA per screen
- Clear visual progression
- Intuitive iconography

#### Emotional Design
- Friendly, human tone in copy
- Celebratory animations for achievements
- Encouraging empty states
- Delightful micro-interactions

#### Mobile-First Responsiveness
- Touch-optimized (44px minimum)
- Content reflows elegantly
- Bottom navigation for mobile
- Progressive enhancement

### Hackathon Differentiators

#### Technical Excellence
- **Semantic integrity validation**: Mathematical contract verification
- **Tamper-evident storage**: SHA-256 hashing
- **Real-time monitoring**: WebSocket updates
- **AI-powered search**: Natural language queries

#### User Experience
- **Gamification**: Engaging progress system
- **Voice navigation**: Hands-free operation
- **Dark/light mode**: System preference integration
- **Accessibility first**: WCAG 2.1 AA compliant

#### Innovation
- **Progressive disclosure**: Complex features revealed gradually
- **Contextual help**: Right assistance at the right time
- **Smart onboarding**: Interactive walkthrough
- **Predictive actions**: AI-suggested next steps

This style guide ensures consistency, accessibility, and delightful user experiences across the WebReceipt platform, positioning it strongly for hackathon success.