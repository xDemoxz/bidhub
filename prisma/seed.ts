// Seed de BidHub. Se ejecuta con `npx prisma db seed` (ver prisma.config.ts).
//
// Crea: el administrador (T8 / punto 5 del README), usuarios de ejemplo,
// categorías y subastas en los CUATRO estados (activa, cerrada, desierta y
// cancelada). Es idempotente: se puede correr varias veces sin duplicar datos
// (limpia las tablas de negocio y las vuelve a crear).
//
// ADAPTAR: si cambian las entidades, actualizar este archivo es lo primero
// después de migrar, para tener datos de prueba en todos los estados.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/server/db";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const USER_PASSWORD = "User1234!";

function img(slug: string): string {
  // Imágenes de ejemplo. El dominio está permitido en next.config.ts.
  return `https://picsum.photos/seed/${slug}/800/600`;
}

async function main(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@bidhub.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
  const now = Date.now();

  // Se borra en orden inverso a las dependencias (por las llaves foráneas).
  await prisma.refreshToken.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const [adminHash, userHash] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(USER_PASSWORD, 10),
  ]);

  const admin = await prisma.user.create({
    data: { name: "Administrador", email: adminEmail, passwordHash: adminHash, role: "ADMIN" },
  });
  const ana = await prisma.user.create({
    data: { name: "Ana Torres", email: "ana@bidhub.com", passwordHash: userHash },
  });
  const luis = await prisma.user.create({
    data: { name: "Luis Pérez", email: "luis@bidhub.com", passwordHash: userHash },
  });
  const marta = await prisma.user.create({
    data: { name: "Marta Gómez", email: "marta@bidhub.com", passwordHash: userHash },
  });

  const [cartas, relojes, vinilos, figuras] = await Promise.all(
    ["Cartas", "Relojes", "Vinilos", "Figuras"].map((name) =>
      prisma.category.create({ data: { name } }),
    ),
  );

  // --- ACTIVAS ---------------------------------------------------------
  const charizard = await prisma.auction.create({
    data: {
      title: "Carta Charizard holográfica 1999",
      description: "Primera edición en excelente estado, con funda protectora.",
      imageUrl: img("charizard"),
      startingPrice: "150.00",
      minIncrement: "10.00",
      endsAt: new Date(now + 3 * DAY),
      sellerId: ana.id,
      categoryId: cartas.id,
    },
  });
  await prisma.bid.createMany({
    data: [
      { auctionId: charizard.id, bidderId: luis.id, amount: "150.00", createdAt: new Date(now - 5 * HOUR) },
      { auctionId: charizard.id, bidderId: marta.id, amount: "170.00", createdAt: new Date(now - 2 * HOUR) },
    ],
  });

  // Sin ofertas todavía: el vendedor todavía puede editarla o cancelarla.
  await prisma.auction.create({
    data: {
      title: "Reloj automático vintage de los 70",
      description: "Mecanismo revisado, correa de cuero nueva.",
      imageUrl: img("reloj-vintage"),
      startingPrice: "300.00",
      minIncrement: "25.00",
      endsAt: new Date(now + 5 * DAY),
      sellerId: luis.id,
      categoryId: relojes.id,
    },
  });

  // Cierra en 20 minutos: sirve para ver la cuenta regresiva y la regla 11
  // (una oferta en los últimos 5 minutos extiende el cierre).
  const vinilo = await prisma.auction.create({
    data: {
      title: "Vinilo edición limitada de jazz",
      description: "Prensado original, portada sin marcas.",
      imageUrl: img("vinilo-jazz"),
      startingPrice: "80.00",
      minIncrement: "5.00",
      endsAt: new Date(now + 20 * 60 * 1000),
      sellerId: marta.id,
      categoryId: vinilos.id,
    },
  });
  await prisma.bid.create({
    data: { auctionId: vinilo.id, bidderId: ana.id, amount: "80.00", createdAt: new Date(now - HOUR) },
  });

  // --- CERRADA (ya venció y tiene ofertas: gana la más alta) -------------
  const figura = await prisma.auction.create({
    data: {
      title: "Figura de acción coleccionable",
      description: "En caja sellada, serie conmemorativa.",
      imageUrl: img("figura-accion"),
      startingPrice: "60.00",
      minIncrement: "5.00",
      endsAt: new Date(now - 2 * DAY),
      createdAt: new Date(now - 6 * DAY),
      sellerId: ana.id,
      categoryId: figuras.id,
    },
  });
  await prisma.bid.createMany({
    data: [
      { auctionId: figura.id, bidderId: luis.id, amount: "60.00", createdAt: new Date(now - 4 * DAY) },
      { auctionId: figura.id, bidderId: marta.id, amount: "70.00", createdAt: new Date(now - 3 * DAY) },
      { auctionId: figura.id, bidderId: luis.id, amount: "85.00", createdAt: new Date(now - 2 * DAY - HOUR) },
    ],
  });

  // --- DESIERTA (venció sin ofertas) -------------------------------------
  await prisma.auction.create({
    data: {
      title: "Colección de cartas de béisbol",
      description: "Lote de 40 cartas de los años 90.",
      imageUrl: img("cartas-beisbol"),
      startingPrice: "200.00",
      minIncrement: "20.00",
      endsAt: new Date(now - DAY),
      createdAt: new Date(now - 5 * DAY),
      sellerId: luis.id,
      categoryId: cartas.id,
    },
  });

  // --- CANCELADAS --------------------------------------------------------
  // 1) Cancelada por el vendedor (regla 14: solo sin ofertas).
  await prisma.auction.create({
    data: {
      title: "Reloj de bolsillo antiguo",
      description: "Publicado por error; el vendedor lo canceló.",
      imageUrl: img("reloj-bolsillo"),
      startingPrice: "120.00",
      minIncrement: "10.00",
      endsAt: new Date(now + 2 * DAY),
      cancelledAt: new Date(now - HOUR),
      sellerId: marta.id,
      categoryId: relojes.id,
    },
  });

  // 2) Cancelada por el administrador con ofertas (regla 15: motivo obligatorio).
  const moderada = await prisma.auction.create({
    data: {
      title: "Disco firmado (no verificado)",
      description: "Firma sin certificado de autenticidad.",
      imageUrl: img("disco-firmado"),
      startingPrice: "500.00",
      minIncrement: "50.00",
      endsAt: new Date(now + 4 * DAY),
      cancelledAt: new Date(now - 30 * 60 * 1000),
      cancelReason: "No se pudo verificar la autenticidad del artículo.",
      cancelledById: admin.id,
      sellerId: luis.id,
      categoryId: vinilos.id,
    },
  });
  await prisma.bid.create({
    data: { auctionId: moderada.id, bidderId: ana.id, amount: "500.00", createdAt: new Date(now - 3 * HOUR) },
  });

  console.log("Seed completado.");
  console.log(`Administrador: ${adminEmail} / ${adminPassword}`);
  console.log(`Usuarios de ejemplo: ana@bidhub.com, luis@bidhub.com, marta@bidhub.com / ${USER_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
