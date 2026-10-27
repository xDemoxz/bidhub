// Versiones de Link, redirect y useRouter que respetan el idioma actual.
// Usar estas en lugar de las de "next/link" y "next/navigation".
import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
