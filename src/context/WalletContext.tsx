import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletAuthState } from '../wallet/types';
import { OneAmConnector } from '../wallet/oneAmConnector';
import { AuthService } from '../wallet/authService';
import { ProfileService } from '../services/profileService';
import { PlayerProfile, RankTier } from '../types';
import { NETWORK } from '../config/network';
import { normalizeAddress, safeAddressCompare } from '../utils/crypto';

export type UserRole = 'PLAYER' | 'ORGANIZER' | 'UNKNOWN';

interface WalletContextType {
  authState: WalletAuthState;
  playerProfile: PlayerProfile | null;
  activeRole: 'PLAYER' | 'ORGANIZER';
  userRole: UserRole;
  isOrganizerAuthorized: boolean;
  connectWallet: () => Promise<void>;
  switchToPreprod: () => Promise<void>;
  signMessage: () => Promise<string | null>;
  disconnectWallet: () => void;
  updateProfile: (updated: Partial<PlayerProfile>) => void;
  registerOrganizerWallet: (name?: string, organization?: string) => void;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<WalletAuthState>({
    isConnected: false,
    isConnecting: false,
    isSigning: false,
    network: NETWORK,
    isWrongNetwork: false,
    detectedNetwork: null,
    unshieldedAddress: null,
    shieldedAddress: null,
    dustBalance: '0',
    signature: null,
    isSimulator: false,
    error: null
  });

  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [, setAuthVersion] = useState(0);

  // Strict role resolution based purely on connected 1AM wallet address
  const isOrganizerAuthorized = AuthService.isOrganizerAuthorized(authState.unshieldedAddress);
  const userRole: UserRole = authState.isConnected
    ? (isOrganizerAuthorized ? 'ORGANIZER' : 'PLAYER')
    : 'UNKNOWN';

  // activeRole strictly matches the wallet's authentic role (no manual switching permitted)
  const activeRole: 'PLAYER' | 'ORGANIZER' = isOrganizerAuthorized ? 'ORGANIZER' : 'PLAYER';

  const registerOrganizerWallet = (name = 'Tournament Organizer', organization = 'Midnight Community') => {
    if (authState.unshieldedAddress) {
      AuthService.registerOrganizer(authState.unshieldedAddress, name, organization);
      setAuthVersion(v => v + 1);
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const connectWallet = async () => {
    setAuthState(prev => ({ ...prev, isConnecting: true, error: null, isWrongNetwork: false }));

    try {
      // 1. Clean Connection to 1AM Wallet
      const { unshieldedAddress, shieldedAddress, dustBalance, detectedNetwork, isPreprod } =
        await OneAmConnector.connectRealWallet();

      const safeUnshielded = normalizeAddress(unshieldedAddress);
      const safeShielded = normalizeAddress(shieldedAddress);

      // 2. Validate Network: PREPROD ONLY
      if (!isPreprod) {
        setAuthState({
          isConnected: true,
          isConnecting: false,
          isSigning: false,
          network: NETWORK,
          isWrongNetwork: true,
          detectedNetwork: detectedNetwork || 'Unknown Network',
          unshieldedAddress: safeUnshielded || null,
          shieldedAddress: safeShielded || null,
          dustBalance,
          signature: null,
          isSimulator: false,
          error: null
        });
        return;
      }

      // 3. Mark wallet as connected
      setAuthState({
        isConnected: true,
        isConnecting: false,
        isSigning: false,
        network: NETWORK,
        isWrongNetwork: false,
        detectedNetwork,
        unshieldedAddress: safeUnshielded,
        shieldedAddress: safeShielded,
        dustBalance,
        signature: null,
        isSimulator: false,
        error: null
      });

      // 4. Strict Role & Profile Resolution:
      const isOrg = AuthService.isOrganizerAuthorized(safeUnshielded);
      if (isOrg) {
        // Organizers cannot load or have player profile
        setPlayerProfile(null);
      } else {
        // Players load their gaming credentials & profile
        const loadedProfile = ProfileService.getProfile(safeUnshielded);
        setPlayerProfile(loadedProfile);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Wallet connection failed';
      setAuthState(prev => ({
        ...prev,
        isConnecting: false,
        isSigning: false,
        isConnected: false,
        isWrongNetwork: false,
        detectedNetwork: null,
        unshieldedAddress: null,
        shieldedAddress: null,
        error: errorMsg
      }));
    }
  };

  const switchToPreprod = async () => {
    try {
      setAuthState(prev => ({ ...prev, isConnecting: true, error: null }));
      await OneAmConnector.switchToPreprod();
      await connectWallet();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to switch network in wallet';
      setAuthState(prev => ({
        ...prev,
        isConnecting: false,
        error: msg
      }));
    }
  };

  const signMessage = async (): Promise<string | null> => {
    if (authState.isWrongNetwork) {
      setAuthState(prev => ({ ...prev, error: 'Please switch your wallet to Midnight Preprod Testnet before signing.' }));
      return null;
    }

    if (!authState.unshieldedAddress) {
      setAuthState(prev => ({ ...prev, error: 'No wallet connected to sign' }));
      return null;
    }

    setAuthState(prev => ({ ...prev, isSigning: true, error: null }));
    try {
      const signature = await OneAmConnector.signChallenge(authState.unshieldedAddress);
      setAuthState(prev => ({ ...prev, signature, isSigning: false, error: null }));
      return signature;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Signing failed';
      setAuthState(prev => ({ ...prev, isSigning: false, error: errorMsg }));
      return null;
    }
  };

  const disconnectWallet = () => {
    setAuthState({
      isConnected: false,
      isConnecting: false,
      isSigning: false,
      network: NETWORK,
      isWrongNetwork: false,
      detectedNetwork: null,
      unshieldedAddress: null,
      shieldedAddress: null,
      dustBalance: '0',
      signature: null,
      isSimulator: false,
      error: null
    });
    setPlayerProfile(null);
  };

  const updateProfile = (updated: Partial<PlayerProfile>) => {
    // Only players can update player profile
    if (isOrganizerAuthorized) {
      throw new Error('Access Restricted: Organizer wallets cannot modify player profiles.');
    }

    setPlayerProfile(prev => {
      const base = prev || (authState.unshieldedAddress ? ProfileService.getProfile(authState.unshieldedAddress) : null);
      if (!base) return null;

      const merged: PlayerProfile = {
        ...base,
        ...updated,
        personalInfo: {
          ...base.personalInfo,
          ...(updated.personalInfo || {})
        },
        gamingCredentials: {
          ...base.gamingCredentials,
          ...(updated.gamingCredentials || {})
        }
      };

      ProfileService.saveProfile(merged);
      return merged;
    });
  };

  return (
    <WalletContext.Provider
      value={{
        authState,
        playerProfile,
        activeRole,
        userRole,
        isOrganizerAuthorized,
        connectWallet,
        switchToPreprod,
        signMessage,
        disconnectWallet,
        updateProfile,
        registerOrganizerWallet,
        clearError
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
