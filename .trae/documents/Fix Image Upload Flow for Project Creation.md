## Problem

* Mobile uploads via `/uploads` return a public URL, but the app expects a base64 string and throws "Upload failed".

* Backend `createPost` only handles base64; when given a URL, it attempts base64 upload and fails.

## Fixes

* Mobile: `utils/imagePicker.pickAndUploadImage` returns `publicUrl || url || image` so success paths include URLs.

* Backend: `posts.service.ts#createPost` accepts either a base64 string or a public URL.

  * If value starts with `http` or `https`, set `image_url` directly.

  * Else treat as base64 and upload, then set `image_url`.

## Scope

* Update `mobile-app/src/utils/imagePicker.ts`.

* Update `backend-nest/src/posts/posts.service.ts` image handling in `createPost`.

## Verification (static)

* ImageUploader will receive a URL and display via `asImageUri` (supports http URLs).

* Project creation will save `image_url` either from direct URL or from uploaded base64.

