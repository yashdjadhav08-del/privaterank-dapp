import React, { createContext, useContext, useState, useCallback } from 'react';
import { WalletAuthState } from '../wallet/types';
import { OneAmConnector } from '../wallet/oneAmConnector';
import { AuthService } from '../wallet/authService';
import { ProfileService } from '../services/profileService';
import { PlayerProfile } from '../types';
import { NETWORK } from '../config/network';
import { normalizeAddress } from '../utils/crypto';

export type UserRole = 'PLAYER' | 'ORGANIZER';

interface WalletContextType {
  authState: WalletAuthState;
  playerProfile: PlayerProfile | null;
  /** Role chosen by the user for this session / wallet. Null = not yet selected. */
  selectedRole: UserRole | null;
  /** Active portal role. Defaults to PLAYER if nothing selected yet. */
  activeRole: 'PLAYER' | 'ORGANIZER';
  /** True when a connected wallet is not yet bound to a role and needs first-time setup */
  isRoleSelectionRequired: boolean;
  selectRole: (role: UserRole) => void;
  connectWallet: () => Promise<void>;
  switchToPreprod: () => Promise<void>;
  signMessage: () => Promise<string | null>;
  disconnectWallet: () => void;
  updateProfile: (updated: Partial<PlayerProfile>) => void;
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

  // Role is permanent per wallet and cached in state
  const [selectedRole, setSelectedRoleState] = useState<UserRole | null>(
    () => AuthService.getSelectedRole()
  );
  const [isRoleSelectionRequired, setIsRoleSelectionRequired] = useState<boolean>(false);

  const activeRole: 'PLAYER' | 'ORGANIZER' = selectedRole ?? 'PLAYER';

  const selectRole = useCallback((role: UserRole) => {
    const targetWallet = authState.unshieldedAddress;
    const bound = AuthService.bindRole(targetWallet, role);
    AuthService.selectRole(bound, targetWallet);
    setSelectedRoleState(bound);
    setIsRoleSelectionRequired(false);

    if (bound === 'PLAYER' && targetWallet) {
      const loadedProfile = ProfileService.getProfile(targetWallet);
      setPlayerProfile(loadedProfile);
    } else {
      setPlayerProfile(null);
    }
  }, [authState.unshieldedAddress]);

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const connectWallet = async () => {
    setAuthState(prev => ({ ...prev, isConnecting: true, error: null, isWrongNetwork: false }));

    const timeoutTimer = setTimeout(() => {
      setAuthState(prev => {
        if (prev.isConnecting) {
          return {
            ...prev,
            isConnecting: false,
            error: 'Connection timed out. Please click the 1AM Wallet icon in your browser toolbar to approve the connection request.'
          };
        }
        return prev;
      });
    }, 18000);

    try {
      const { unshieldedAddress, shieldedAddress, dustBalance, detectedNetwork, isPreprod } =
        await OneAmConnector.connectRealWallet();

      const safeUnshielded = normalizeAddress(unshieldedAddress);
      const safeShielded = normalizeAddress(shieldedAddress);

      // Check permanent wallet-to-role binding
      const boundRole = safeUnshielded ? AuthService.getRoleForWallet(safeUnshielded) : null;
      if (boundRole) {
        setSelectedRoleState(boundRole);
        AuthService.selectRole(boundRole, safeUnshielded);
        setIsRoleSelectionRequired(false);
      } else {
        setSelectedRoleState(null);
        setIsRoleSelectionRequired(true);
      }

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

      // Load player profile only when not bound to ORGANIZER
      if (boundRole !== 'ORGANIZER' && safeUnshielded) {
        const loadedProfile = ProfileService.getProfile(safeUnshielded);
        setPlayerProfile(loadedProfile);
      } else {
        setPlayerProfile(null);
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
    } finally {
      clearTimeout(timeoutTimer);
    }
  };

  const switchToPreprod = async () => {
    try {
      setAuthState(prev => ({ ...prev, isConnecting: true, error: null }));
      await OneAmConnector.switchToPreprod();
      await connectWallet();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to switch network in wallet';
      setAuthState(prev => ({ ...prev, isConnecting: false, error: msg }));
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
    AuthService.clearRole();
    setSelectedRoleState(null);
    setIsRoleSelectionRequired(false);
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
    if (activeRole === 'ORGANIZER') {
      throw new Error('Organizer wallets cannot modify player profiles.');
    }
    setPlayerProfile(prev => {
      const base = prev || (authState.unshieldedAddress ? ProfileService.getProfile(authState.unshieldedAddress) : null);
      if (!base) return null;
      const merged: PlayerProfile = {
        ...base,
        ...updated,
        personalInfo: { ...base.personalInfo, ...(updated.personalInfo || {}) },
        gamingCredentials: { ...base.gamingCredentials, ...(updated.gamingCredentials || {}) }
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
        selectedRole,
        activeRole,
        isRoleSelectionRequired,
        selectRole,
        connectWallet,
        switchToPreprod,
        signMessage,
        disconnectWallet,
        updateProfile,
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
