# Project Proposal: PrivateRank

**Decentralized, Privacy-Preserving Esports & Gaming Tournament Platform**  
*Built for the Midnight Network (Preprod Testnet) & Powered by 1AM Wallet*

---

## 1. Executive Summary

**PrivateRank** is a decentralized, privacy-preserving gaming tournament platform built natively for the **Midnight Preprod Testnet**. 

In the competitive gaming and esports landscape, players are consistently forced to sacrifice their personal privacy—exposing real names, phone numbers, emails, government identities, and geographic locations—just to prove their gaming credentials, rank tier, or tournament eligibility. Conversely, tournament organizers face pervasive challenges with smurfing, forged game ranks, and manual verification overhead.

PrivateRank solves this dilemma by leveraging **Midnight Network's Zero-Knowledge (ZK) smart contracts (Minokawa/Compact)** and **1AM Wallet**. Players can cryptographically prove their in-game rank, win counts, and skill tier using client-side ZK-SNARKs without revealing any personally identifiable information (PII). Tournament organizers can seamlessly create tournaments, configure cryptographic eligibility criteria, and verify proofs on-chain with mathematical certainty.

---

## 2. Problem Statement

### 2.1. The Gamer's Dilemma: Doxxing vs. Participation
- **Identity Exposure**: Traditional tournament registrations require players to submit Discord IDs, Steam/Riot account credentials, phone numbers, real names, and government IDs to prevent smurfing.
- **Data Breaches & Stalking**: Centralized tournament platforms store unencrypted player databases, exposing gamers to doxxing, harassment, and identity theft.
- **Lack of Sovereign Identity**: Gamers do not own their competitive credentials across fragmented tournament ecosystems.

### 2.2. The Organizer's Dilemma: Verification vs. Scalability
- **Smurfing & Account Sharing**: Unverified players enter low-tier brackets or borrow high-rank accounts to bypass eligibility.
- **Manual Verification Overhead**: Organizers manually inspect screenshots, tracker websites, and ID documents—a slow, error-prone, and unscalable process.
- **Regulatory Compliance (GDPR/CCPA)**: Storing sensitive user data increases legal liability and compliance costs for grassroots and enterprise organizers alike.

---

## 3. The PrivateRank Solution

PrivateRank introduces a dual-layer architectural model that separates **Public Competitive Credentials** from **Private Personal Identity**:

```text
+-------------------------------------------------------------------------+
|                               PRIVATERANK                               |
+-------------------------------------------------------------------------+
|                                                                         |
|   PRIVATE DATA (Never Leaves Player's Device)                            |
|   - Real Name, Email, Phone, Country, Date of Birth                      |
|   - Private Witness Salt & Identity Secret Hash                          |
|                                                                         |
|                                    │                                    |
|                                    ▼                                    |
|                       [ Midnight ZK-Circuit ]                           |
|                  assert(rank >= minRank && score >= minScore)           |
|                                    │                                    |
|                                    ▼                                    |
|   PUBLIC ON-CHAIN DATA (Midnight Preprod Ledger)                        |
|   - Anonymous Player ID (e.g., PR-7F2A-9C1D)                            |
|   - Zero-Knowledge Eligibility Proof Commitment                          |
|   - Verified Rank Tier & Tournament Application Status                  |
|                                                                         |
+-------------------------------------------------------------------------+
```

1. **Zero-Knowledge Eligibility Proofs**: Players run client-side ZK circuits proving `rank >= minRank` and `wins >= minWins` without disclosing raw identity.
2. **Native 1AM Wallet Integration**: Seamless, cryptographically signed authentication and on-chain state updates directly on Midnight Preprod.
3. **Strict Role Separation**: Cryptographically separates **ORGANIZER** and **PLAYER** roles, eliminating privilege escalation and conflicts of interest.
4. **Comprehensive Tournament Modes**: Full support for both **Solo** individual tournaments and **Team** roster tournaments with automated team size & capacity calculations.

---

## 4. Key Features & Innovations

