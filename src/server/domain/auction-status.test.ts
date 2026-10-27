import { describe, expect, it } from "vitest";
import { getAuctionStatus } from "@/server/domain/auction-status";

const now = new Date("2026-10-27T12:00:00Z");
const future = new Date("2026-10-28T12:00:00Z");
const past = new Date("2026-10-26T12:00:00Z");

// REGLAS 12 y 13
describe("getAuctionStatus", () => {
  it("activa: no cancelada y el cierre no ha llegado", () => {
    expect(getAuctionStatus({ cancelledAt: null, endsAt: future, bidsCount: 0 }, now)).toBe("ACTIVE");
  });

  it("cerrada: venció y tiene ofertas", () => {
    expect(getAuctionStatus({ cancelledAt: null, endsAt: past, bidsCount: 3 }, now)).toBe("CLOSED");
  });

  it("desierta: venció sin ofertas", () => {
    expect(getAuctionStatus({ cancelledAt: null, endsAt: past, bidsCount: 0 }, now)).toBe("DESERTED");
  });

  it("cancelada gana sobre cualquier otro estado", () => {
    const cancelledAt = new Date("2026-10-27T10:00:00Z");
    expect(getAuctionStatus({ cancelledAt, endsAt: future, bidsCount: 2 }, now)).toBe("CANCELLED");
    expect(getAuctionStatus({ cancelledAt, endsAt: past, bidsCount: 0 }, now)).toBe("CANCELLED");
  });

  it("cambia sola con el paso del tiempo, sin procesos externos (regla 13)", () => {
    const input = { cancelledAt: null, endsAt: future, bidsCount: 1 };
    expect(getAuctionStatus(input, now)).toBe("ACTIVE");
    expect(getAuctionStatus(input, new Date("2026-10-28T12:00:01Z"))).toBe("CLOSED");
  });
});
