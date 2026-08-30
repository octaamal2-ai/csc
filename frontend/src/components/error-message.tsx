import { formatApiError } from "@/lib/errors";

interface ErrorMessageProps {
  error: unknown;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  if (!error) {
    return null;
  }

  if (typeof error === "string") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (Array.isArray(error)) {
    return (
      <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error.map((item, index) => (
          <p key={index}>
            {typeof item === "object" && item !== null
              ? formatApiError(item)
              : String(item)}
          </p>
        ))}
      </div>
    );
  }

  if (typeof error === "object") {
    const message =
      "message" in error && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : formatApiError(error);

    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {message}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      {String(error)}
    </div>
  );
}
