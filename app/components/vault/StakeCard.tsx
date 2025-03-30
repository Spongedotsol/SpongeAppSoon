"use client";

import { MemeButton } from "../ui/MemeButton";
import StakePercentageButtons from "./StakePercentageButtons";
import TokenData from "./TokenData";
import {
  useWallet,
  useAnchorWallet,
  AnchorWallet,
} from "@solana/wallet-adapter-react";
import { useState, useEffect, useMemo } from "react";
import {
  stakeSpl,
  getUserNativeBalance,
  getUserSplBalance,
  getUserSplStaked,
} from "@/lib/program";
import { Connection, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import useNetworkStore from "@/store/useNetworkStore";
import useTokenStore from "@/store/useTokenStore";
import { idl, SoonVault } from "@/program/soon_vault";
import { token } from "@coral-xyz/anchor/dist/cjs/utils";

export default function StakeCard() {
  const { sendTransaction } = useWallet();
  const { currentNetwork } = useNetworkStore();
  const wallet = useAnchorWallet();
  const [stakeAmount, setStakeAmount] = useState(0);
  const [stakeValue, setStakeValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create connection using useMemo to prevent recreation on every render
  const connection = useMemo(() => {
    return new Connection(currentNetwork.rpcUrl, "confirmed");
  }, [currentNetwork.rpcUrl]);

  // Get token data from store
  const {
    selectedToken,
    supportedTokens,
    setSelectedToken,
    balance,
    stakedAmount,
    setBalance,
    setStakedAmount,
    getTokenMint,
  } = useTokenStore();

  const tokenSymbol = selectedToken.symbol;
  const currentPrice = selectedToken.decimals;

  // Define fetchBalances as a function to be reused
  const fetchBalances = async (): Promise<void> => {
    // Return early if wallet is not connected
    if (!wallet) {
      setError("Wallet not connected");
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      // Fetch balance based on token type
      if (selectedToken.isNative) {
        // For native token (ETH)
        const nativeBalance = await getUserNativeBalance(connection, wallet);
        setBalance(nativeBalance || 0);
      } else {
        // For SPL tokens
        const splBalance = await getUserSplBalance(
          connection,
          wallet,
          selectedToken.mint
        );
        console.log("BALANCE", splBalance);
        setBalance(splBalance || 0);
      }

      // Fetch staked amount
      const tokenMint = getTokenMint(selectedToken.symbol);

      const staked = await getUserSplStaked(
        connection,
        wallet,
        idl as SoonVault,
        idl.address,
        new PublicKey(currentNetwork.authorityPublicKey),
        tokenMint
      );
      console.log("tokenMint", tokenMint.toBase58());
      setStakedAmount(staked || 0);
    } catch (error) {
      console.error("Error fetching balances:", error);
      setError("Failed to fetch balances. Check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!wallet) return;
    fetchBalances();
  }, [wallet, currentNetwork.rpcUrl, selectedToken, connection, setBalance, setStakedAmount, getTokenMint]);

  const handleStakeToken = async () => {
    if (!wallet) {
      setError("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      if (stakeAmount <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      const tokenMint = getTokenMint(selectedToken.symbol);
      const rawAmount = stakeAmount * Math.pow(10, selectedToken.decimals); // Convert to token units

      let tx;
      if (selectedToken.isNative) {
        // Use native token staking method for ETH
        console.log("Staking native token: ETH");
        // TODO: Implement native token staking
        setError("Native token staking not yet implemented");
        return;
      } else {
        // Use SPL token staking method
        console.log("Staking SPL token:", selectedToken.symbol);
        tx = await stakeSpl(
          connection,
          wallet as AnchorWallet,
          rawAmount,
          idl as SoonVault,
          idl.address,
          new PublicKey(currentNetwork.authorityPublicKey),
          tokenMint
        );
      }

      console.log("tx after");
      if (tx) {
        const latestBlockHash = await connection.getLatestBlockhash();
        tx.lastValidBlockHeight = latestBlockHash.lastValidBlockHeight;
        const signature = await sendTransaction(tx, connection, {skipPreflight: true});
        console.log(`Transaction sent: ${signature}`);

        // Refresh balances after successful transaction
        setTimeout(() => {
          fetchBalances();
        }, 2000);
      }
    } catch (error) {
      console.error("Error staking:", error);
      setError(
        error instanceof Error ? error.message : "Failed to stake tokens"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0A0F1C] rounded-2xl p-6 border-4 border-green-400">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <TokenData
        symbol={tokenSymbol}
        amount={stakeAmount}
        setAmount={setStakeAmount}
        value={stakeValue}
        setValue={setStakeValue}
        currentPrice={currentPrice}
        balance={balance}
        selectedToken={selectedToken}
        setSelectedToken={setSelectedToken}
        supportedTokens={supportedTokens}
      />

      <StakePercentageButtons
        balance={balance}
        setStakeAmount={setStakeAmount}
      />

      <div className="mt-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">
            Available Balance
          </span>
          <span className="font-bold ml-1">
            {balance.toFixed(4)}{" "}
            {selectedToken.symbol}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">
            Staked Amount
          </span>
          <span className="font-bold ml-1">
            {stakedAmount.toFixed(4)}{" "}
            {selectedToken.symbol}
          </span>
        </div>
      </div>

      <MemeButton
        className="w-full mt-6 bg-green-400 hover:bg-green-300 border-green-600"
        onClick={handleStakeToken}
        disabled={loading}
      >
        {loading ? "Processing..." : "Stake tokens"}
      </MemeButton>
    </div>
  );
}
