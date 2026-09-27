PrivateRank --- Project Proposal & Product Specification
Private gaming credentials. Verifiable tournament eligibility.
Midnight Builder Challenge --- Level 4 Submission (Track: Gaming /
Consumer Focus)
1. Executive Summary
PrivateRank is a privacy-preserving decentralized gaming tournament
platform built on the Midnight network. It allows tournament organizers
to create and manage competitive gaming tournaments while enabling
players to prove that they satisfy eligibility requirements without
unnecessarily exposing their personal identity.
Using Midnight's Compact smart contracts and zero-knowledge
architecture, PrivateRank separates gaming eligibility from personal
identity. A player can provide verifiable gaming credentials such as
rank, score, and wins, while the platform minimizes disclosure of
personal information.
PrivateRank is designed around two primary roles:
- Organizer --- creates and manages tournaments and reviews
  eligible participants.
- Player --- discovers tournaments, proves eligibility, and joins
  tournaments using a Midnight-compatible wallet.
The application uses 1AM Wallet and targets the Midnight Preprod
Testnet for the Level 4 prototype.
Disclaimer: PrivateRank is a technical demonstration prototype
developed exclusively for the Midnight Builder Challenge Level 4. It
is not a commercial gaming platform, gambling service, or financial
product.

2. The Problem: Competitive Gaming vs. Personal Privacy
Modern gaming tournaments require players to demonstrate that they meet
eligibility requirements. However, the information collected to
establish eligibility can contain more personal information than an
organizer actually needs.
1. Unnecessary Identity Disclosure
A tournament organizer may only need to know:
- Gaming rank
- Competitive score
- Number of wins
- Tournament eligibility
Yet players may be asked to provide identifying information that is
unrelated to their gaming performance.
2. Public Blockchain Transparency
Traditional public blockchain applications expose transaction activity
and wallet relationships. If tournament participation and credentials
are directly associated with a public wallet, players may
unintentionally reveal information about their gaming activity.
3. All-or-Nothing Credential Sharing
A player should not need to disclose an entire gaming profile merely to
prove one condition such as:
"My rank meets the minimum requirement and my score is above the
tournament threshold."

4. Trust Between Players and Organizers
Organizers need confidence that participants satisfy tournament rules,
while players need confidence that unnecessary personal information will
not be exposed.
PrivateRank addresses this by making eligibility verifiable while
minimizing disclosure.
3. The Solution: Privacy-Preserving Tournament Participation
PrivateRank uses Midnight's privacy-preserving architecture to separate
what must be verified from what does not need to be revealed.
The platform allows an organizer to define tournament eligibility
requirements such as:
- Minimum rank
- Minimum score
- Minimum wins
- Tournament capacity
- Team size
- Registration period
- Tournament schedule
A player can then submit the required gaming credentials and generate a
privacy-preserving commitment/proof for eligibility.
The organizer can verify that the player satisfies the tournament rules
without requiring unnecessary personal identity information.
Example
A tournament requires:
Minimum Rank: Platinum
Minimum Score: 2000
Minimum Wins: 10
A qualifying player can prove eligibility while the application
minimizes disclosure of unrelated personal information.
The result is:
Eligible --- verified on Midnight

without turning the tournament into a public database of players'
personal identities.
4. Target Users
1. Competitive Gamers
Players participating in online gaming competitions who want to prove
eligibility without unnecessarily exposing personal information.
2. Tournament Organizers
Gaming communities, esports organizers, college communities, gaming
clubs, and independent tournament hosts who need verifiable eligibility
and participant management.
3. Esports Communities
Communities running recurring tournaments that need transparent rules
while preserving participant privacy.
4. Privacy-Conscious Web3 Users
Users who want blockchain-based verification without exposing more
personal information than necessary.
5. Why Midnight?
Midnight provides the privacy-preserving infrastructure required for
PrivateRank's core use case.
Privacy-Preserving Computation
Midnight enables applications to perform verifiable computations while
keeping sensitive inputs private when disclosure is unnecessary.
Compact Smart Contracts
PrivateRank uses Compact smart contracts to implement the tournament
lifecycle and on-chain participation rules.
Selective Disclosure
PrivateRank is designed around the principle that an organizer should
receive only the information required to determine tournament
eligibility.
Verifiable On-Chain State
Tournament creation and participation are represented by real Midnight
Preprod transactions rather than frontend-only state.
Zero-Knowledge Proofs
PrivateRank uses Midnight's proving architecture to support
privacy-preserving eligibility verification instead of relying solely on
centralized trust.
6. Architecture & System Flow
+----------------------------------------------------------------+
|                         PLAYER CLIENT                          |
|                                                                |
|  [ Private / Sensitive Inputs ]                                |
|  - Gaming credentials                                          |
|  - Player commitment                                            |
|  - Private identity information                                 |
|  - Wallet-controlled identity                                   |
|                                                                |
|                         |                                      |
|                         v                                      |
|              [ Compact / ZK Verification ]                     |
|              - Check minimum rank                               |
|              - Check minimum score                              |
|              - Check minimum wins                               |
|              - Generate privacy-preserving proof                |
+----------------------------------------------------------------+
                         |
                         | Real transaction + proof
                         v
