# Cookmate Design Guidelines

## Design Principles

- **Mobile-First:** Design for small screens; enhance on larger displays
- **Accessibility:** Follow WCAG 2.1 AA standards for inclusive design
- **Consistency:** Maintain uniform component behavior and visual language across the app
- **Simplicity:** Minimize cognitive load; prioritize clarity over decoration

## Color Palette

Cookmate brand colors (warm & cozy):
- **Primary:** `#FF7A3D` (warm orange) — buttons, active states, links
- **Primary Dark:** `#E85D20` — hover/pressed states
- **Primary Light:** `#FFE8DC` — backgrounds, disabled states
- **Secondary:** `#8B6914` — accent, secondary actions
- **Background:** `#FFF8F3` — app background
- **Surface:** `#FFFFFF` — cards, panels
- **Text Primary:** `#2D1810` — body text (dark warm brown)
- **Text Secondary:** `#8B7355` — labels, hints (medium warm brown)
- **Divider:** `#E8DDD0` — borders, separators (warm beige)
- **Error:** `#D32F2F` — validation, errors
- **Success:** `#388E3C` — confirmation, success states
- **Warning:** `#F57C00` — alerts, warnings
- **Shadow:** `rgba(139,105,20,0.12)` — card shadows

## Typography

Font hierarchy (custom fonts):
- **Headings:** Lora (serif, warm & elegant)
- **Body/UI:** DM Sans (sans-serif, modern & clean)
- **Heading 1:** Lora 28px, bold (0.02 letter spacing)
- **Heading 2:** Lora 24px, semibold
- **Heading 3:** Lora 20px, semibold
- **Heading 4:** Lora 16px, semibold
- **Body:** DM Sans 15px, regular (1.5 line height)
- **Caption:** DM Sans 12px, regular
- **Label/Meta:** DM Sans 14px, semibold
- **Line height:** 1.5 for readability on mobile screens

## Spacing & Layout

Use an 8px grid system for consistent sizing:
- Padding: 8px, 12px, 16px, 24px, 32px
- Margins: follow padding scale
- Gaps between components: 8px (tight), 16px (standard), 24px (large)

**Safe area:** Account for notches and home indicators on iOS/Android

## Component Guidelines

### Buttons
- Minimum touch target: 44px × 44px (iOS), 48dp × 48dp (Android)
- Primary buttons: full width on mobile, auto width on desktop
- Secondary buttons: outline variant for alternate actions
- Disabled state: reduced opacity (50%) with cursor not-allowed

### Cards
- Padding: 16px
- Border radius: 8px
- Shadow/elevation: subtle (0.5px blur, 1px offset)
- Use for grouped related content

### Forms
- Input height: 44px (touchable)
- Label above input with 8px bottom margin
- Error messages below input in red
- Validation on blur or submit

## Accessibility

### WCAG 2.1 AA Compliance
- **Color contrast:** Minimum 4.5:1 for normal text, 3:1 for large text (18pt+)
- **Touch targets:** Minimum 44px × 44px on mobile
- **Keyboard navigation:** All interactive elements keyboard accessible
- **Screen readers:** Use semantic HTML and descriptive alt text

### Implementation
- Use `accessibilityLabel` and `accessibilityRole` in React Native
- Test with screen readers (VoiceOver on iOS, TalkBack on Android)
- Avoid color as sole indicator of status

## Icons

Use Expo Vector Icons from `@expo/vector-icons`:
- **FontAwesome6:** Popular, comprehensive set
- **MaterialCommunityIcons:** Material Design icons
- **Feather:** Minimal, clean design

**Guidelines:**
- Icon size: 24px (standard), 16px (caption), 32px (highlight)
- Maintain consistent stroke weight and style
- Always pair with text labels for clarity
