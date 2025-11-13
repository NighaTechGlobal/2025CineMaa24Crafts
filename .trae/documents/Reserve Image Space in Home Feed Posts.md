## Goal
- Always reserve a centered image area in each home feed post so an image can appear when available.

## File
- `mobile-app/src/screens/home/HomeFeedPost.tsx`

## Changes
- Replace conditional image rendering with an unconditional block:
  - If `post.image` exists, render the image.
  - Else, render a placeholder view (`postImagePlaceholder`) with the same dimensions to reserve space.

## Constraints
- No commands executed.
- No README files created.

## Verification (static)
- Check styles include a new `postImagePlaceholder` and component logic renders it when image is absent.