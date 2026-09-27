import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "../src/wallet/authService";
import { OneAmConnector } from "../src/wallet/oneAmConnector";
import { generateChallenge, shortenAddress, normalizeAddress, safeAddressCompare } from "../src/utils/crypto";
import { MidnightConnectedAPI } from "../src/wallet/types";
import { vi } from "vitest";

describe("AuthService — Role Selection Model (No Master Admin)", () => {
  beforeEach(() => {
    // Clear sessionStorage before each test to ensure clean role state
    try { sessionStorage.clear(); } catch { /* noop in Node */ }
  });

  it("should default to no role (null) when nothing is selected", () => {
    expect(AuthService.getSelectedRole()).toBeNull();
    expect(AuthService.isOrganizer()).toBe(false);
    expect(AuthService.isPlayer()).toBe(false);
    expect(AuthService.getActiveRole()).toBe("PLAYER"); // defaults to PLAYER
  });

  it("should allow selecting ORGANIZER role", () => {
    AuthService.selectRole("ORGANIZER");
    expect(AuthService.getSelectedRole()).toBe("ORGANIZER");
    expect(AuthService.isOrganizer()).toBe(true);
    expect(AuthService.isPlayer()).toBe(false);
    expect(AuthService.getActiveRole()).toBe("ORGANIZER");
  });

  it("should allow selecting PLAYER role", () => {
    AuthService.selectRole("PLAYER");
    expect(AuthService.getSelectedRole()).toBe("PLAYER");
    expect(AuthService.isOrganizer()).toBe(false);
    expect(AuthService.isPlayer()).toBe(true);
    expect(AuthService.getActiveRole()).toBe("PLAYER");
  });

  it("should clear role on disconnect", () => {
    AuthService.selectRole("ORGANIZER");
    expect(AuthService.getSelectedRole()).toBe("ORGANIZER");
    AuthService.clearRole();
    expect(AuthService.getSelectedRole()).toBeNull();
    expect(AuthService.isOrganizer()).toBe(false);
    expect(AuthService.getActiveRole()).toBe("PLAYER");
  });
});

describe("1AM Wallet Connector & Address Normalization", () => {
  it("should normalize addresses of all formats", () => {
    expect(normalizeAddress("0xABC123")).toBe("0xABC123");
    expect(normalizeAddress({ address: "0xABC123" })).toBe("0xABC123");
    expect(normalizeAddress({ unshieldedAddress: "0xABC123" })).toBe("0xABC123");
    expect(normalizeAddress({ shieldedAddress: "mn_shielded123" })).toBe("mn_shielded123");
    expect(normalizeAddress(["0xABC123"])).toBe("0xABC123");
    expect(normalizeAddress(null)).toBe("");
    expect(normalizeAddress(undefined)).toBe("");
  });

  it("should safely compare addresses without throwing", () => {
    expect(safeAddressCompare("0xAbCd123", "0xabcd123")).toBe(true);
    expect(safeAddressCompare({ address: "0xAbCd123" }, "0xabcd123")).toBe(true);
    expect(safeAddressCompare(null, "0xabcd123")).toBe(false);
    expect(safeAddressCompare(undefined, undefined)).toBe(false);
  });

  it("should call signData with the correct 2-argument API", async () => {
    const mockSignData = vi.fn().mockResolvedValue({
      signature: "0xsignature12345",
      publicKey: "0xpubkey"
    });

    const mockApi: MidnightConnectedAPI = {
      getShieldedAddresses: async () => ["mn_shielded123"],
      getUnshieldedAddress: async () => "0x71C8366420A092679b54538490758BDE353613AC",
      signData: mockSignData,
      submitTransaction: vi.fn().mockResolvedValue(undefined)
    };

    const signature = await OneAmConnector.signChallenge("0x71C8366420A092679b54538490758BDE353613AC", mockApi);
    expect(signature).toBe("0xsignature12345");
    expect(mockSignData).toHaveBeenCalledTimes(1);

    const callArgs = mockSignData.mock.calls[0];
    expect(typeof callArgs[0]).toBe("string");
    expect(callArgs[0].length).toBeGreaterThan(0);
    expect(typeof callArgs[1]).toBe("object");
    expect(callArgs[1]).toEqual({ encoding: "text", keyType: "unshielded" });
  });

  it("should handle user rejection without crashing", async () => {
    const mockRejectApi: MidnightConnectedAPI = {
      getShieldedAddresses: async () => [],
      getUnshieldedAddress: async () => "0x71C8366420A092679b54538490758BDE353613AC",
      signData: vi.fn().mockRejectedValue(new Error("User rejected the transaction")),
      submitTransaction: vi.fn().mockResolvedValue(undefined)
    };

    await expect(
      OneAmConnector.signChallenge("0x71C8366420A092679b54538490758BDE353613AC", mockRejectApi)
    ).rejects.toThrow(/rejected in 1AM Wallet/);
  });
});
