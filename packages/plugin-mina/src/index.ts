import { Plugin } from "@elizaos/core";
import { Mina, PrivateKey, PublicKey } from "o1js";

// Import actions
import transferMina from "./actions/transfer.ts";

// Import providers
import { WalletProvider, walletProvider } from "./providers/wallet.ts";

// Import environment utilities
import { MinaEnvironment } from "./environment.ts";

// Export public utilities and types
export { WalletProvider };
export { MinaEnvironment };
export { transferMina as TransferMinaToken };
export type { TransferMinaParams, WalletInfo } from "./types/index.js";

// Initialize Mina Protocol plugin
export const minaPlugin: Plugin = {
    name: "mina",
    description:
        "Mina Protocol Plugin for Eliza - Enables zkApp interactions and MINA token operations",
    actions: [transferMina],
    evaluators: [], // Can be extended with custom evaluators for Mina-specific logic
    providers: [],
    services: [], // Can be extended with additional Mina services
    clients: [], // Can be extended with custom Mina clients
};

// Helper function to initialize Mina network connection
export const initializeMinaNetwork = (graphqlEndpoint: string) => {
    const network = Mina.Network({
        mina: graphqlEndpoint,
    });
    Mina.setActiveInstance(network);
};

// Helper function to create wallet from private key
export const createWalletFromPrivateKey = (
    privateKeyBase58: string
): {
    privateKey: PrivateKey;
    publicKey: PublicKey;
} => {
    const privateKey = PrivateKey.fromBase58(privateKeyBase58);
    const publicKey = privateKey.toPublicKey();
    return { privateKey, publicKey };
};

export default minaPlugin;
