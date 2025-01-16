// packages/plugin-mina/src/providers/wallet.ts
import {
    IAgentRuntime,
    ICacheManager,
    Memory,
    Provider,
    State,
    elizaLogger,
} from "@elizaos/core";
import { Mina, PublicKey, PrivateKey } from "o1js";
import NodeCache from "node-cache";
import * as path from "path";

interface WalletPortfolio {
    totalUsd: string;
    totalMina: string;
}

export interface IWalletProvider {
    get: (
        runtime: IAgentRuntime,
        memory: Memory,
        state: State
    ) => Promise<string | null>;
    formatPortfolio: (portfolio: WalletPortfolio) => string;
}

export class WalletProvider implements IWalletProvider {
    private readonly cache: NodeCache;
    private readonly cacheKey: string = "mina/wallet";
    private readonly publicKey: PublicKey;

    constructor(
        private readonly privateKey: PrivateKey,
        private readonly cacheManager: ICacheManager
    ) {
        this.cache = new NodeCache({ stdTTL: 300 }); // 5 min cache
        this.publicKey = privateKey.toPublicKey();
    }

    async fetchPortfolioValue(): Promise<WalletPortfolio> {
        const cacheKey = `portfolio_${this.publicKey.toBase58()}`;
        const cached = await this.getCachedData<WalletPortfolio>(cacheKey);
        if (cached) return cached;

        const balance = await this.getBalance();
        const price = await this.getMinaPrice();

        const totalMina = Number(balance) / 1e9; // Convert from nanomina
        const totalUsd = (totalMina * price).toFixed(2);

        const portfolio = {
            totalUsd,
            totalMina: totalMina.toFixed(4),
        };

        await this.cacheManager.set(
            path.join(this.cacheKey, cacheKey),
            portfolio,
            { expires: 300 }
        );

        return portfolio;
    }

    private async getBalance(): Promise<string> {
        const account = await Mina.getAccount(this.publicKey);
        return account.balance.toString();
    }

    private async getMinaPrice(): Promise<number> {
        try {
            const response = await fetch(
                "https://api.coingecko.com/api/v3/simple/price?ids=mina-protocol&vs_currencies=usd"
            );
            const data = await response.json();
            return data["mina-protocol"].usd;
        } catch (error) {
            elizaLogger.error("Error fetching MINA price:", error);
            return 0;
        }
    }

    formatPortfolio(portfolio: WalletPortfolio): string {
        return `Portfolio: ${portfolio.totalMina} MINA ($${portfolio.totalUsd})`;
    }

    private async getCachedData<T>(key: string): Promise<T | null> {
        const cachedData = this.cache.get<T>(key);
        if (cachedData) return cachedData;

        const fileCachedData = await this.cacheManager.get<T>(
            path.join(this.cacheKey, key)
        );
        if (fileCachedData) {
            this.cache.set(key, fileCachedData);
            return fileCachedData;
        }
        return null;
    }

    async get(
        runtime: IAgentRuntime,
        memory: Memory,
        state: State
    ): Promise<string | null> {
        try {
            const rpcUrl = runtime.getSetting("MINA_RPC_URL");
            const privateKeyBase58 = runtime.getSetting("MINA_PRIVATE_KEY");

            if (!rpcUrl) throw new Error("MINA_RPC_URL not set");
            const Berkeley = Mina.Network({ mina: rpcUrl });
            Mina.setActiveInstance(Berkeley);

            if (!privateKeyBase58) throw new Error("MINA_PRIVATE_KEY not set");
            const privateKey = PrivateKey.fromBase58(privateKeyBase58);

            const provider = new WalletProvider(
                privateKey,
                runtime.cacheManager
            );

            const portfolio = await provider.fetchPortfolioValue();
            return provider.formatPortfolio(portfolio);
        } catch (error) {
            elizaLogger.error("Error in wallet provider:", error);
            return null;
        }
    }
}

export const walletProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<string | null> => {
        try {
            const rpcUrl = runtime.getSetting("MINA_RPC_URL");
            const privateKeyBase58 = runtime.getSetting("MINA_PRIVATE_KEY");

            if (!rpcUrl) throw new Error("MINA_RPC_URL not set");
            const Berkeley = Mina.Network({ mina: rpcUrl });
            Mina.setActiveInstance(Berkeley);

            if (!privateKeyBase58) throw new Error("MINA_PRIVATE_KEY not set");
            const privateKey = PrivateKey.fromBase58(privateKeyBase58);

            const provider = new WalletProvider(
                privateKey,
                runtime.cacheManager
            );
            const portfolio = await provider.fetchPortfolioValue();
            return provider.formatPortfolio(portfolio);
        } catch (error) {
            elizaLogger.error("Error in wallet provider:", error);
            return null;
        }
    },
};
