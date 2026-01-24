export function success<T>(data: T, message = "OK") {
  return {
    success: true,
    message,
    data,
  };
}

export function failure(message: string, code = "ERROR") {
  return {
    success: false,
    message,
    code,
  };
}
