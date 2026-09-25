import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "ADMIN" | "CAPTURISTA";
    };
  }

  interface User {
    id: string;
    role: "ADMIN" | "CAPTURISTA";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "CAPTURISTA";
  }
}
