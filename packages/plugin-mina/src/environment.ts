// packages/plugin-mina/src/environment.ts
import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";
import { Mina, PrivateKey, PublicKey } from "o1js";

// Schema for environment validation
export const minaEnvSchema = z.object({
    MINA_NETWORK: z.enum(['mainnet', 'testnet', 'devnet']).default('mainnet'),
    MINA_RPC_URL: z.string().url("Invalid Mina RPC URL"),
    MINA_PUBLIC_KEY: z.string().optional(),
    MINA_PRIVATE_KEY: z
        .string()
        .min(1, "Mina private key is required")
        .refine((key) => {
            try {
                PrivateKey.fromBase58(key);
                return true;
            } catch {
                return false;
            }
        }, "Invalid Mina private key format"),
});

export type MinaConfig = z.infer<typeof minaEnvSchema>;

export class MinaEnvironment {
    static validate(runtime: IAgentRuntime): MinaConfig {
        const env = {
            MINA_RPC_URL: runtime.getSetting("MINA_RPC_URL"),
            MINA_PRIVATE_KEY: runtime.getSetting("MINA_PRIVATE_KEY"),
        };

        const parsed = minaEnvSchema.safeParse(env);
        if (!parsed.success) {
            const errorMessages = parsed.error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Mina configuration validation failed:\n${errorMessages}`
            );
        }

        // Initialize Mina network after validation
        try {
            const Berkeley = Mina.Network(parsed.data.MINA_RPC_URL);
            Mina.setActiveInstance(Berkeley);
        } catch (error) {
            throw new Error(
                `Failed to initialize Mina network: ${error instanceof Error ? error.message : String(error)}`
            );
        }

        return parsed.data;
    }

    static getPublicKey(privateKeyBase58: string): PublicKey {
        try {
            const privateKey = PrivateKey.fromBase58(privateKeyBase58);
            return privateKey.toPublicKey();
        } catch (error) {
            throw new Error(
                `Failed to derive public key: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}
