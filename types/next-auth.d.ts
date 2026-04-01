import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:    string;
      roles: string[];            // e.g. ["admin"] — added from UserRole → Role
    } & DefaultSession["user"];   // keeps name, email, image from DefaultSession
  }
}