// Errores de la aplicación y su traducción a HTTP.
//
// Todos los route handlers responden los errores con el MISMO formato (T7):
//   { "error": { "code": "BID_TOO_LOW", "message": "...", "details": {...} } }
//
// Convención de códigos HTTP usada en todo el proyecto:
//   400 -> el dato enviado es inválido (formato, rango, fecha fuera de ventana)
//   401 -> no hay sesión válida
//   403 -> hay sesión pero no tiene permiso (no es el dueño, no es admin...)
//   404 -> el recurso no existe
//   409 -> el recurso existe, pero su ESTADO actual impide la acción
//          (subasta no activa, oferta menor al mínimo, categoría en uso...)
//
// ADAPTAR: si la prueba nueva prefiere otro código para una regla (por
// ejemplo 422 en vez de 409), se cambia en la función de abajo que la crea.

export type ErrorDetails = Record<string, unknown>;

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: ErrorDetails,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (code: string, message: string, details?: ErrorDetails) =>
  new AppError(400, code, message, details);

export const unauthorized = (message = "Debes iniciar sesión", code = "UNAUTHORIZED") =>
  new AppError(401, code, message);

export const forbidden = (code: string, message: string) => new AppError(403, code, message);

export const notFound = (code: string, message: string) => new AppError(404, code, message);

export const conflict = (code: string, message: string, details?: ErrorDetails) =>
  new AppError(409, code, message, details);