+----------------------------------------------------------------+
|                    MIDNIGHT PREPROD NETWORK                    |
|                                                                |
|  [ Public / Verifiable Tournament State ]                      |
|  - tournamentId                                                 |
|  - tournament configuration                                     |
|  - eligibility requirements                                     |
|  - applicant / participant state                                |
|  - tournament status                                            |
|                                                                |
|  Smart Contract Circuits:                                      |
|  - createTournament()                                          |
|  - joinTournament()                                             |
|  - closeTournament()                                            |
|  - archiveTournament()                                          |
+----------------------------------------------------------------+
                         |
                         | Verified state
                         v
+----------------------------------------------------------------+
|                       ORGANIZER PORTAL                         |
|                                                                |
|  Organizer learns:                                              |
|  - Tournament participation                                     |
|  - Eligibility result                                           |
|  - Gaming credentials required by the tournament                |
|  - Participant counts                                           |
|                                                                |
|  Organizer does NOT need:                                       |
|  - Unnecessary personal identity information                    |
|  - Private credentials unrelated to eligibility                 |
+----------------------------------------------------------------+

                 1AM Wallet
                     |
                     v
             Real approval/signing
                     |
                     v
             Midnight Preprod
7. Core MVP Features
1. Tournament Creation
Organizers can create tournaments with configurable:
- Tournament name
- Description
- Game
- Solo / Team format
- Team size
- Maximum teams
- Minimum rank
- Minimum score
- Minimum wins
- Registration start/end
- Tournament start/end
- Online / Offline / Hybrid location
- Location details
- Prize pool in INR (₹)
- Prize details
Tournament creation is recorded through a real Midnight Preprod
transaction.
2. Player Tournament Discovery
Players can browse active tournaments and view:
- Game
- Tournament format
- Eligibility requirements
- Schedule
- Location
- Team requirements
- Prize pool
- Participant information
Tournament information is sourced from the application's verified
Midnight state rather than mock tournament data.
3. Privacy-Preserving Eligibility
Players can provide gaming credentials required by a tournament and
generate a privacy-preserving commitment/proof.
The goal is to verify conditions such as:
Rank >= Required Rank
Score >= Required Score
Wins >= Required Wins
without unnecessarily exposing unrelated personal information.
4. Real On-Chain Participation
The Player Join action calls the real:
joinTournament()
circuit.
The intended transaction lifecycle is:
Prepare Transaction
        ↓
1AM Wallet Approval
        ↓
Broadcast
        ↓
Pending
        ↓
Midnight Preprod Block Inclusion
        ↓
Indexer Verification
        ↓
Confirmed
The application does not treat a player as joined until the transaction
is verified.
5. Solo & Team Tournaments
PrivateRank supports both:
- Solo tournaments
- Team tournaments
For team tournaments, tournament rules can enforce:
- Team size
- Maximum number of teams
- Team capacity
- Duplicate participation prevention
- Eligibility of team members
- Team finalization
Example:
Team Size = 4
Maximum Teams = 16

Maximum Players = 16 × 4 = 64
6. Organizer Tournament Management
Organizers can:
- Create tournaments
- Review participation
- Monitor participant counts
- Close tournaments
- Archive tournaments
Archiving changes the on-chain tournament state instead of pretending to
delete immutable blockchain history.
7. Wallet & Network
PrivateRank uses:
- 1AM Wallet
- Midnight Preprod Testnet
The application does not depend on Lace, MetaMask, Freighter, Phantom,
or other wallets for the PrivateRank MVP.
8. Real Blockchain Verification
PrivateRank uses the official Midnight Preprod infrastructure to verify:
- Transaction hashes
- Block inclusion
- Contract state
- Tournament state
- Participation transactions
Frontend-only success states and fake transaction hashes are not part of
the intended production flow.
8. Security & Privacy Principles
PrivateRank follows several core principles:
Minimum Disclosure
Only information required for tournament eligibility should be exposed
to the organizer.
No Fake Blockchain State
Tournament creation, participation, and lifecycle operations must
correspond to real Midnight transactions.
Wallet-Controlled Actions
Transactions requiring user authorization must go through the connected
1AM Wallet.
On-Chain Rule Enforcement
Important tournament constraints such as eligibility, duplicate
participation, capacity, and organizer participation restrictions should
be enforced by the smart contract rather than trusted only to frontend
validation.
Verifiable Participation
A successful participation should be backed by a confirmed Midnight
Preprod transaction and corresponding indexed state.
9. Smart Contract Model
The PrivateRank Compact contract maintains tournament and participation
state.
Core Ledger State
Conceptually, the contract maintains:
tournaments
    ↓
Tournament configuration and lifecycle state

participants
    ↓
Participant / tournament participation records
Core Circuits
createTournament()
    Create a new tournament and store its configuration.

joinTournament()
    Verify tournament eligibility and register participation.

closeTournament()
    Close tournament participation according to tournament lifecycle rules.

archiveTournament()
    Move a tournament to an archived state.
