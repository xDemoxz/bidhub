import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { assertCanBid, computeEndsAtAfterBid, getMinimumNextBid } from "@/server/domain/bid-rules";
import { AppError } from "@/server/errors";

const D = (value: string) => new Prisma.Decimal(value);
const now = new Date("2026-10-27T12:00:00Z");

const auction = {
  sellerId: "seller",
  startingPrice: D("100"),
  minIncrement: D("10"),
  endsAt: new Date("2026-10-28T12:00:00Z"),
  cancelledAt: null,
  bidsCount: 0,
};

function codeOf(fn: () => void): string | undefined {
  try {
    fn();
  } catch (error) {
    if (error instanceof AppError) return `${error.status}:${error.code}`;
    throw error;
  }
  return undefined;
}

const bid = (overrides: Partial<Parameters<typeof assertCanBid>[0]> = {}) =>
  assertCanBid({ auction, highest: null, bidderId: "buyer", amount: D("100"), now, ...overrides });

describe("assertCanBid", () => {
  it("acepta la primera oferta igual al precio inicial (regla 8)", () => {
    expect(codeOf(() => bid())).toBeUndefined();
  });

  it("rechaza una primera oferta menor al precio inicial (regla 8)", () => {
    expect(codeOf(() => bid({ amount: D("99.99") }))).toBe("409:BID_TOO_LOW");
  });

  it("exige oferta más alta + incremento mínimo (regla 8)", () => {
    const highest = { amount: D("120"), bidderId: "other" };
    expect(codeOf(() => bid({ highest, amount: D("129.99") }))).toBe("409:BID_TOO_LOW");
    expect(codeOf(() => bid({ highest, amount: D("130") }))).toBeUndefined();
  });

  it("no permite ofertar en la propia subasta (regla 6)", () => {
    expect(codeOf(() => bid({ bidderId: "seller" }))).toBe("403:OWN_AUCTION");
  });

  it("no permite ofertar si la subasta venció o fue cancelada (regla 7)", () => {
    const expired = { ...auction, endsAt: new Date("2026-10-27T11:59:59Z") };
    expect(codeOf(() => bid({ auction: expired }))).toBe("409:AUCTION_NOT_ACTIVE");
    const cancelled = { ...auction, cancelledAt: new Date("2026-10-27T10:00:00Z") };
    expect(codeOf(() => bid({ auction: cancelled }))).toBe("409:AUCTION_NOT_ACTIVE");
  });

  it("quien tiene la oferta más alta no puede volver a ofertar (regla 9)", () => {
    const highest = { amount: D("120"), bidderId: "buyer" };
    expect(codeOf(() => bid({ highest, amount: D("500") }))).toBe("409:ALREADY_HIGHEST_BIDDER");
  });
});

describe("getMinimumNextBid", () => {
  it("usa el precio inicial sin ofertas y la más alta + incremento con ofertas", () => {
    expect(getMinimumNextBid(auction, null).toString()).toBe("100");
    expect(getMinimumNextBid(auction, { amount: D("150.50"), bidderId: "x" }).toString()).toBe("160.5");
  });
});

// REGLA 11
describe("computeEndsAtAfterBid", () => {
  const endsAt = new Date("2026-10-27T12:30:00Z");

  it("no extiende si faltan más de 5 minutos", () => {
    const result = computeEndsAtAfterBid(endsAt, new Date("2026-10-27T12:24:00Z"));
    expect(result).toEqual(endsAt);
  });

  it("extiende 5 minutos si faltan exactamente 5", () => {
    const result = computeEndsAtAfterBid(endsAt, new Date("2026-10-27T12:25:00Z"));
    expect(result).toEqual(new Date("2026-10-27T12:35:00Z"));
  });

  it("se repite con cada oferta dentro del margen", () => {
    const first = computeEndsAtAfterBid(endsAt, new Date("2026-10-27T12:27:00Z"));
    const second = computeEndsAtAfterBid(first, new Date("2026-10-27T12:31:00Z"));
    expect(second).toEqual(new Date("2026-10-27T12:40:00Z"));
  });
});
