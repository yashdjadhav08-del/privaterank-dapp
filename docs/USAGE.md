# How to Use PrivateRank

PrivateRank makes competitive esports tournaments private, verifiable, and merit-based using Midnight Network and Zero-Knowledge Proofs. This guide explains how to use the platform from the perspective of both a tournament **Organizer** and a competitive **Player**.

---

## What You Need

- **Modern Web Browser**: Google Chrome, Brave, or any Chromium-based browser.
- **1AM Wallet Extension**: Installed and configured for the **Midnight Preprod Testnet** (`preprod`).
- **Internet Connection**: To communicate with Midnight Preprod indexers, RPC nodes, and proof servers.
- **DUST Tokens**: For transaction fees on Midnight Preprod when deploying or joining tournaments (obtainable via the official Midnight faucet).

---

## Step-by-Step Guide

### 1. Connecting Your Wallet & Role Selection
1. Open the PrivateRank application at **[http://localhost:3001](http://localhost:3001)**.
2. Locate the **Connect 1AM Wallet** button in the navigation header.
3. Click **Connect 1AM Wallet**.
4. The **1AM Wallet** browser extension will open a prompt requesting connection authorization.
5. Once approved, select your primary role:
   - **Player**: Explore tournaments, prove gaming credentials via ZK proofs, and register anonymously.
   - **Organizer**: Create on-chain tournaments, configure entry criteria, review applications, and manage tournament lifecycles.
6. Your connection status will switch to **Connected**, displaying your network (`Midnight Preprod`) and your unshielded public address (`mn_addr_preprod1...`).

> **Note**: If your wallet is connected to a network other than Preprod, PrivateRank displays the **Wrong Network** modal with a one-click button to switch to Preprod.

---

### 2. Exploring Competitive Tournaments
1. Navigate to the **Explore Games** tab in the top navigation.
2. Browse active competitive tournament listings across top titles (e.g., BGMI, Valorant, Free Fire, Apex Legends).
3. Each tournament card displays:
   - **Tournament Name & Title**: Game banner, tournament category (Battle Royale, FPS, MOBA), and format (SOLO or TEAM).
   - **Prize Pool**: Guaranteed rewards displayed clearly in INR (`₹`).
   - **Entry Requirement**: Minimum Rank Tier badge (e.g., Gold, Platinum, Diamond, Master).
   - **Capacity & Roster**: Current registered participants or teams vs maximum slots.
   - **Status Badge**: Current lifecycle status (`OPEN`, `CLOSED`). Archived tournaments are automatically filtered out from active player discovery.
4. Use the category pills, rank dropdown filter, or search bar to find tournaments matching your tier.

---

### 3. Viewing Your Player Profile & Shielded Credentials
1. Click the **Profile** tab in the navigation.
2. This screen separates your competitive identity into two distinct privacy zones:
   - **Public Competitive Credentials**: Your verified in-game Rank Tier, Competitive Score, Match Wins, and Losses.
   - **Private Personal Identity**: Your Real Full Name, Email, Phone Number, Country, and Date of Birth.
3. Observe how PrivateRank protects your personal information:
   - Your gaming stats can be proven mathematically without revealing your personal identity.
   - Organizers only see your anonymous cryptographic identifier (`PR-XXXX-XXXX`), never your real name or contact details.

---

### 4. Generating an Eligibility ZK Proof
1. From the **Explore** page or **Tournament Details** page, select an active tournament.
2. Click **View Details** to inspect the rules and entry criteria.
3. When you click **Join Solo Tournament** or **Create Team**, PrivateRank initiates Zero-Knowledge proof generation:
   - The private witness reads your actual gaming credentials from your profile.
   - The Compact circuit establishes:
     $$\text{Player Rank Tier} \ge \text{Tournament Minimum Rank}$$
     $$\text{Player Score} \ge \text{Tournament Minimum Score}$$
     $$\text{Player Wins} \ge \text{Tournament Minimum Wins}$$
   - A cryptographic zero-knowledge proof is generated using the Midnight Proof Server and `@midnight-ntwrk/ledger`.
   - Your exact match history, secret salt, and personal identity remain strictly private on your device.
   - Result: `✓ Eligibility Verified Cryptographically`.

---

### 5. Joining a Solo or Team Tournament on Midnight Preprod
1. Once your ZK proof is computed, PrivateRank prepares the on-chain `joinTournament` transaction intent.
2. **1AM Wallet** automatically opens to balance and approve the transaction.
3. Review the transaction details and gas fee in DUST, then click **Approve** in 1AM Wallet.
4. PrivateRank submits the balanced wire transaction to the Midnight Preprod consensus layer.
5. The live transaction modal guides you through the 6-step confirmation lifecycle:
   - `PREPARING` → `AWAITING_WALLET_APPROVAL` → `SUBMITTING` → `CONFIRMING` → `INDEXER_VERIFICATION` → `CONFIRMED`.
6. Once included in a Midnight block, your anonymous participant record is registered on-chain and in the server registry.

---

### 6. Team Formation & Squad Management
1. For tournaments configured in **TEAM** format:
   - **Create a Squad (Captain)**: Click **Create Team**, name your team, and generate your captain eligibility proof. You will receive captain ownership of the squad.
   - **Join an Open Squad**: Browse registered teams, select a team with open slots, and submit your player eligibility proof.
2. Captains can monitor their squad roster in real-time as team members join.
3. Once the team reaches required capacity (e.g., 4/4 players), the captain finalizes the roster for tournament match seeding.

---

### 7. Organizer: Creating & Deploying On-Chain Tournaments
1. Switch to **Organizer** mode via the role switcher or connect with an authorized organizer wallet.
2. Click **Organizer Dashboard** in the navigation bar.
3. Click **+ Create Tournament** to open the tournament configuration modal.
4. Fill in tournament details:
   - **Tournament Name & Game Title**: Event branding and target game.
   - **Format & Capacity**: SOLO (up to 512 players) or TEAM (up to 64 teams of 2–10 players).
   - **Minimum Requirements**: Rank Tier cutoff, minimum score, and minimum wins required to qualify.
   - **Prize Pool & Details**: Prize distribution in INR (`₹`).
   - **Schedule**: Registration start/end dates and tournament match start/end dates.
   - **Location**: Online platform (Discord/Custom Room) or physical esports venue.
5. Click **Deploy Tournament on Midnight**.
6. 1AM Wallet prompts you to approve the `createTournament` transaction.
7. Upon block confirmation, your tournament is deployed to the Midnight Preprod smart contract and becomes instantly visible to players.

---

### 8. Organizer: Closing & Archiving Tournaments
1. From the **Organizer Dashboard**, locate your tournament under **My Managed Tournaments**.
2. **Close Registrations**:
   - When registration closes, the on-chain status transitions to `CLOSED`.
   - All subsequent player join attempts are strictly rejected.
3. **Archive Tournament**:
   - Click the **Archive** button on an active or completed tournament.
   - PrivateRank executes the real on-chain transaction lifecycle:
     - If the tournament is `OPEN`, it executes the on-chain `closeTournament` circuit first.
     - Once confirmed, it executes the on-chain `archiveTournament` circuit.
   - Each transaction prompts approval in your 1AM Wallet.
   - After confirmation on Midnight Preprod, the tournament status updates to `ARCHIVED`.
   - The tournament remains immutably recorded on the Midnight blockchain but is automatically removed from active player Explore listings.

---

## What Gets Proved (and What Stays Private)

| Feature | What the Verifier / Organizer Learns | What Stays Strictly Confidential |
| :--- | :--- | :--- |
| **Rank Eligibility Proof** | Player satisfies $\text{Rank} \ge \text{Minimum Required Tier}$. | Player's exact score, secret salt, or full match history. |
| **Identity Protection** | A valid proof originated from an authorized wallet. | Player's real name, email, phone number, physical address, and government ID. |
| **Solo / Team Participation** | Anonymous ID (`PR-XXXX`) is registered on-chain for the event. | Player's personal off-chain profile and private wallet balances. |
| **Organizer Review Signature** | Organizer cryptographically signed approval of application. | Private communications, unshielded transaction keys, and reviewer notes. |
| **Tournament State Lifecycle** | Verified on-chain status transitions (`OPEN` → `CLOSED` → `ARCHIVED`). | Internal organizer credentials and unrevealed tournament data. |

---

## Troubleshooting

### "1AM Wallet Extension Not Detected"
- Ensure that the **1AM Wallet** extension is installed in Google Chrome or Brave.
- Verify that the extension is unlocked.
- Reload the page at `http://localhost:3001`.

### "Wrong Network — Switch to Midnight Preprod"
- Click **Switch to Preprod** in the PrivateRank network warning modal.
- Alternatively, open 1AM Wallet, click the network dropdown in settings, and select **Preprod**.

### "Eligibility Requirement Not Satisfied"
- Your player profile rank tier is lower than the tournament's minimum requirement (e.g., trying to join a Diamond tournament while at Gold tier).
- Navigate to the **Profile** tab to verify your credentials or select an open tournament matching your current tier.

### "Transaction Cancelled / Rejected in 1AM Wallet"
- If you click **Reject** or close the 1AM Wallet approval modal, PrivateRank safely cancels the operation without committing state.
- No DUST fees are charged, and your application status remains unchanged. You can retry whenever you are ready.

### "Tournament is Archived or Closed"
- Archived and closed tournaments cannot accept new entries or squad creations.
- Check the **Explore Games** tab for active tournaments with the `OPEN` status badge.