### 4.1. Privacy-Preserving Gaming Credentials
- Players manage an editable sovereign gaming profile with verifiable credentials (Rank, Score, Matches Played, Wins, Losses, Preferred Categories).
- PII is never transmitted to the blockchain or centralized servers; only cryptographic commitments and blinded proofs are published.

### 4.2. Dual Tournament System (Solo & Team)
- **Solo Tournaments**: Direct player registration with automated ZK eligibility verification.
- **Team Tournaments**: 
  - Dynamic team creation with customizable roster sizes ($2\text{v}2, 3\text{v}3, 4\text{v}4, 5\text{v}5$).
  - Max capacity formula: $\text{Max Teams} = \lfloor \text{Max Players} / \text{Team Size} \rfloor$.
  - Captain and member management with team-wide eligibility verification.

### 4.3. Strict Role Separation Architecture
To ensure fair play and prevent tournament manipulation:
- **Organizer Wallets**: Can create tournaments, manage brackets, review applications, and verify proofs. Cannot register as players, join teams, or compete in tournaments.
- **Player Wallets**: Can browse tournaments, generate ZK proofs, apply to tournaments, and form teams. Cannot access organizer portals or approve applications.
- Role enforcement is locked at the smart contract, prover, transaction, and route layers with zero UI toggles.

### 4.4. 1AM Wallet & Midnight Preprod Transaction Lifecycle
Every core action on PrivateRank triggers an authentic on-chain transaction signed by the user's 1AM Wallet:
1. `CREATE_TOURNAMENT`: Organizer signs and deploys tournament parameters to Midnight Preprod.
2. `CREATE_TEAM` / `JOIN_TEAM`: Captains and players sign team roster state updates.
3. `SUBMIT_APPLICATION`: Players generate ZK proofs and sign eligibility submissions.
4. `REVIEW_APPLICATION`: Organizers sign approval/rejection decisions with cryptographic reason hashes.

---

## 5. Technical Architecture

### 5.1. System Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                              │
│                                                                        │
│   ┌────────────────────────┐         ┌─────────────────────────────┐   │
│   │   React 18 + Vite UI   │ <-----> │      1AM Wallet Provider    │   │
│   │  (Portals, Forms, ZK)  │         │   (window.midnight['1am'])  │   │
│   └───────────┬────────────┘         └──────────────┬──────────────┘   │
│               │                                     │                  │
│               ▼                                     ▼                  │
│   ┌────────────────────────┐         ┌─────────────────────────────┐   │
│   │  Local ZK-Prover Engine│         │   Auth & Signing Service    │   │
│   │   (Compact Witnesses)  │         │    (Challenge Signature)    │   │
│   └───────────┬────────────┘         └──────────────┬──────────────┘   │
└───────────────┼─────────────────────────────────────┼──────────────────┘
                │                                     │
                ▼                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        MIDNIGHT PREPROD TESTNET                        │
│                                                                        │
│   - RPC Endpoint: https://rpc.preprod.midnight.network                 │
│   - Indexer API: https://indexer.preprod.midnight.network/graphql      │
│   - Smart Contract: contracts/privaterank.compact                      │
│   - Ledgers: authorizedOrganizers, tournaments, applications, proofs   │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.2. Tech Stack Specification

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Blockchain** | Midnight Preprod Testnet | Privacy-first Layer-1 for zero-knowledge smart contracts |
| **Smart Contract** | Compact (Minokawa) | Declarative ZK state transitions, circuits, and ledgers |
| **Wallet** | 1AM Wallet Browser Extension | Cryptographic signing, unshielded/shielded identity |
| **Frontend** | React 18, TypeScript, Vite | High-performance, responsive dark-mode cyber UI |
| **ZK Prover** | Client-side ZK-SNARK Engine | Witness generation, constraint evaluation, proof commitments |
| **Deployment** | Docker & Docker Compose | Multi-stage production containerization with Nginx |
| **Testing** | Vitest, React Testing Library | 8 comprehensive test suites with 45+ integration tests |

---

## 6. Smart Contract Architecture (`contracts/privaterank.compact`)

