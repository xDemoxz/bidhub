import { describe, expect, it } from "vitest";
import {
  assertAdminCanCancel,
  assertSellerBelowActiveLimit,
  assertSellerCanCancel,
  assertSellerCanEdit,
  assertValidClosingDate,
} from "@/server/domain/auction-rules";
import { toAlias } from "@/server/domain/alias";
import { AppError } from "@/server/errors";

const now = new Date("2026-10-27T12:00:00Z");
const HOUR = 3600 * 1000;

function codeOf(fn: () => void): string | undefined {
  try {
    fn();
  } catch (error) {
    if (error instanceof AppError) return `${error.status}:${error.code}`;
    throw error;
  }
  return undefined;
}

const auction = {
  sellerId: "seller",
  cancelledAt: null,
  endsAt: new Date(now.getTime() + 24 * HOUR),
  bidsCount: 0,
};

describe("assertValidClosingDate (regla 2)", () => {
  it("acepta entre 1 hora y 7 días", () => {
    expect(codeOf(() => assertValidClosingDate(new Date(now.getTime() + HOUR), now))).toBeUndefined();
    expect(codeOf(() => assertValidClosingDate(new Date(now.getTime() + 168 * HOUR), now))).toBeUndefined();
  });

  it("rechaza menos de 1 hora y más de 7 días", () => {
    expect(codeOf(() => assertValidClosingDate(new Date(now.getTime() + HOUR - 1), now))).toBe("400:INVALID_CLOSING_DATE");
    expect(codeOf(() => assertValidClosingDate(new Date(now.getTime() + 168 * HOUR + 1), now))).toBe("400:INVALID_CLOSING_DATE");
  });
});

describe("assertSellerBelowActiveLimit (regla 4)", () => {
  it("permite hasta 4 activas y bloquea la sexta", () => {
    expect(codeOf(() => assertSellerBelowActiveLimit(4))).toBeUndefined();
    expect(codeOf(() => assertSellerBelowActiveLimit(5))).toBe("409:MAX_ACTIVE_AUCTIONS");
  });
});

describe("edición y cancelación del vendedor (reglas 5, 14, 19)", () => {
  it("el vendedor edita si está activa y sin ofertas", () => {
    expect(codeOf(() => assertSellerCanEdit(auction, "seller", now))).toBeUndefined();
  });

  it("otro usuario no puede editar ni cancelar (regla 19)", () => {
    expect(codeOf(() => assertSellerCanEdit(auction, "intruder", now))).toBe("403:NOT_AUCTION_OWNER");
    expect(codeOf(() => assertSellerCanCancel(auction, "intruder", now))).toBe("403:NOT_AUCTION_OWNER");
  });

  it("con ofertas no se edita ni se cancela (reglas 5 y 14)", () => {
    const withBids = { ...auction, bidsCount: 1 };
    expect(codeOf(() => assertSellerCanEdit(withBids, "seller", now))).toBe("409:AUCTION_HAS_BIDS");
    expect(codeOf(() => assertSellerCanCancel(withBids, "seller", now))).toBe("409:AUCTION_HAS_BIDS");
  });

  it("si ya no está activa no se edita (regla 5)", () => {
    const expired = { ...auction, endsAt: new Date(now.getTime() - HOUR) };
    expect(codeOf(() => assertSellerCanEdit(expired, "seller", now))).toBe("409:AUCTION_NOT_ACTIVE");
  });
});

describe("cancelación del administrador (regla 15)", () => {
  it("cancela aunque tenga ofertas, con motivo", () => {
    expect(codeOf(() => assertAdminCanCancel({ ...auction, bidsCount: 4 }, "Fraude", now))).toBeUndefined();
  });

  it("exige motivo", () => {
    expect(codeOf(() => assertAdminCanCancel(auction, "   ", now))).toBe("400:CANCEL_REASON_REQUIRED");
  });

  it("solo cancela subastas activas", () => {
    const cancelled = { ...auction, cancelledAt: now };
    expect(codeOf(() => assertAdminCanCancel(cancelled, "x", now))).toBe("409:AUCTION_NOT_ACTIVE");
  });
});

describe("toAlias (regla 18)", () => {
  it("muestra solo el inicio del nombre", () => {
    expect(toAlias("Ana Torres")).toBe("An***");
    expect(toAlias("X")).toBe("X***");
  });
});
