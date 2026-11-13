import type { AuthSnapshot } from "./auth.js";

export type ViewerRole =
  | { kind: "owner" }
  | { kind: "member"; following: boolean }
  | { kind: "guest" };

export function viewerRole(
  auth: AuthSnapshot,
  subjectUsername: string,
  following: boolean,
): ViewerRole {
  if (auth.state !== "authenticated") return { kind: "guest" };
  if (auth.user.username === subjectUsername) return { kind: "owner" };
  return { kind: "member", following };
}

export function followState(role: ViewerRole): boolean {
  return role.kind === "member" ? role.following : false;
}
