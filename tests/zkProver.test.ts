import { describe, it, expect } from 'vitest';
import { ZkProverService } from '../src/contracts/zkProver';
import { RankTier } from '../src/types';

describe('Zero-Knowledge Prover Circuit (Midnight Compact)', () => {
  const requirements = {
    minimumRank: RankTier.PLATINUM, // 4
    minimumScore: 2000,
    minimumWins: 50
  };

  const eligibleCredentials = {
    rank: RankTier.DIAMOND, // 5 (>= 4)
    score: 2450, // >= 2000
    wins: 180, // >= 50
    losses: 40,
    achievements: ['Champion'],
    gameTitle: 'Midnight Apex Rivals',
    verifiedAt: '2026-09-01T00:00:00.000Z'
  };

  const personalInfo = {
    fullName: 'Alex Vance',
    email: 'alex.vance@zkmail.io',
    phone: '+1 (555) 234-8921',
    country: 'Canada',
    dateOfBirth: '1998-04-12'
  };

  const walletAddress = '0x71C8366420A092679b54538490758BDE353613AC';

  it('should generate a valid ZK proof when player meets or exceeds requirements', async () => {
    const proof = await ZkProverService.generateEligibilityProof({
      tournamentId: 't-midnight-champ-2026',
      requirements,
      gamingCredentials: eligibleCredentials,
      personalInfo,
      walletAddress
    });

    expect(proof.proofId).toMatch(/^PRF-[0-9A-F]{8}$/);
    expect(proof.anonymousPlayerId).toMatch(/^PR-[0-9A-F]{4}$/);
    expect(proof.commitmentHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(proof.nullifierHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(proof.rankSatisfied).toBe(true);
    expect(proof.scoreSatisfied).toBe(true);
    expect(proof.winsSatisfied).toBe(true);

    // Cryptographic verification
    const verification = ZkProverService.verifyProof(proof, requirements);
    expect(verification.isValid).toBe(true);
  });

  it('should reject proof generation when player rank is below requirement', async () => {
    const underRankCredentials = {
      ...eligibleCredentials,
      rank: RankTier.GOLD // 3 (< 4 Platinum)
    };

    await expect(
      ZkProverService.generateEligibilityProof({
        tournamentId: 't-midnight-champ-2026',
        requirements,
        gamingCredentials: underRankCredentials,
        personalInfo,
        walletAddress
      })
    ).rejects.toThrow(/do not satisfy tournament requirements/);
  });

  it('should reject proof generation when player score is below requirement', async () => {
    const underScoreCredentials = {
      ...eligibleCredentials,
      score: 1850 // < 2000
    };

    await expect(
      ZkProverService.generateEligibilityProof({
        tournamentId: 't-midnight-champ-2026',
        requirements,
        gamingCredentials: underScoreCredentials,
        personalInfo,
        walletAddress
      })
    ).rejects.toThrow(/do not satisfy tournament requirements/);
  });

  it('should verify proof without revealing personal identity fields', async () => {
    const proof = await ZkProverService.generateEligibilityProof({
      tournamentId: 't-midnight-champ-2026',
      requirements,
      gamingCredentials: eligibleCredentials,
      personalInfo,
      walletAddress
    });

    const serializedProof = JSON.stringify(proof);
    expect(serializedProof).not.toContain(personalInfo.fullName);
    expect(serializedProof).not.toContain(personalInfo.email);
    expect(serializedProof).not.toContain(personalInfo.phone);
    expect(serializedProof).not.toContain(personalInfo.country);
  });
});