The smart contract is written in Midnight's **Compact** domain-specific language:

```compact
// State Ledgers on Midnight Public Ledger
export ledger authorizedOrganizers: Map<Address, Boolean>;
export ledger tournaments: Map<Bytes<32>, Tournament>;
export ledger applications: Map<Bytes<32>, Application>;
export ledger proofCommitments: Map<Bytes<32>, Boolean>;

// Private Witnesses (Supplied off-chain by player)
witness getPlayerSecretSalt(): Bytes<32>;
witness getPlayerRank(): Uint<8>;
witness getPlayerScore(): Uint<32>;
witness getPlayerWins(): Uint<32>;
witness getPlayerIdentityHash(): Bytes<32>;

// Circuits
export circuit registerOrganizer(organizer: Address): []
export circuit createTournament(tournamentId, minRank, minScore, minWins, deadline): []
export circuit publishTournament(tournamentId): []
export circuit closeTournament(tournamentId): []
export circuit proveAndSubmitApplication(tournamentId, anonymousPlayerId): Bytes<32>
export circuit reviewApplication(appId, decision, reasonHash): []
```

---

## 7. Security & Privacy Model

1. **Zero Data Leakage**: Player personal records (real name, phone, email) never leave the local browser environment.
2. **Deterministic Commitments**: Applications produce unique cryptographic commitments preventing double-entry smurfing while keeping player identity blinded.
3. **Preprod Network Validation**: Automated network detection rejects foreign or test networks, enforcing connection to Midnight Preprod only.
4. **Anti-Sybil Role Locking**: Addresses registered as Organizers are cryptographically barred from acting as Players, preventing tournament tampering.

---

## 8. Target Audience & Market Opportunity

- **Competitive Gamers & Esports Teams**: Players who want to compete in verified online tournaments without being doxxed or sharing personal contact details.
- **Esports Tournament Organizers**: Communities, collegiate esports leagues, DAOs, and gaming guilds seeking frictionless, automated rank verification without GDPR compliance liabilities.
- **Web3 Gaming Ecosystems**: Game studios and gaming ecosystems looking for decentralized identity and privacy-preserving competitive ranking standards.

---

## 9. Project Roadmap

### Phase 1: MVP & Challenge Delivery (Completed ✅)
- [x] Full Midnight Preprod Testnet & 1AM Wallet integration.
- [x] Compact smart contract design with ZK eligibility circuits.
- [x] Solo & Team tournament lifecycle (Draft, Open, Closed).
- [x] Sovereign player profile & verifiable gaming credentials.
- [x] Strict Organizer vs. Player role-based access control.
- [x] Dockerized deployment & 45-test automated verification suite.

### Phase 2: Enhanced Midnight Features & Cross-Game Oracles (Q1 2027)
- [ ] Integration with Midnight Native Proof Server microservice for hardware-accelerated ZK proving.
- [ ] Decentralized gaming oracles (Steam API, Riot API, Epic Games) with TLSNotary ZK proofs for automated rank extraction.
- [ ] Automated smart contract prize pool escrow in Midnight DUST and native tokens.

### Phase 3: Ecosystem Expansion & Mainnet Launch (Q2-Q3 2027)
- [ ] On-chain bracket generation (Single Elimination, Double Elimination, Swiss Round-Robin).
- [ ] DAO governance for decentralized community organizer allowlisting.
- [ ] Midnight Mainnet deployment.

---

## 10. Conclusion

**PrivateRank** demonstrates the true potential of **Midnight Network's zero-knowledge technology**: bringing verifiable trust, privacy, and sovereignty to the billion-dollar esports and competitive gaming industry. By eliminating the forced tradeoff between privacy and verification, PrivateRank empowers gamers to prove their skill while keeping their identity protected.

---

*Repository*: [https://github.com/yashdjadhav08-del/privaterank-dapp](https://github.com/yashdjadhav08-del/privaterank-dapp)  
*Network*: Midnight Preprod Testnet  
*Wallet*: 1AM Wallet
