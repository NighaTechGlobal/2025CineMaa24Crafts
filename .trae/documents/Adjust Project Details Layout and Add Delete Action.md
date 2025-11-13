## Goals
- Reserve a top image area so details move down even when there’s no image.
- Add top-left back button and top-right 3-dot menu with a Delete option.
- On Delete, remove the project via Supabase-backed API and navigate back.

## Files
- `mobile-app/src/screens/projects/ProjectDetailsScreen.tsx`

## Changes
- Always render a fixed-height header container; show the project image when available, else a placeholder.
- Use `project.image_url` with fallback to `project.image` for compatibility.
- Add back button overlay and 3-dot menu overlay in the header.
- Implement `handleDeleteProject()` using existing `deletePost(id)` from `services/api.ts`.
- Show confirmation dialog before deletion using existing `ModernDialog`.

## Constraints
- Do not run any code.
- Do not create any README files.

## Verification (static)
- Ensure imports and references compile and align with existing utilities and API functions.