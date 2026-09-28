import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

export var TournamentStatus;
(function (TournamentStatus) {
  TournamentStatus[TournamentStatus['DRAFT'] = 0] = 'DRAFT';
  TournamentStatus[TournamentStatus['OPEN'] = 1] = 'OPEN';
  TournamentStatus[TournamentStatus['CLOSED'] = 2] = 'CLOSED';
  TournamentStatus[TournamentStatus['COMPLETED'] = 3] = 'COMPLETED';
  TournamentStatus[TournamentStatus['ARCHIVED'] = 4] = 'ARCHIVED';
})(TournamentStatus || (TournamentStatus = {}));

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_2 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

const _descriptor_3 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_4 = new __compactRuntime.CompactTypeEnum(4, 1);

class _Tournament_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment().concat(_descriptor_2.alignment())))))));
  }
  fromValue(value_0) {
    return {
      organizer: _descriptor_0.fromValue(value_0),
      minRank: _descriptor_1.fromValue(value_0),
      minScore: _descriptor_2.fromValue(value_0),
      minWins: _descriptor_2.fromValue(value_0),
      maxParticipants: _descriptor_2.fromValue(value_0),
      deadline: _descriptor_3.fromValue(value_0),
      status: _descriptor_4.fromValue(value_0),
      applicantCount: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.organizer).concat(_descriptor_1.toValue(value_0.minRank).concat(_descriptor_2.toValue(value_0.minScore).concat(_descriptor_2.toValue(value_0.minWins).concat(_descriptor_2.toValue(value_0.maxParticipants).concat(_descriptor_3.toValue(value_0.deadline).concat(_descriptor_4.toValue(value_0.status).concat(_descriptor_2.toValue(value_0.applicantCount))))))));
  }
}

const _descriptor_5 = new _Tournament_0();

const _descriptor_6 = __compactRuntime.CompactTypeBoolean;

