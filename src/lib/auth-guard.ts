import { auth } from "@/auth";
import { NextResponse } from "next/server";

export type AllowedRoles = "Admin" | "Team Lead" | "Employee";

export type AuthGuardResult =
  | { authorized: true; response: null; user: any }
  | { authorized: false; response: NextResponse; user: null };

export async function authGuard(allowedRoles?: AllowedRoles[]): Promise<AuthGuardResult> {
  const session = await auth();

  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized access" }, { status: 401 }),
      user: null,
    };
  }

  const user = session.user;

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role as AllowedRoles)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Forbidden access - Insufficient privileges" }, { status: 403 }),
      user: null,
    };
  }

  return {
    authorized: true,
    response: null,
    user,
  };
}
