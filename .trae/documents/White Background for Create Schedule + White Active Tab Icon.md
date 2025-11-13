## Goals
- Make the Create Schedule screen background white.
- Ensure the bottom navigation icon is white when its tab’s purple slider is active.

## Files to Update
- `mobile-app/src/screens/schedules/CreateScheduleScreen.tsx`
- `mobile-app/src/navigation/MainBottomTab.tsx`

## Changes
- Set `styles.container.backgroundColor` in CreateScheduleScreen to `colors.white`.
- In CustomTabBar icon rendering, set active icon color to `colors.white` and inactive to `colors.secondaryText` so the icon remains visible inside the purple slider.

## Constraints
- Do not run any commands.
- Do not create any README files.

## Verification (static)
- Confirm style constants reflect the changes in code; no runtime execution.