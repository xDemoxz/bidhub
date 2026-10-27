import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Genera una carpeta mínima y autosuficiente para el Dockerfile (T14).
  output: "standalone",
  images: {
    // next/image solo carga imágenes de dominios permitidos (T13).
    // ADAPTAR: si las imágenes de los artículos vienen de otro dominio,
    // agregarlo aquí.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
