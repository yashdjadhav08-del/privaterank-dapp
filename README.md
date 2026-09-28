# PrivateRank — Privacy-Preserving Gaming Tournament Platform on Midnight Network

> **"Prove your gaming eligibility. Keep your identity private."**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyashdjadhav08-del%2Fprivaterank-dapp)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Deployment-black?style=flat&logo=vercel)](https://privaterank-dapp.vercel.app)
[![Midnight Network](https://img.shields.io/badge/Midnight-Preprod%20Testnet-00ffcc?style=flat)](https://rpc.preprod.midnight.network)

🌐 **Live Vercel Application**: [https://privaterank-dapp.vercel.app](https://privaterank-dapp.vercel.app)

PrivateRank is a Web3 gaming tournament platform built strictly for the **Midnight Preprod Testnet** powered by **1AM Wallet** authentication. It separates public/shareable competitive credentials (Rank, Score, Wins, Losses) from private personal identity (Real Name, Email, Phone, Country, Date of Birth), enabling tournament organizers to verify eligibility using Zero-Knowledge proofs without exposing players' personal data.

---

## 🏆 Level 4 Submission Links

| Deliverable | Details / Link |
| :--- | :--- |
| 🌐 **Live Web Application (Vercel)** | [https://privaterank-dapp.vercel.app](https://privaterank-dapp.vercel.app) |
| ⛓️ **Compact Smart Contract** | [1AM Preprod Contract Explorer](https://explorer.1am.xyz/contract/ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde) |
| 🎥 **Demo Video** | [Google Drive Demo](https://drive.google.com/file/d/1WYbwtTiXKXnegVbqsOzEVOzMJECtxSoA/view?usp=sharing) |
| 🐦 **X / Social Profile** | Not provided — add your X / social profile here if available |
| 💻 **Source Code Repository** | [https://github.com/yashdjadhav08-del/privaterank-dapp](https://github.com/yashdjadhav08-del/privaterank-dapp) |
| 📄 **Project Proposal (Level 3)** | [PROPOSAL.md](PROPOSAL.md) |
| 📖 **Platform Usage Guide** | [docs/USAGE.md](docs/USAGE.md) |

---

## 📝 Project Information

- **Project**: PrivateRank — Privacy-Preserving Gaming Tournament Platform
- **Track**: Midnight Builder Challenge — Level 4 (Gaming & Privacy)
- **Target Network**: Midnight Preprod Testnet (1AM Wallet)
- **GitHub**: [https://github.com/yashdjadhav08-del/privaterank-dapp](https://github.com/yashdjadhav08-del/privaterank-dapp)
- **Deployment Transaction**: [https://explorer.1am.xyz/contract/ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde](https://explorer.1am.xyz/contract/ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde)
- **Canonical Contract Address**: `ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde`

---

## Live Vercel Deployment

PrivateRank is pre-configured for instant zero-configuration deployment on [Vercel](https://vercel.com) using [`vercel.json`](file:///d:/level%204/vercel.json) with full Vite Single Page Application (SPA) rewrites and optimized WebAssembly (`.wasm`) MIME headers for the Midnight Ledger cryptographic library.

- **Production Live URL**: [https://privaterank-dapp.vercel.app](https://privaterank-dapp.vercel.app)
- **1-Click Import & Deploy**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyashdjadhav08-del%2Fprivaterank-dapp)

### Deploying via Vercel Dashboard:
1. Go to [Vercel New Project](https://vercel.com/new).
2. Import the Git repository `yashdjadhav08-del/privaterank-dapp`.
3. The framework preset is automatically detected as **Vite** (Build Command: `npm run build`, Output Directory: `dist`).
4. Set the environment variables from `.env.example` in Vercel Project Settings:
   - `VITE_NETWORK` = `preprod`
   - `VITE_PREPROD_RPC_URL` = `https://rpc.preprod.midnight.network`
   - `VITE_PREPROD_INDEXER_URL` = `https://indexer.preprod.midnight.network/api/v1/graphql`
   - `VITE_PREPROD_PROOF_SERVER_URL` = `http://127.0.0.1:6300`
   - `VITE_PREPROD_CONTRACT_ADDRESS` = `ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde`
5. Click **Deploy**.

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
| `VITE_PREPROD_CONTRACT_ADDRESS` | Preprod Smart Contract Address | `ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde` |
| `VITE_SERVER_URL` | PrivateRank Backend API Server | `http://localhost:4000` |
| `PORT` | Local host port mapped to container | `3000` |

### Midnight Preprod Configuration (`.env`)
```bash
INDEXER_URI=https://indexer.preprod.midnight.network/api/v4/graphql
NODE_URI=https://rpc.preprod.midnight.network
PROOF_SERVER_URI=http://127.0.0.1:6302
CONTRACT_ADDRESS=ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde
```

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
# 1. Clone repository & install dependencies
git clone https://github.com/yashdjadhav08-del/privaterank-dapp
cd privaterank-dapp
npm install

# 2. Run unit & integration tests
npm test

# 3. Start local development server
npm run dev

# 4. Build production bundle
npm run build
```

---

## 6. Zero-Knowledge Circuits (`contracts/privaterank.compact`)

The Midnight Compact contract deployed on Midnight Preprod (`ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde`) defines:
- **Ledger State**: `tournaments` map maintaining tournament configurations, minimum rank/score/wins criteria, organizer identities, and lifecycle status (DRAFT = 0, OPEN = 1, CLOSED = 2, COMPLETED = 3, ARCHIVED = 4).
- **Witnesses**: Private player credentials and proof salt verified client-side via Midnight Proof Server.
- **On-Chain Circuits**:
  - `createTournament(tournamentId, organizer, minRank, minScore, minWins, deadline)`: Deploys a new tournament instance with entry criteria.
  - `joinTournament(tournamentId, playerKey, proof)`: Zero-Knowledge eligibility verification and on-chain participation registration.
  - `closeTournament(tournamentId, organizer)`: Closes active registrations and transitions tournament status to `CLOSED`.
  - `archiveTournament(tournamentId, organizer)`: Archives a completed or closed tournament, removing it from active discovery while preserving on-chain history.

---

---

## 7. CI/CD Pipeline

PrivateRank employs GitHub Actions for continuous integration and explicit continuous deployment targeting **Midnight Preprod Testnet**.

### Continuous Integration (CI)
The CI pipeline (`.github/workflows/ci.yml`) triggers automatically on:
- `push` to `main`, `master`, and `develop`
- `pull_request` to `main`, `master`, and `develop`

#### Automated Checks
Every push or PR must pass all stages in order:
1. **Dependency Installation**: `npm ci` (clean, frozen lockfile)
2. **TypeScript / Type Check**: `npm run typecheck` (`tsc --noEmit`)
3. **Lint**: `npm run lint` (`tsc --noEmit`)
4. **Frontend & Logic Tests**: `npm run test:frontend` (UI, components, state, ZK prover, access control)
5. **Contract Tests**: `npm run test:contract` (tournament lifecycle, team invariants, schedule rules, 1AM wallet mocking)
6. **Smart Contract Validation**: `npm run contract:check` (verifies compiled Compact bindings & type declarations)
7. **Production Build**: `npm run build` (`tsc && vite build`)

If any check fails, the pipeline immediately halts with `✗ CI FAILED`.

### Continuous Deployment (CD)
The deployment workflow (`.github/workflows/deploy.yml`) is **manually triggered** via `workflow_dispatch` and targets **Midnight Preprod Testnet ONLY**:

```text
GitHub Actions → Run workflow → Deploy to Midnight Preprod
   ↓
Verify Target Network is Preprod
   ↓
Run Contract Tests & Type Checks
   ↓
Verify Compact ZKIR Circuit Artifacts
   ↓
Verify Production Build
   ↓
Deploy to Midnight Preprod RPC
   ↓
Confirm Deployment Receipt
```

#### Mainnet Safety Guard
Automatic or manual deployment to **Midnight Mainnet is strictly disabled**. Any attempt to target `mainnet` triggers an immediate fatal security rejection:
```text
❌ FATAL SECURITY ERROR: Target network is set to "mainnet"!
PrivateRank enforces Midnight Preprod ONLY. Mainnet auto-deployment is disabled.
```

#### GitHub Secrets Configuration
Configure these repository secrets in GitHub (`Settings` → `Secrets and variables` → `Actions`):
- `MIDNIGHT_PREPROD_RPC`: Midnight Preprod RPC URL (e.g. `https://rpc.preprod.midnight.network`)
- `MIDNIGHT_PREPROD_INDEXER`: Midnight Preprod Indexer GraphQL URL
- `MIDNIGHT_PREPROD_PROOF_SERVER`: Midnight Proof Server URL (e.g. `http://127.0.0.1:6300`)
- `DEPLOYER_PRIVATE_KEY` / `DEPLOYER_SEED`: Private key or seed phrase for deployer account on Midnight Preprod (never logged or exposed in CI logs)

---

## 8. Verification & Compliance Checklist

- [x] **Real Wallet Connection**: Powered by 1AM Wallet extension (`window.midnight['1am']`).
- [x] **Real Wallet Address**: Derived directly from the connected account.
- [x] **Real Wallet Signing**: Cryptographic challenge sign payload `{ data, options: { encoding: 'text' } }`.
- [x] **Midnight Preprod Testnet ONLY**: No exposure of other networks or multi-chain selectors.
- [x] **Wrong Network Modal & Switching**: Programmatic switch action with real wallet integration.
- [x] **Dockerized Production Setup**: Multi-stage `Dockerfile` and `docker-compose.yml`.
- [x] **CI/CD Automation**: GitHub Actions CI (`ci.yml`) and manual Preprod CD (`deploy.yml`).
- [x] **No Blank Screen**: Protected by React Error Boundaries.
- [x] **Vercel Cloud Deployment**: Configured via `vercel.json` with SPA routing and WebAssembly MIME headers for Midnight Ledger SDK.

