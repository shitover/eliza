// packages/plugin-mina/src/tests/wallet.test.ts
import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { walletProvider, WalletProvider } from "../providers/wallet.ts";
import { IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { Mina, PublicKey, PrivateKey } from "o1js";

// Mock o1js components
vi.mock("o1js", () => ({
    Mina: {
        Network: vi.fn(),
        setActiveInstance: vi.fn(),
    },
    PublicKey: vi.fn().mockImplementation(() => ({
        toBase58: vi.fn().mockReturnValue("mockPublicKeyBase58"),
    })),
}));

// Mock @elizaos/core components
vi.mock("@elizaos/core", () => ({
    elizaLogger: {
        error: vi.fn(),
        log: vi.fn(),
    },
    settings: {
        get: vi.fn(),
    },
}));

describe("@elizaos/plugin-mina/wallet Provider", () => {
    let runtime: IAgentRuntime;
    let memory: Memory;
    let state: State;

    beforeEach(() => {
        runtime = {
            getSetting: vi.fn(),
        } as unknown as IAgentRuntime;

        memory = {
            userId: "test-user-id",
            agentId: "test-agent-id",
            content: "test-content",
            roomId: "test-room-id",
        } as unknown as Memory;
        state = {
            bio: "",
            lore: "",
            messageDirections: "",
            postDirections: "handlePost",
            agentName: "Test Agent",
            modelName: "Test Model",
            temperature: 0.7,
            maxTokens: 1000,
        };
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it("should successfully fetch and format wallet portfolio", async () => {
        // Arrange
        const mockPrivateKey = "mockPrivateKeyBase58";
        const mockPortfolio = { balance: 1000 };
        const mockFormattedPortfolio = "Portfolio: 1000 MINA";

        (runtime.getSetting as Mock).mockImplementation((key: string) => {
            if (key === "MINA_PRIVATE_KEY") return mockPrivateKey;
            return null;
        });

        // Mock internal methods used in walletProvider
        const mockInitializeMina = vi
            .spyOn(require("../utils"), "initializeMina")
            .mockReturnValue({
                sendTransaction: vi.fn(),
                getBalance: vi.fn().mockResolvedValue(mockPortfolio.balance),
            });

        const mockFormatPortfolio = vi
            .spyOn(walletProvider as WalletProvider, "formatPortfolio")
            .mockReturnValue(mockFormattedPortfolio);

        // Act
        const result = await walletProvider.get(runtime, memory, state);

        // Assert
        expect(runtime.getSetting).toHaveBeenCalledWith("MINA_PRIVATE_KEY");
        expect(result).toBe(mockFormattedPortfolio);
    });

    it("should handle errors during wallet information fetch", async () => {
        // Arrange
        const mockPrivateKey = "mockPrivateKeyBase58";

        (runtime.getSetting as Mock).mockImplementation((key: string) => {
            if (key === "MINA_PRIVATE_KEY") return mockPrivateKey;
            return null;
        });

        // Mock initializeMina to throw an error
        const mockInitializeMina = vi
            .spyOn(require("../utils"), "initializeMina")
            .mockImplementation(() => {
                throw new Error("Failed to initialize Mina");
            });

        // Act
        const result = await walletProvider.get(runtime, memory, state);

        // Assert
        expect(elizaLogger.error).toHaveBeenCalledWith(
            "Error in wallet provider:",
            expect.any(Error)
        );
        expect(result).toBeNull();
    });

    it("should return null if Mina RPC URL is not set", async () => {
        // Arrange
        (runtime.getSetting as Mock).mockReturnValue(null);

        // Act
        const result = await walletProvider.get(runtime, memory, state);

        // Assert
        expect(elizaLogger.error).toHaveBeenCalledWith(
            "Mina RPC URL is not set in settings."
        );
        expect(result).toBeNull();
    });

    it("should handle wallet with zero balance", async () => {
        // Arrange
        const mockPrivateKey = "mockPrivateKeyBase58";
        const mockPortfolio = { balance: 0 };
        const mockFormattedPortfolio = "Portfolio: 0 MINA";

        (runtime.getSetting as Mock).mockImplementation((key: string) => {
            if (key === "MINA_PRIVATE_KEY") return mockPrivateKey;
            return null;
        });

        // Mock internal methods used in walletProvider
        const mockInitializeMina = vi
            .spyOn(require("../utils"), "initializeMina")
            .mockReturnValue({
                sendTransaction: vi.fn(),
                getBalance: vi.fn().mockResolvedValue(mockPortfolio.balance),
            });

        const mockFormatPortfolio = vi
            .spyOn(walletProvider as WalletProvider, "formatPortfolio")
            .mockReturnValue(mockFormattedPortfolio);

        // Act
        const result = await walletProvider.get(runtime, memory, state);

        // Assert
        expect(result).toBe(mockFormattedPortfolio);
    });

    it("should throw an error if MINA_PRIVATE_KEY is invalid", async () => {
        // Arrange
        const mockPrivateKey = "invalidPrivateKeyBase58";

        (runtime.getSetting as Mock).mockImplementation((key: string) => {
            if (key === "MINA_PRIVATE_KEY") return mockPrivateKey;
            return null;
        });

        // Mock initializeMina to throw an error due to invalid private key
        const mockInitializeMina = vi
            .spyOn(require("../utils"), "initializeMina")
            .mockImplementation(() => {
                throw new Error("Invalid private key");
            });

        // Act & Assert
        await expect(
            walletProvider.get(runtime, memory, state)
        ).rejects.toThrow("Invalid private key");
    });
});