On-Chain Validation
The participation circuit is designed to enforce:
Tournament exists
        ↓
Tournament is open
        ↓
Player is not the organizer
        ↓
Tournament capacity available
        ↓
Player has not already joined
        ↓
Rank requirement satisfied
        ↓
Score requirement satisfied
        ↓
Wins requirement satisfied
        ↓
Participation registered
10. Technology Stack
  Layer                     Technology
  Blockchain                Midnight
  Smart Contracts           Compact
  Network                   Midnight Preprod Testnet
  Wallet                    1AM Wallet
  Frontend                  React.js + TypeScript
  Styling                   Tailwind CSS
  Backend                   Node.js
  API                       REST / Backend verification services
  Blockchain Verification   Midnight Preprod Indexer
  Proof Infrastructure      Midnight Proof Server
  Containerization          Docker
  Development               Git / GitHub
  Deployment                Vercel / appropriate hosting
11. User Flow
Organizer Flow
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
Midnight Preprod Transaction
        ↓
Tournament Confirmed
        ↓
Manage Tournament
Player Flow
Connect 1AM Wallet
        ↓
Select Player
        ↓
Player Portal
        ↓
Explore Tournaments
        ↓
Open Tournament
        ↓
Review Eligibility
        ↓
Generate Privacy-Preserving Proof
        ↓
Click Join
        ↓
1AM Wallet Approval
        ↓
Midnight Preprod Transaction
        ↓
Block + Indexer Verification
        ↓
Tournament Joined
12. Privacy Example
Consider a tournament with:
Minimum Rank  = Platinum
Minimum Score = 2000
Minimum Wins  = 10
A player has:
Rank  = Platinum
Score = 2450
Wins  = 180
The system can verify that the player satisfies the required conditions.
The important privacy principle is that the organizer should not need
unrelated personal information such as:
Real Name
Phone Number
Email
Home Address
Government ID
merely to determine whether the player is eligible.
This creates a separation between:
Who the player is
and
Whether the player qualifies.
13. Prize Pool & Transaction Fees
PrivateRank keeps tournament economics separate from blockchain
transaction fees.
Tournament Prize Pool
The prize pool is an organizer-defined tournament value displayed in
INR (₹).
Example:
Prize Pool: ₹10,000
Midnight Transaction Fee
Blockchain transactions may require DUST for transaction fees.
DUST is a network transaction resource and is not the tournament prize
pool.
Therefore the Player interface distinguishes clearly between:
Tournament Prize: ₹10,000
Transaction Fee: DUST
14. Development & Verification Requirements
The Level 4 implementation is designed around real, reproducible
blockchain behavior.
Required Infrastructure
- Midnight Preprod Testnet
- 1AM Wallet
- Midnight Proof Server
- Docker
- Midnight Preprod Indexer
Verification Requirements
Every important blockchain operation should be traceable to:
Transaction Hash
        ↓
Block Height / Block Hash
        ↓
Indexer Verification
        ↓
Contract / Ledger State
The application must not report a transaction as confirmed merely
because a frontend callback completed.
15. Future Roadmap
Phase 1 --- Level 4 MVP
- Compact tournament contract
- Real tournament creation
- Real player participation
- Privacy-preserving eligibility verification
- Solo and team tournament support
- Organizer and Player portals
- 1AM Wallet integration
- Midnight Preprod deployment
- Proof server integration
- Docker-based development infrastructure
- CI/CD pipeline
- On-chain transaction verification
Phase 2 --- Advanced Gaming Credentials
- Integration with additional gaming credential providers
- More granular credential verification
- Automated credential refresh
- Expanded privacy-preserving claims
Phase 3 --- Advanced Team Privacy
- Private team formation
- Team-level eligibility proofs
- Team captain/member permissions
- Private team credentials
- Team finalization proofs
Phase 4 --- Tournament Ecosystem
- Tournament discovery ecosystem
- Community organizer profiles
- Recurring tournament infrastructure
- Cross-game credential standards
- Privacy-preserving reputation
Phase 5 --- Production Readiness
- Security audit
- Formal contract review
- Performance optimization
- Mainnet readiness
- Broader wallet and ecosystem compatibility where appropriate
16. Expected Impact
PrivateRank demonstrates how blockchain-based gaming applications can
provide verifiable tournament participation without requiring
unnecessary identity disclosure.
The project combines:
Gaming
+
Privacy
+
Zero-Knowledge Proofs
+
Smart Contracts
+
Real On-Chain Verification
into a single tournament workflow.
The central idea is simple:
Prove that a player qualifies --- without requiring the player to
reveal everything about themselves.

17. Conclusion
PrivateRank demonstrates a practical application of Midnight's
privacy-preserving blockchain architecture for competitive gaming.
Instead of treating privacy as an additional feature, PrivateRank makes
privacy part of the tournament participation model itself.
Organizers receive verifiable eligibility information.
Players retain greater control over what personal information they
disclose.
And important tournament actions are backed by real Midnight Preprod
transactions.
PrivateRank --- Compete with confidence. Prove eligibility. Protect
identity.