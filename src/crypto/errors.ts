// Erreurs métier : chaque échec a un code stable (pour les tests)
// et un message en français prêt à être affiché.

export type ErrorCode =
  | "PEM_INVALID"
  | "NOT_PUBLIC_KEY"
  | "PRIVATE_KEY_SHARED"
  | "KEY_TOO_WEAK"
  | "KEY_FILE_INVALID"
  | "WRONG_PASSWORD"
  | "NOT_RSAENC"
  | "UNSUPPORTED_VERSION"
  | "CORRUPTED"
  | "WRONG_KEY"
  | "TAMPERED"
  | "INTEGRITY"
  | "TOO_LARGE"
  | "PASSWORD_TOO_SHORT";

export class FileSecureError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "FileSecureError";
    this.code = code;
  }
}

export function isFileSecureError(e: unknown, code?: ErrorCode): e is FileSecureError {
  return e instanceof FileSecureError && (code === undefined || e.code === code);
}

/** Message affichable pour n'importe quelle erreur. */
export function errorMessage(e: unknown): string {
  if (e instanceof FileSecureError) return e.message;
  return "Une erreur inattendue est survenue. Réessayez.";
}
