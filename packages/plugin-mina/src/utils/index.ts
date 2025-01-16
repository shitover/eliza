// packages/plugin-mina/src/utils/index.ts
import { IAgentRuntime } from "@elizaos/core";
import { Mina, PrivateKey } from "o1js";

export const initializeMina = (runtime: IAgentRuntime) => {
    const rpcUrl = runtime.getSetting("MINA_RPC_URL");
    if (!rpcUrl) throw new Error("MINA_RPC_URL not set");
    const Berkeley = Mina.Network({ mina: rpcUrl });
    Mina.setActiveInstance(Berkeley);
    const privateKey = runtime.getSetting("MINA_PRIVATE_KEY");
    if (!privateKey) throw new Error("MINA_PRIVATE_KEY not set");
    return PrivateKey.fromBase58(privateKey);
};
