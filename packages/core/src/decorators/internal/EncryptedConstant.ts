/**
 * The password an {@link EncryptedModule} gives each controller it reaches.
 *
 * @internal
 */
export const ENCRYPTION_METADATA_KEY = "nestia:core:encryption:password";

/**
 * The password an {@link EncryptedController} declares for its own class, kept
 * apart from the module's so that the module never replaces it.
 *
 * @internal
 */
export const ENCRYPTION_CONTROLLER_METADATA_KEY =
  "nestia:core:encryption:controller-password";
