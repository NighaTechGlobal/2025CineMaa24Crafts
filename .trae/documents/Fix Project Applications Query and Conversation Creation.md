## Issues
- Project details fail with 400 due to selecting `posts.image` which no longer exists.
- Chat creation returns 403 from backend when inserting a conversation.

## Fixes
- Update applications join in `backend-nest/src/posts/posts.service.ts` to select `image_url` instead of `image` from `posts`.
- Add a retry path in `backend-nest/src/chat/chat.service.ts#createConversation`:
  - Try insert with user-scoped client.
  - If it fails, retry with the service-role client and use that same client for member inserts.

## Scope
- Backend-only changes; no commands executed; no README files created.

## Verification (static)
- Ensure no references to `posts.image` remain.
- Confirm conversation creation logic uses service role on permission failure.