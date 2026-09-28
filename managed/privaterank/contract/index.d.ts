import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum TournamentStatus { DRAFT = 0,
                               OPEN = 1,
                               CLOSED = 2,
                               COMPLETED = 3,
                               ARCHIVED = 4
}

export type Tournament = { organizer: Uint8Array;
                           minRank: bigint;
                           minScore: bigint;
                           minWins: bigint;
                           maxParticipants: bigint;
                           deadline: bigint;
                           status: TournamentStatus;
                           applicantCount: bigint
                         };

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  createTournament(context: __compactRuntime.CircuitContext<PS>,
                   tournamentId_0: Uint8Array,
                   organizerKey_0: Uint8Array,
                   minRank_0: bigint,
                   minScore_0: bigint,
                   minWins_0: bigint,
                   maxParticipants_0: bigint,
                   deadline_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  joinTournament(context: __compactRuntime.CircuitContext<PS>,
                 tournamentId_0: Uint8Array,
                 playerCommitment_0: Uint8Array,
                 playerRank_0: bigint,
                 playerScore_0: bigint,
                 playerWins_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  closeTournament(context: __compactRuntime.CircuitContext<PS>,
                  tournamentId_0: Uint8Array,
                  organizerKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  archiveTournament(context: __compactRuntime.CircuitContext<PS>,
                    tournamentId_0: Uint8Array,
                    organizerKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  createTournament(context: __compactRuntime.CircuitContext<PS>,
                   tournamentId_0: Uint8Array,
                   organizerKey_0: Uint8Array,
                   minRank_0: bigint,
                   minScore_0: bigint,
                   minWins_0: bigint,
                   maxParticipants_0: bigint,
                   deadline_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  joinTournament(context: __compactRuntime.CircuitContext<PS>,
                 tournamentId_0: Uint8Array,
                 playerCommitment_0: Uint8Array,
                 playerRank_0: bigint,
                 playerScore_0: bigint,
                 playerWins_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  closeTournament(context: __compactRuntime.CircuitContext<PS>,
                  tournamentId_0: Uint8Array,
                  organizerKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  archiveTournament(context: __compactRuntime.CircuitContext<PS>,
                    tournamentId_0: Uint8Array,
                    organizerKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  createTournament(context: __compactRuntime.CircuitContext<PS>,
                   tournamentId_0: Uint8Array,
                   organizerKey_0: Uint8Array,
                   minRank_0: bigint,
                   minScore_0: bigint,
                   minWins_0: bigint,
                   maxParticipants_0: bigint,
                   deadline_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  joinTournament(context: __compactRuntime.CircuitContext<PS>,
                 tournamentId_0: Uint8Array,
                 playerCommitment_0: Uint8Array,
                 playerRank_0: bigint,
                 playerScore_0: bigint,
                 playerWins_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  closeTournament(context: __compactRuntime.CircuitContext<PS>,
                  tournamentId_0: Uint8Array,
                  organizerKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  archiveTournament(context: __compactRuntime.CircuitContext<PS>,
                    tournamentId_0: Uint8Array,
                    organizerKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  tournaments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Tournament;
    [Symbol.iterator](): Iterator<[Uint8Array, Tournament]>
  };
  participants: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
