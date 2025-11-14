import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      shopId: string;
      role: string;
      shop: {
        id: string;
        name: string;
        subscriptionTier: string;
      };
    } & DefaultSession["user"];
  }

  interface User {
    shopId: string;
    role: string;
    shop: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    shopId: string;
    role: string;
    shop: any;
  }
}
