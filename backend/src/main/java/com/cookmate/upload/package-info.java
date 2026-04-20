/**
 * Image upload proxy to Cloudflare R2. Public entrypoint: {@link
 * com.cookmate.upload.UploadController#uploadImage}.
 *
 * <p>Lifecycle:
 *
 * <ol>
 *   <li>Mobile uploads a resized image; {@code UploadController} validates + re-encodes + writes to
 *       R2, persists a {@link com.cookmate.upload.model.PendingUpload} row.
 *   <li>Mobile submits the recipe with {@code imageUrl}; {@code RecipeService.create} looks up the
 *       pending row by URL, verifies ownership, and sets {@code linkedToRecipeId = recipe.id}.
 *   <li>{@code UploadJanitor} nightly cron deletes rows where {@code linkedToRecipeId == null} and
 *       {@code uploadedAt < now - 24h} — along with their R2 objects.
 * </ol>
 */
package com.cookmate.upload;
