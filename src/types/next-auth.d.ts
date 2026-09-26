import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "ADMIN" | "USUARIO";
    };
  }

  interface User {
    id: string;
    role: "ADMIN" | "USUARIO";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "USUARIO";
  }
}
