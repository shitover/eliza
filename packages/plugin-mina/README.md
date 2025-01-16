# @elizaos/plugin-mina

Mina Protocol integration plugin for Eliza OS that enables token transfers and wallet management.

## Overview

This plugin integrates Mina Protocol functionalities into the Eliza ecosystem, allowing seamless interactions with the Mina blockchain. It provides actions for transferring MINA tokens and providers for wallet information.

## Features

- **Transfer MINA Tokens**: Enable the transfer of MINA tokens between wallets.
- **Wallet Provider**: Retrieve wallet address and balance information.

## Installation
bash

npm install @elizaos/plugin-mina


## Configuration

Ensure the following environment variables are set:

- `MINA_RPC_URL`: URL of the Mina RPC endpoint.
- `MINA_PRIVATE_KEY`: Private key of the Mina wallet.

## Usage

### Transfer MINA Tokens

typescript
import { TransferMinaToken } from "@elizaos/plugin-mina";
const transferAction = TransferMinaToken.handler(runtime, memory, state);



## Resources

- [Mina Protocol Documentation](https://docs.minaprotocol.com/)
- [Mina Developer Portal](https://minaprotocol.com/developers)
- [Mina GitHub Repository](https://github.com/MinaProtocol/mina)

## License

This plugin is part of the Eliza project. See the main project repository for license information.