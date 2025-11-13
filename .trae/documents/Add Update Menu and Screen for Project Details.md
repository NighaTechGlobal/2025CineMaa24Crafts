## Goals
- Show contextual menu with Update and Delete when tapping the three dots in ProjectDetails.
- Navigate to a new UpdateProject screen to edit post details and save via API.
- Keep deletion confirmation and behavior intact.

## Files
- Update `mobile-app/src/screens/projects/ProjectDetailsScreen.tsx` to show the menu and navigate to UpdateProject.
- Add `mobile-app/src/screens/projects/UpdateProjectScreen.tsx` with a form to edit details.
- Update `mobile-app/src/navigation/AppNavigator.tsx` to register `UpdateProject` route.

## Behaviors
- Menu appears near the top-right, offering Update and Delete.
- Update opens pre-filled form; submits via `updatePost(id, updates)`.
- Delete continues to prompt confirmation.

## Constraints
- No commands executed; no README files created.

## Verification (static)
- Ensure imports compile; route exists; menu state toggles; API functions used are already present.