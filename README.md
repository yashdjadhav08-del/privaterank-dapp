# PrivateRank — Privacy-Preserving Gaming Tournament Platform on Midnight Network

> **"Prove your gaming eligibility. Keep your identity private."**

PrivateRank is a Web3 gaming tournament platform built strictly for the **Midnight Preprod Testnet** powered by **1AM Wallet** authentication. It separates public/shareable competitive credentials (Rank, Score, Wins, Losses) from private personal identity (Real Name, Email, Phone, Country, Date of Birth), enabling tournament organizers to verify eligibility using Zero-Knowledge proofs without exposing players' personal data.

---

## 1. Quick Start with Docker (Recommended)

PrivateRank is fully Dockerized for production-grade reliability and reproducible deployment.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (Docker Desktop or Docker Engine >= 20.x)
- [Docker Compose](https://docs.docker.com/compose/)
- [1AM Wallet Browser Extension](https://chromewebstore.google.com/detail/1am-wallet) installed in your browser

### 1. Configure Environment
Copy the `.env.example` template:
```bash
cp .env.example .env
```

### 2. Build and Start the Application
```bash
docker compose up --build
```

### 3. Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Stop the Container
```bash
docker compose down
```

---

## 2. Docker & Wallet Architecture

Docker packages and serves the production frontend. The wallet connection and cryptographic signing are executed directly by the user's browser extension connecting to the **Midnight Preprod Testnet**.

```text
+-------------------------------------------------------------+
|                     USER BROWSER                            |
|                                                             |
|   1. Opens http://localhost:3000                            |
|      (Served from Docker Nginx container)                   |
|                                                             |
|   2. Interacts with 1AM Wallet Extension                    |
|      (window.midnight['1am'])                               |
|                                                             |
|   3. Verifies Preprod Testnet Network                       |
|                                                             |
|   4. Signs Authentication Challenge via 1AM                 |
|                                                             |
|   5. Computes Zero-Knowledge Proofs Client-Side             |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                MIDNIGHT PREPROD TESTNET                     |
|                                                             |
|   - RPC: https://rpc.preprod.midnight.network               |
|   - Indexer: https://indexer.preprod.midnight.network/graphql|
|   - Smart Contract: contracts/privaterank.compact           |
+-------------------------------------------------------------+
```

---

## 3. Environment Variables & Network Configuration

PrivateRank supports **Midnight Preprod Testnet ONLY**. Other networks (Mainnet, Devnet, Ethereum, Polygon, Sepolia, etc.) are strictly excluded.

| Variable | Description | Default / Preprod Value |
| :--- | :--- | :--- |
| `VITE_NETWORK` | Target blockchain network (**PREPROD ONLY**) | `preprod` |
| `VITE_PREPROD_RPC_URL` | Midnight Preprod RPC endpoint | `https://rpc.preprod.midnight.network` |
| `VITE_PREPROD_INDEXER_URL` | Midnight Preprod Indexer GraphQL | `https://indexer.preprod.midnight.network/api/v1/graphql` |
| `VITE_PREPROD_PROOF_SERVER_URL` | Midnight Proof Server URL | `http://127.0.0.1:6300` |
| `VITE_PREPROD_CONTRACT_ADDRESS` | Preprod Smart Contract Address | `0200preprod_privaterank_midnight_contract_v1` |
| `PORT` | Local host port mapped to container | `3000` |

---

## 4. Wallet Network Validation

When connecting via **1AM Wallet**:
1. PrivateRank detects the wallet's active network.
2. If the wallet is on **Midnight Preprod Testnet** (`preprod`), authentication proceeds normally.
3. If the wallet is on any other network, the **Wrong Network** modal is displayed:
   ```text
   Wrong Network

   Please switch your wallet to Midnight Preprod Testnet.

   [Switch to Preprod]
   ```
4. Clicking **[Switch to Preprod]** triggers programmatic network switching via the 1AM Wallet provider.

---

## 5. Local Development (Without Docker)

If you prefer running directly on your host machine:

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Steps
```bash
# 1. Install dependencies
npm install

# 2. Run unit & integration tests
npm test

# 3. Start local development server
npm run dev

# 4. Build production bundle
npm run build
```

---

## 6. Zero-Knowledge Circuit (`contracts/privaterank.compact`)

The Midnight Compact contract specifies:
- **Ledgers**: `authorizedOrganizers`, `tournaments`, `applications`, `proofCommitments`.
- **Witnesses**: `getPlayerSecretSalt()`, `getPlayerRank()`, `getPlayerScore()`, `getPlayerWins()`, `getPlayerIdentityHash()`.
- **Circuits**:
  - `registerOrganizer(organizer: Address)`
  - `createTournament(tournamentId, minRank, minScore, minWins, deadline)`
  - `publishTournament(tournamentId)`
  - `closeTournament(tournamentId)`
  - `proveAndSubmitApplication(tournamentId, anonymousPlayerId)`
  - `reviewApplication(appId, decision, reasonHash)`

---

## 7. Verification & Compliance Checklist

- [x] **Real Wallet Connection**: Powered by 1AM Wallet extension (`window.midnight['1am']`).
- [x] **Real Wallet Address**: Derived directly from the connected account.
- [x] **Real Wallet Signing**: Cryptographic challenge sign payload `{ data, options: { encoding: 'text' } }`.
- [x] **Midnight Preprod Testnet ONLY**: No exposure of other networks or multi-chain selectors.
- [x] **Wrong Network Modal & Switching**: Programmatic switch action with real wallet integration.
- [x] **Dockerized Production Setup**: Multi-stage `Dockerfile` and `docker-compose.yml`.
- [x] **No Blank Screen**: Protected by React Error Boundaries.