class _Either_0 {
  alignment() {
    return _descriptor_6.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_6.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_6.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_7 = new _Either_0();

const _descriptor_8 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_9 = new _ContractAddress_0();

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      createTournament: (...args_1) => {
        if (args_1.length !== 8) {
          throw new __compactRuntime.CompactError(`createTournament: expected 8 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const tournamentId_0 = args_1[1];
        const organizerKey_0 = args_1[2];
        const minRank_0 = args_1[3];
        const minScore_0 = args_1[4];
        const minWins_0 = args_1[5];
        const maxParticipants_0 = args_1[6];
        const deadline_0 = args_1[7];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('createTournament',
                                     'argument 1 (as invoked from Typescript)',
                                     'privaterank.compact line 52 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(tournamentId_0.buffer instanceof ArrayBuffer && tournamentId_0.BYTES_PER_ELEMENT === 1 && tournamentId_0.length === 32)) {
          __compactRuntime.typeError('createTournament',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'privaterank.compact line 52 char 1',
                                     'Bytes<32>',
                                     tournamentId_0)
        }
        if (!(organizerKey_0.buffer instanceof ArrayBuffer && organizerKey_0.BYTES_PER_ELEMENT === 1 && organizerKey_0.length === 32)) {
          __compactRuntime.typeError('createTournament',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'privaterank.compact line 52 char 1',
                                     'Bytes<32>',
                                     organizerKey_0)
        }
        if (!(typeof(minRank_0) === 'bigint' && minRank_0 >= 0n && minRank_0 <= 255n)) {
          __compactRuntime.typeError('createTournament',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'privaterank.compact line 52 char 1',
                                     'Uint<0..256>',
                                     minRank_0)
        }
        if (!(typeof(minScore_0) === 'bigint' && minScore_0 >= 0n && minScore_0 <= 4294967295n)) {
          __compactRuntime.typeError('createTournament',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'privaterank.compact line 52 char 1',
                                     'Uint<0..4294967296>',
                                     minScore_0)
        }
        if (!(typeof(minWins_0) === 'bigint' && minWins_0 >= 0n && minWins_0 <= 4294967295n)) {
          __compactRuntime.typeError('createTournament',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'privaterank.compact line 52 char 1',
                                     'Uint<0..4294967296>',
                                     minWins_0)
        }
        if (!(typeof(maxParticipants_0) === 'bigint' && maxParticipants_0 >= 0n && maxParticipants_0 <= 4294967295n)) {
          __compactRuntime.typeError('createTournament',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'privaterank.compact line 52 char 1',
                                     'Uint<0..4294967296>',
                                     maxParticipants_0)
        }
        if (!(typeof(deadline_0) === 'bigint' && deadline_0 >= 0n && deadline_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('createTournament',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'privaterank.compact line 52 char 1',
                                     'Uint<0..18446744073709551616>',
                                     deadline_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(tournamentId_0).concat(_descriptor_0.toValue(organizerKey_0).concat(_descriptor_1.toValue(minRank_0).concat(_descriptor_2.toValue(minScore_0).concat(_descriptor_2.toValue(minWins_0).concat(_descriptor_2.toValue(maxParticipants_0).concat(_descriptor_3.toValue(deadline_0))))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_3.alignment()))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._createTournament_0(context,
                                                  partialProofData,
                                                  tournamentId_0,
                                                  organizerKey_0,
                                                  minRank_0,
                                                  minScore_0,
                                                  minWins_0,
                                                  maxParticipants_0,
                                                  deadline_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      joinTournament: (...args_1) => {
        if (args_1.length !== 6) {
          throw new __compactRuntime.CompactError(`joinTournament: expected 6 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const tournamentId_0 = args_1[1];
        const playerCommitment_0 = args_1[2];
        const playerRank_0 = args_1[3];
        const playerScore_0 = args_1[4];
        const playerWins_0 = args_1[5];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('joinTournament',
                                     'argument 1 (as invoked from Typescript)',
                                     'privaterank.compact line 82 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(tournamentId_0.buffer instanceof ArrayBuffer && tournamentId_0.BYTES_PER_ELEMENT === 1 && tournamentId_0.length === 32)) {
          __compactRuntime.typeError('joinTournament',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'privaterank.compact line 82 char 1',
                                     'Bytes<32>',
                                     tournamentId_0)
        }
        if (!(playerCommitment_0.buffer instanceof ArrayBuffer && playerCommitment_0.BYTES_PER_ELEMENT === 1 && playerCommitment_0.length === 32)) {
          __compactRuntime.typeError('joinTournament',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'privaterank.compact line 82 char 1',
                                     'Bytes<32>',
                                     playerCommitment_0)
        }
        if (!(typeof(playerRank_0) === 'bigint' && playerRank_0 >= 0n && playerRank_0 <= 255n)) {
          __compactRuntime.typeError('joinTournament',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'privaterank.compact line 82 char 1',
                                     'Uint<0..256>',
                                     playerRank_0)
        }
        if (!(typeof(playerScore_0) === 'bigint' && playerScore_0 >= 0n && playerScore_0 <= 4294967295n)) {
          __compactRuntime.typeError('joinTournament',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'privaterank.compact line 82 char 1',
                                     'Uint<0..4294967296>',
                                     playerScore_0)
        }
        if (!(typeof(playerWins_0) === 'bigint' && playerWins_0 >= 0n && playerWins_0 <= 4294967295n)) {
          __compactRuntime.typeError('joinTournament',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'privaterank.compact line 82 char 1',
                                     'Uint<0..4294967296>',
                                     playerWins_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(tournamentId_0).concat(_descriptor_0.toValue(playerCommitment_0).concat(_descriptor_1.toValue(playerRank_0).concat(_descriptor_2.toValue(playerScore_0).concat(_descriptor_2.toValue(playerWins_0))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment()))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._joinTournament_0(context,
                                                partialProofData,
                                                tournamentId_0,
                                                playerCommitment_0,
                                                playerRank_0,
                                                playerScore_0,
                                                playerWins_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      closeTournament: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`closeTournament: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const tournamentId_0 = args_1[1];
        const organizerKey_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('closeTournament',
                                     'argument 1 (as invoked from Typescript)',
                                     'privaterank.compact line 141 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(tournamentId_0.buffer instanceof ArrayBuffer && tournamentId_0.BYTES_PER_ELEMENT === 1 && tournamentId_0.length === 32)) {
          __compactRuntime.typeError('closeTournament',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'privaterank.compact line 141 char 1',
                                     'Bytes<32>',
                                     tournamentId_0)
        }
        if (!(organizerKey_0.buffer instanceof ArrayBuffer && organizerKey_0.BYTES_PER_ELEMENT === 1 && organizerKey_0.length === 32)) {
          __compactRuntime.typeError('closeTournament',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'privaterank.compact line 141 char 1',
                                     'Bytes<32>',
                                     organizerKey_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(tournamentId_0).concat(_descriptor_0.toValue(organizerKey_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._closeTournament_0(context,
                                                 partialProofData,
                                                 tournamentId_0,
                                                 organizerKey_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      archiveTournament: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`archiveTournament: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const tournamentId_0 = args_1[1];
        const organizerKey_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('archiveTournament',
                                     'argument 1 (as invoked from Typescript)',
                                     'privaterank.compact line 172 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(tournamentId_0.buffer instanceof ArrayBuffer && tournamentId_0.BYTES_PER_ELEMENT === 1 && tournamentId_0.length === 32)) {
          __compactRuntime.typeError('archiveTournament',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'privaterank.compact line 172 char 1',
                                     'Bytes<32>',
                                     tournamentId_0)
        }
        if (!(organizerKey_0.buffer instanceof ArrayBuffer && organizerKey_0.BYTES_PER_ELEMENT === 1 && organizerKey_0.length === 32)) {
          __compactRuntime.typeError('archiveTournament',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'privaterank.compact line 172 char 1',
                                     'Bytes<32>',
                                     organizerKey_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(tournamentId_0).concat(_descriptor_0.toValue(organizerKey_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._archiveTournament_0(context,
                                                   partialProofData,
                                                   tournamentId_0,
                                                   organizerKey_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      createTournament: this.circuits.createTournament,
      joinTournament: this.circuits.joinTournament,
      closeTournament: this.circuits.closeTournament,
      archiveTournament: this.circuits.archiveTournament
    };
    this.provableCircuits = {
      createTournament: this.circuits.createTournament,
      joinTournament: this.circuits.joinTournament,
      closeTournament: this.circuits.closeTournament,
      archiveTournament: this.circuits.archiveTournament
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('createTournament', new __compactRuntime.ContractOperation());
    state_0.setOperation('joinTournament', new __compactRuntime.ContractOperation());
    state_0.setOperation('closeTournament', new __compactRuntime.ContractOperation());
    state_0.setOperation('archiveTournament', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(1n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _createTournament_0(context,
                      partialProofData,
                      tournamentId_0,
                      organizerKey_0,
                      minRank_0,
                      minScore_0,
                      minWins_0,
                      maxParticipants_0,
                      deadline_0)
  {
    const notExists_0 = !_descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                   partialProofData,
                                                                                   [
                                                                                    { dup: { n: 0 } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_1.toValue(0n),
                                                                                                               alignment: _descriptor_1.alignment() } }] } },
                                                                                    { push: { storage: false,
                                                                                              value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tournamentId_0),
                                                                                                                                           alignment: _descriptor_0.alignment() }).encode() } },
                                                                                    'member',
                                                                                    { popeq: { cached: true,
                                                                                               result: undefined } }]).value);
    __compactRuntime.assert(notExists_0, 'Tournament ID already exists');
    const newTournament_0 = { organizer: organizerKey_0,
                              minRank: minRank_0,
                              minScore: minScore_0,
                              minWins: minWins_0,
                              maxParticipants: maxParticipants_0,
                              deadline: deadline_0,
                              status: 1,
                              applicantCount: 0n };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_1.toValue(0n),
                                                                  alignment: _descriptor_1.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tournamentId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(newTournament_0),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _joinTournament_0(context,
                    partialProofData,
                    tournamentId_0,
                    playerCommitment_0,
                    playerRank_0,
                    playerScore_0,
                    playerWins_0)
  {
    const exists_0 = _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_1.toValue(0n),
                                                                                                           alignment: _descriptor_1.alignment() } }] } },
                                                                                { push: { storage: false,
                                                                                          value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tournamentId_0),
                                                                                                                                       alignment: _descriptor_0.alignment() }).encode() } },
                                                                                'member',
                                                                                { popeq: { cached: true,
                                                                                           result: undefined } }]).value);
    __compactRuntime.assert(exists_0, 'Tournament does not exist');
    const tourney_0 = _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 0 } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_1.toValue(0n),
                                                                                                            alignment: _descriptor_1.alignment() } }] } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_0.toValue(tournamentId_0),
                                                                                                            alignment: _descriptor_0.alignment() } }] } },
                                                                                 { popeq: { cached: false,
                                                                                            result: undefined } }]).value);
    const isOpen_0 = tourney_0.status === 1;
    __compactRuntime.assert(isOpen_0, 'Tournament is not open for participation');
    const notOrganizer_0 = !this._equal_0(tourney_0.organizer,
                                          playerCommitment_0);
    __compactRuntime.assert(notOrganizer_0,
                            'Organizer cannot participate in own tournament');
    let t_0;
    const capacityOk_0 = this._equal_1(tourney_0.maxParticipants, 0n)
                         ||
                         (t_0 = tourney_0.applicantCount,
                          t_0 < tourney_0.maxParticipants);
    __compactRuntime.assert(capacityOk_0, 'Tournament capacity reached');
    const participantKey_0 = playerCommitment_0;
    const alreadyJoined_0 = _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_1.toValue(1n),
                                                                                                                  alignment: _descriptor_1.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(participantKey_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value);
    __compactRuntime.assert(!alreadyJoined_0,
                            'Player has already joined this tournament');
    const rankOk_0 = playerRank_0 >= tourney_0.minRank;
    __compactRuntime.assert(rankOk_0,
                            'Player rank does not meet minimum requirement');
    const scoreOk_0 = playerScore_0 >= tourney_0.minScore;
    __compactRuntime.assert(scoreOk_0,
                            'Player score does not meet minimum requirement');
    const winsOk_0 = playerWins_0 >= tourney_0.minWins;
    __compactRuntime.assert(winsOk_0,
                            'Player wins do not meet minimum requirement');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_1.toValue(1n),
                                                                  alignment: _descriptor_1.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(participantKey_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(true),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const updatedTourney_0 = { organizer: tourney_0.organizer,
                               minRank: tourney_0.minRank,
                               minScore: tourney_0.minScore,
                               minWins: tourney_0.minWins,
                               maxParticipants: tourney_0.maxParticipants,
                               deadline: tourney_0.deadline,
                               status: tourney_0.status,
                               applicantCount:
                                 ((t1) => {
                                   if (t1 > 4294967295n) {
                                     throw new __compactRuntime.CompactError('privaterank.compact line 133 char 21: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 4294967295');
                                   }
                                   return t1;
                                 })(tourney_0.applicantCount + 1n) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_1.toValue(0n),
                                                                  alignment: _descriptor_1.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tournamentId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(updatedTourney_0),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _closeTournament_0(context, partialProofData, tournamentId_0, organizerKey_0)
  {
    const exists_0 = _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_1.toValue(0n),
                                                                                                           alignment: _descriptor_1.alignment() } }] } },
                                                                                { push: { storage: false,
                                                                                          value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tournamentId_0),
                                                                                                                                       alignment: _descriptor_0.alignment() }).encode() } },
                                                                                'member',
                                                                                { popeq: { cached: true,
                                                                                           result: undefined } }]).value);
    __compactRuntime.assert(exists_0, 'Tournament does not exist');
    const tourney_0 = _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 0 } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_1.toValue(0n),
                                                                                                            alignment: _descriptor_1.alignment() } }] } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_0.toValue(tournamentId_0),
                                                                                                            alignment: _descriptor_0.alignment() } }] } },
                                                                                 { popeq: { cached: false,
                                                                                            result: undefined } }]).value);
    const isOwner_0 = this._equal_2(tourney_0.organizer, organizerKey_0);
    __compactRuntime.assert(isOwner_0, 'Caller is not the tournament organizer');
    const isOpen_0 = tourney_0.status === 1;
    __compactRuntime.assert(isOpen_0, 'Tournament must be OPEN to close');
    const closedTourney_0 = { organizer: tourney_0.organizer,
                              minRank: tourney_0.minRank,
                              minScore: tourney_0.minScore,
                              minWins: tourney_0.minWins,
                              maxParticipants: tourney_0.maxParticipants,
                              deadline: tourney_0.deadline,
                              status: 2,
                              applicantCount: tourney_0.applicantCount };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_1.toValue(0n),
                                                                  alignment: _descriptor_1.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tournamentId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(closedTourney_0),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _archiveTournament_0(context, partialProofData, tournamentId_0, organizerKey_0)
  {
    const exists_0 = _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_1.toValue(0n),
                                                                                                           alignment: _descriptor_1.alignment() } }] } },
                                                                                { push: { storage: false,
                                                                                          value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tournamentId_0),
                                                                                                                                       alignment: _descriptor_0.alignment() }).encode() } },
                                                                                'member',
                                                                                { popeq: { cached: true,
                                                                                           result: undefined } }]).value);
    __compactRuntime.assert(exists_0, 'Tournament does not exist');
    const tourney_0 = _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 0 } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_1.toValue(0n),
                                                                                                            alignment: _descriptor_1.alignment() } }] } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_0.toValue(tournamentId_0),
                                                                                                            alignment: _descriptor_0.alignment() } }] } },
                                                                                 { popeq: { cached: false,
                                                                                            result: undefined } }]).value);
    const isOwner_0 = this._equal_3(tourney_0.organizer, organizerKey_0);
    __compactRuntime.assert(isOwner_0, 'Caller is not the tournament organizer');
    const completed_0 = tourney_0.status === 3 || tourney_0.status === 2;
    __compactRuntime.assert(completed_0,
                            'Tournament must be COMPLETED or CLOSED to archive');
    const archivedTourney_0 = { organizer: tourney_0.organizer,
                                minRank: tourney_0.minRank,
                                minScore: tourney_0.minScore,
                                minWins: tourney_0.minWins,
                                maxParticipants: tourney_0.maxParticipants,
                                deadline: tourney_0.deadline,
                                status: 4,
                                applicantCount: tourney_0.applicantCount };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_1.toValue(0n),
                                                                  alignment: _descriptor_1.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tournamentId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(archivedTourney_0),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    tournaments: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_1.toValue(0n),
                                                                                                     alignment: _descriptor_1.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_1.toValue(0n),
                                                                                                     alignment: _descriptor_1.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'privaterank.compact line 36 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_1.toValue(0n),
                                                                                                     alignment: _descriptor_1.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'privaterank.compact line 36 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_1.toValue(0n),
                                                                                                     alignment: _descriptor_1.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_5.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    participants: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_1.toValue(1n),
                                                                                                     alignment: _descriptor_1.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_1.toValue(1n),
                                                                                                     alignment: _descriptor_1.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'privaterank.compact line 38 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_1.toValue(1n),
                                                                                                     alignment: _descriptor_1.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'privaterank.compact line 38 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_1.toValue(1n),
                                                                                                     alignment: _descriptor_1.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[1];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_6.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({ });
export const pureCircuits = {};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
