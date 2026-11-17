export type LoginLocationState = { from: string };

export function loginLocationState(pathname: string, search = ""): LoginLocationState {
  return { from: `${pathname}${search}` };
}

export function loginRedirectPath(state: unknown): string {
  if (
    typeof state === "object" &&
    state !== null &&
    "from" in state &&
    typeof (state as { from: unknown }).from === "string"
  ) {
    const from = (state as LoginLocationState).from;
    if (from.length > 0) return from;
  }
  return "/";
}
