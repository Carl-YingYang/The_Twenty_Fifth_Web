// NextAuth route handler — exposes /api/auth/[...nextauth] for signIn,
// signOut, getSession, and CSRF token endpoints. P0 security: this is the
// single source of truth for all session issuance.
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
