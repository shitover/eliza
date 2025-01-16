// packages/plugin-mina/src/actions/transfer.ts
import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    elizaLogger,
    ActionExample,
    composeContext,
    generateObjectDeprecated,
    ModelClass,
} from "@elizaos/core";
import { z } from "zod";
import { Mina, PrivateKey, PublicKey, AccountUpdate, UInt64 } from "o1js";
import { initializeMina } from "../utils/index.ts";

// Schema for transfer parameters
const transferSchema = z.object({
    amount: z.number().positive(),
    recipientAddress: z.string().min(1),
});

type TransferParams = z.infer<typeof transferSchema>;

const transfer: Action = {
    name: "transfer_mina",
    description: "Transfer MINA tokens to another address",
    similes: ["send_mina", "pay_mina"],
    validate: async (runtime: IAgentRuntime) => {
        const rpcUrl = runtime.getSetting("MINA_RPC_URL");
        const privateKey = runtime.getSetting("MINA_PRIVATE_KEY");
        return !!(rpcUrl && privateKey);
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1 MINA to B62qjsV6WQwTeEWrNrRRBP6VaaLvQhwWxBCUv7XP6GgWYhqAGWpFPKK",
                    action: "TRANSFER_MINA",
                    params: {
                        amount: 1,
                        recipientAddress:
                            "B62qjsV6WQwTeEWrNrRRBP6VaaLvQhwWxBCUv7XP6GgWYhqAGWpFPKK",
                    },
                },
            },
        ],
    ],
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            // Validate transfer parameters
            const parsed = transferSchema.safeParse(message.content);
            if (!parsed.success) {
                callback?.({
                    text: "Invalid transfer parameters provided.",
                    content: { error: parsed.error.toString() },
                });
                return false;
            }

            const { amount, recipientAddress } = parsed.data;

            // Initialize Mina client and get sender's private key
            const senderPrivateKey = initializeMina(runtime);
            const senderPublicKey = senderPrivateKey.toPublicKey();

            // Validate recipient address
            let recipientPublicKey: PublicKey;
            try {
                recipientPublicKey = PublicKey.fromBase58(recipientAddress);
            } catch (error) {
                callback?.({
                    text: "Invalid recipient address format.",
                    content: {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    },
                });
                return false;
            }

            // Create and send transaction
            const tx = await Mina.transaction(senderPublicKey, () => {
                AccountUpdate.fundNewAccount(senderPublicKey);
                AccountUpdate.createSigned(senderPublicKey).send({
                    to: recipientPublicKey,
                    amount: UInt64.from(amount * 1e9), // Convert to nanomina
                });
            });

            await tx.prove();
            const txHash = await tx.sign([senderPrivateKey]).send();

            callback?.({
                text: `Successfully transferred ${amount} MINA to ${recipientAddress}`,
                content: {
                    transactionHash: txHash,
                    amount,
                    recipient: recipientAddress,
                },
            });

            return true;
        } catch (error) {
            elizaLogger.error("Error in MINA transfer:", error);
            callback?.({
                text: "Failed to complete MINA transfer.",
                content: {
                    error:
                        error instanceof Error ? error.message : String(error),
                },
            });
            return false;
        }
    },
};

export default transfer;
