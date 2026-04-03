// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { AdminUser } from "@/lib/workos";

declare namespace App {
  interface Locals {
    user: AdminUser | null;
  }
}
