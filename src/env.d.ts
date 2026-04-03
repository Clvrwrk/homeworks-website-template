// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type AdminRole = "agency_admin" | "client_admin" | "worker";

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: AdminRole;
}

declare namespace App {
  interface Locals {
    user: AdminUser | null;
  }
}
