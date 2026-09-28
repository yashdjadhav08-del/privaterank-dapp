# 🎮 PrivateRank
Privacy-Preserving Gaming Tournaments on Midnight

> **Prove your eligibility. Protect your identity. Compete with confidence.**

PrivateRank is a privacy-preserving gaming tournament platform built on the **Midnight Network**. Organizers can create tournaments and players can prove eligibility using privacy-preserving verification.

---

## 🔗 Level 4 Submission Links

| Resource | Link / Identifier | Notes |
|---|---|---|
| 🚀 Live MVP | https://privaterank-dapp.vercel.app | Deployed on Vercel, Midnight Preprod |
| 📦 GitHub Repository | https://github.com/yashdjadhav08-del/privaterank-dapp | PrivateRank source repository |
| ⛓️ Compact Smart Contract | [Midnight Preprod Explorer](https://explorer.preprod.midnight.network/) | Deployed Compact smart contract on Midnight Preprod |
| 🌐 Midnight Preprod Contract | `ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde` | Preprod contract address |
| 🌐 Network | Midnight Preprod | Testnet |
| 👛 Wallet | 1AM Wallet | Required browser extension wallet |
| 🎥 Demo Video | [Google Drive Demo](https://drive.google.com/file/d/1WYbwtTiXKXnegVbqsOzEVOzMJECtxSoA/view?usp=sharing) | Full platform & ZK verification walkthrough |
| 🐦 X / Social Profile | [X Announcement Post](https://x.com/Yashjadhav38791/status/2104624216058564972) | Project announcement post on X |
| 📋 Project Proposal | [`PROPOSAL.md`](PROPOSAL.md) | Level 4 project proposal & specification |
| 📖 Usage Guide | [docs/USAGE.md](https://github.com/yashdjadhav08-del/privaterank-dapp/blob/main/USAGE.md) | Step-by-step player & organizer walkthrough |
| ⚙️ CI Workflow | [.github/workflows/ci.yml](https://github.com/yashdjadhav08-del/privaterank-dapp/blob/main/.github/workflows/ci.yml) | Continuous integration workflow |

---

## ✨ What is PrivateRank?

PrivateRank is a decentralized tournament platform designed for competitive gaming.

Organizers can create **Solo and Team tournaments** with rules such as:

- Minimum Rank
- Minimum Score
- Minimum Wins
- Team Size
- Maximum Teams
- Registration Period
- Tournament Schedule
- Prize Pool

Players can discover tournaments and prove that they satisfy the required conditions.

> **Verify that a player qualifies without unnecessarily exposing who the player is.**

---

## 🎯 The Problem

Competitive tournaments often require players to share gaming credentials and personal information to prove eligibility.

This creates problems:

1. **Unnecessary identity disclosure**
2. **Centralized verification**
3. **Public blockchain exposure**
4. **All-or-nothing credential sharing**

PrivateRank addresses these problems through privacy-preserving verification on Midnight.

---

## 💡 The Solution

PrivateRank uses Midnight's privacy-preserving architecture and Compact smart contracts to separate **eligibility verification** from unnecessary personal disclosure.

Example:

```text
Minimum Rank  = Platinum
Minimum Score = 2000
Minimum Wins  = 10
```

A player can prove that the requirements are satisfied without unnecessarily exposing unrelated personal information.

---

## 🏗️ Architecture

```text
+------------------------------------------------------+
|                    PLAYER / ORGANIZER                |
|                                                      |
|        React + TypeScript + Tailwind CSS             |
+--------------------------+---------------------------+
                           |
                           v
                    +-------------+
                    | 1AM Wallet  |
                    +-------------+
                           |
                           v
              +---------------------------+
              | Midnight Compact Contract |
              |                           |
              | createTournament()        |
              | joinTournament()          |
              | closeTournament()         |
              | archiveTournament()       |
              +-------------+-------------+
                            |
                            v
                  Midnight Preprod
                            |
                            v
                  Preprod Indexer
                            |
                            v
                 Verified Tournament State
```

---

## 🔐 Privacy Model

### Private / Sensitive

- Personal identity information
- Private gaming credentials
- Player commitments
- Private verification inputs

### Public / Verifiable

- Tournament configuration
- Eligibility requirements
- Tournament status
- Participant state
- Transaction identifiers
- Block confirmation

The goal is to expose the information required for tournament verification without unnecessarily exposing unrelated private information.

---

## 🏆 Core Features

### 1. Tournament Creation

Organizers can create Solo and Team tournaments with game details, eligibility rules, schedules, locations, team limits, and prize pools.

### 2. Player Discovery

Players can browse tournaments and view game, format, eligibility, schedule, location, team requirements, and prize pool.

### 3. Privacy-Preserving Eligibility

Players can prove conditions such as:

```text
Rank  >= Required Rank
Score >= Required Score
Wins  >= Required Wins
```

### 4. Real On-Chain Participation

Player participation uses the real:

```text
joinTournament()
```

Compact circuit through 1AM Wallet and Midnight Preprod.

### 5. Solo & Team Support

Team tournaments can enforce team size, maximum teams, team capacity, duplicate participation prevention, and eligibility requirements.

### 6. Tournament Lifecycle

```text
Create
  ↓
Open
  ↓
Close
  ↓
Archive
```

Archived tournaments remain on-chain but can be removed from active player listings.

---

## ⛓️ Real Blockchain Transactions

PrivateRank is designed around real Midnight Preprod transactions.

```text
Prepare Transaction
        ↓
1AM Wallet Approval
        ↓
Broadcast
        ↓
Pending
        ↓
Block Inclusion
        ↓
Indexer Verification
        ↓
Confirmed
```

### Deployment & Contract Explorer

- **Midnight Preprod Explorer:** [https://explorer.preprod.midnight.network/](https://explorer.preprod.midnight.network/)
- **Contract Address:** `ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde`

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Blockchain | Midnight |
| Smart Contracts | Compact |
| Network | Midnight Preprod |
| Wallet | 1AM Wallet |
| Frontend | React.js + TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js |
| Proof Infrastructure | Midnight Proof Server |
| Blockchain Verification | Midnight Preprod Indexer |
| Containerization | Docker |
| Development | Git / GitHub |

---

## 👤 User Flow

### Organizer

```text
Connect 1AM Wallet
        ↓
Select Organizer
        ↓
Organizer Dashboard
        ↓
Create Tournament
        ↓
1AM Wallet Approval
        ↓
Midnight Preprod
        ↓
Tournament Confirmed
```

### Player

```text
Connect 1AM Wallet
        ↓
Select Player
        ↓
Explore Tournaments
        ↓
View Eligibility
        ↓
Join Tournament
        ↓
Privacy-Preserving Verification
        ↓
1AM Wallet Approval
        ↓
Midnight Preprod
        ↓
Block + Indexer Verification
        ↓
Joined
```

---

## 🧪 Development

### Prerequisites

- Node.js
- npm
- 1AM Wallet
- Midnight Preprod access
- Docker
- Midnight Proof Server

### Installation

```bash
git clone https://github.com/yashdjadhav08-del/privaterank-dapp
cd privaterank-dapp
npm install
```

### Environment

```env
MIDNIGHT_NETWORK_ID=preprod
INDEXER_URI=https://indexer.preprod.midnight.network/api/v4/graphql
NODE_URI=https://rpc.preprod.midnight.network
PROOF_SERVER_URI=http://127.0.0.1:6302
CONTRACT_ADDRESS=ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde
```

### Commands

```bash
npm run dev
npm test
npm run build
```

---

## 📁 Project Structure

```text
PrivateRank/
├── contracts/
│   └── privaterank.compact
├── src/
│   ├── components/
│   ├── contracts/
│   ├── hooks/
│   ├── services/
│   └── pages/
├── tests/
├── public/
├── docs/
├── PROPOSAL.md
├── README.md
├── package.json
└── .github/
    └── workflows/
```

---

## 🔒 Security & Privacy Notes

- PrivateRank is a technical demonstration for the **Midnight Builder Challenge Level 4**.
- The application targets **Midnight Preprod Testnet**.
- Never commit wallet seed phrases, private keys, or secret credentials.
- Testnet assets should not be treated as real-world funds.
- Transaction success should be based on real wallet and blockchain verification.
- Privacy-sensitive player information should not be unnecessarily exposed.

---

## 🚀 Future Roadmap

### Phase 1 — Level 4 MVP

- Real tournament creation
- Real player participation
- Privacy-preserving eligibility
- Solo and Team tournaments
- Organizer and Player portals
- 1AM Wallet integration
- Midnight Preprod deployment
- Docker infrastructure

### Phase 2 — Advanced Privacy

- Advanced gaming credential providers
- Team-level privacy proofs
- Private team formation
- Privacy-preserving reputation

### Phase 3 — Production Readiness

- Security audit
- Smart contract optimization
- Mainnet readiness
- Broader ecosystem integrations

---

## 📝 Project Information

**Project Name:** PrivateRank

**Track:** Midnight Builder Challenge — Level 4 (Gaming / Consumer Focus)

**Challenge:** Midnight Builder Challenge — Level 4

**GitHub:** https://github.com/yashdjadhav08-del/privaterank-dapp

**Demo Video:** https://drive.google.com/file/d/1WYbwtTiXKXnegVbqsOzEVOzMJECtxSoA/view?usp=sharing

**X / Social:** https://x.com/Yashjadhav38791/status/2104624216058564972

**Contract Address:** ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde

**Compact Smart Contract:**  
https://explorer.preprod.midnight.network/

**Live Application:**  
https://privaterank-dapp.vercel.app

---

## 🌙 Built with Midnight

PrivateRank explores how privacy-preserving blockchain technology can make competitive gaming **verifiable without making unnecessary personal information public**.

> **PrivateRank — Prove your eligibility. Protect your identity. Compete with confidence.**
