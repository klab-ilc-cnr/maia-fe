import { HttpErrorResponse } from '@angular/common/http';

/**
 * Text of an HTTP error for a message to the user: the message sent by the backend, or the status (the backends often answer
 * a 500 with no message, which used to be shown as "undefined").
 * @param error {HttpErrorResponse} error of the request
 */
export function httpErrorText(error: HttpErrorResponse): string {
  const message = error?.error?.message;
  if (typeof message === 'string' && message) { return message; }
  return error?.status ? `server error ${error.status}` : (error?.message ?? 'unknown error');
}
