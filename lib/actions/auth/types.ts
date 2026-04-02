import { z } from "zod";

export const EmailSchema = z.string().email("Invalid email address").toLowerCase().trim();
export const PasswordSchema = z.string().min(8, "Password must be at least 8 characters");

export type AuthResult<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  status?: number;
};

export type UserSessionData = {
  id: string;
  displayName: string;
  email: string;
  role: string;
};

export type LoginResult = AuthResult<{
  user: UserSessionData;
  sessionToken: string;
  expiresAt: Date;
}>;

export type RegisterResult = AuthResult<{
  userId: string;
  email: string;
}>;
