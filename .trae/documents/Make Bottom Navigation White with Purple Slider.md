## Target
- Update bottom navigation UI to a white tab bar with a purple sliding indicator.

## Files
- `mobile-app/src/navigation/MainBottomTab.tsx`

## Changes
- Tab bar background: set `backgroundColor` to `colors.white`.
- Sliding indicator: keep `backgroundColor: colors.primary` (purple).
- Icon colors: set active icon to `colors.primary`, inactive icon to `colors.secondaryText` for contrast on white.
- Screen options: update `tabBarActiveTintColor` to `colors.primary` and `tabBarInactiveTintColor` to `colors.secondaryText` for consistency.

## Verification
- Build app and visually confirm: white bar, purple slider, icons legible. No functional changes to navigation behavior.