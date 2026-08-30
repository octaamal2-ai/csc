type FastApiValidationError = {
  msg?: string;
  loc?: (string | number)[];
  type?: string;
};

export function formatApiError(error: unknown): string {
  if (error === null || error === undefined) {
    return "An unknown error occurred.";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (Array.isArray(error)) {
    return error
      .map((item) => formatApiError(item))
      .filter(Boolean)
      .join("; ");
  }
  if (typeof error === "object") {
    const record = error as FastApiValidationError & { message?: string };
    if (record.msg) {
      const field = Array.isArray(record.loc)
        ? record.loc.filter((part) => part !== "body").join(".")
        : "";
      return field ? `${field}: ${record.msg}` : record.msg;
    }
    if (record.message) {
      return String(record.message);
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}
