import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: "Admin" | "Team Lead" | "Employee";
    phone?: string;
    designation?: string;
    teamId?: string;
    leadId?: string;
    profilePicture?: string;
  }

  interface Session {
    user: {
      id?: string;
      role?: "Admin" | "Team Lead" | "Employee";
      phone?: string;
      designation?: string;
      teamId?: string;
      leadId?: string;
      profilePicture?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "Admin" | "Team Lead" | "Employee";
    phone?: string;
    designation?: string;
    teamId?: string;
    leadId?: string;
    profilePicture?: string;
  }
}
