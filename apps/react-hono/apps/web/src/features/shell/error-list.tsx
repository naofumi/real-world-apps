import { ApiError } from "../../lib/api.js";

export function ErrorList({ error }: { error: unknown }) {
  if (!error) return null;
  const messages =
    error instanceof ApiError
      ? Object.entries(error.errors).flatMap(([field, items]) => items.map((item) => `${field} ${item}`))
      : ["Something went wrong. Try again."];
  if (messages.length === 0) return null;
  return (
    <ul className="error-messages">
      {messages.map((message, index) => (
        <li key={`${message}-${index}`}>{message}</li>
      ))}
    </ul>
  );
}
