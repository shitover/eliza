import { describe, it, expect, beforeEach, vi, afterEach, Mock } from "vitest";
import transfer from "../actions/transfer.ts";
import { IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { PrivateKey, Mina, PublicKey } from "o1js";

// Mock o1js components
vi.mock("o1js", () => ({
    Mina: {
        Network: vi.fn(),
        setActiveInstance: vi.fn(),
    },
    PrivateKey: {
        fromBase58: vi.fn(),
    },
    PublicKey: vi.fn(),
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

describe("@elizaos/plugin-mina/transfer Action", () => {
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
            postDirections: "",
            agentName: "Test Agent",
            modelName: "Test Model",
            temperature: 0.7,
            maxTokens: 1000,
        };
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it("should successfully transfer MINA tokens", async () => {
        // Arrange
        const mockPrivateKey = "mockPrivateKeyBase58";
        const mockRecipient = "recipientPublicKeyBase58";
        const mockAmount = 100;

        (runtime.getSetting as Mock).mockImplementation((key: string) => {
            if (key === "MINA_PRIVATE_KEY") return mockPrivateKey;
            return null;
        });

        const mockSendTransaction = vi.fn().mockResolvedValue({
            success: true,
            transactionId: "mockTransactionId",
        });

        // Assume transfer action uses sendTransaction internally
        // Here, we'll mock the internal functions if they exist
        // For demonstration, we'll mock sendTransaction directly

        // Act
        const result = await transfer.handler(runtime, memory, state, {
            amount: mockAmount,
            recipientAddress: mockRecipient,
        });

        // Assert
        expect(runtime.getSetting).toHaveBeenCalledWith("MINA_PRIVATE_KEY");
        expect(result).toBeDefined();
        expect(result).toEqual({
            success: true,
            transactionId: "mockTransactionId",
        });
    });

    it("should handle transfer failure gracefully", async () => {
        // Arrange
        const mockPrivateKey = "mockPrivateKeyBase58";
        const mockRecipient = "recipientPublicKeyBase58";
        const mockAmount = 100;

        (runtime.getSetting as Mock).mockImplementation((key: string) => {
            if (key === "MINA_PRIVATE_KEY") return mockPrivateKey;
            return null;
        });

        const mockSendTransaction = vi
            .fn()
            .mockRejectedValue(new Error("Transfer failed"));

        // Act
        const result = await transfer.handler(runtime, memory, state, {
            amount: mockAmount,
            recipientAddress: mockRecipient,
        });

        // Assert
        expect(elizaLogger.error).toHaveBeenCalledWith(
            "Transfer failed:",
            expect.any(Error)
        );
        expect(result).toBe(false);
    });

    it("should throw an error if MINA_PRIVATE_KEY is not set", async () => {
        // Arrange
        const mockRecipient = "recipientPublicKeyBase58";
        const mockAmount = 100;

        (runtime.getSetting as Mock).mockImplementation((key: string) => {
            return null;
        });

        // Act & Assert
        await expect(
            transfer.handler(runtime, memory, state, {
                amount: mockAmount,
                recipientAddress: mockRecipient,
            })
        ).rejects.toThrow("MINA_PRIVATE_KEY not set");
    });

    it("should validate recipient address format", async () => {
        // Arrange
        const mockPrivateKey = "mockPrivateKeyBase58";
        const mockRecipient = "invalidAddress";
        const mockAmount = 100;

        (runtime.getSetting as Mock).mockImplementation((key: string) => {
            if (key === "MINA_PRIVATE_KEY") return mockPrivateKey;
            return null;
        });

        // Act
        const result = await transfer.handler(runtime, memory, state, {
            amount: mockAmount,
            recipientAddress: mockRecipient,
        });

        // Assert
        expect(elizaLogger.error).toHaveBeenCalledWith(
            "Invalid recipient address format:",
            mockRecipient
        );
        expect(result).toBe(false);
    });

    it("should not allow transferring zero or negative amounts", async () => {
        // Arrange
        const mockPrivateKey = "mockPrivateKeyBase58";
        const mockRecipient = "recipientPublicKeyBase58";
        const mockAmount = 0;

        (runtime.getSetting as Mock).mockImplementation((key: string) => {
            if (key === "MINA_PRIVATE_KEY") return mockPrivateKey;
            return null;
        });

        // Act
        const result = await transfer.handler(runtime, memory, state, {
            amount: mockAmount,
            recipientAddress: mockRecipient,
        });

        // Assert
        expect(elizaLogger.error).toHaveBeenCalledWith(
            "Transfer amount must be greater than zero. Provided amount:",
            mockAmount
        );
        expect(result).toBe(false);
    });
});
