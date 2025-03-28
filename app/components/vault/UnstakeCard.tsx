'use client';

import { MemeButton } from '../ui/MemeButton';
import StakePercentageButtons from './StakePercentageButtons';
import TokenData from './TokenData';
import {
  useWallet,
  useAnchorWallet,
  AnchorWallet,
} from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react"
import { unstake, getUserNativeStaked, getUserSplBalance } from "@/lib/program";
import { Connection, PublicKey } from "@solana/web3.js";
import useNetworkStore from "@/store/useNetworkStore";

interface UnstakeCardProps {
  tokenSymbol: string;
  currentPrice: number;
  selectedToken: { symbol: string; mint: string };
  setSelectedToken: (token: { symbol: string; mint: string }) => void;
  supportedTokens: { symbol: string; mint: string }[];
}

export default function UnstakeCard({ tokenSymbol, currentPrice, selectedToken, setSelectedToken, supportedTokens }: UnstakeCardProps) {
  const { sendTransaction } = useWallet();
  const { currentNetwork } = useNetworkStore();
  const wallet = useAnchorWallet();
  const [unstakeAmount, setUnstakeAmount] = useState(0);
  const [unstakeValue, setUnstakeValue] = useState(0);
  const [staked, setStaked] = useState<number | null>(null);
  const connection = new Connection(currentNetwork.rpcUrl, "confirmed");

  useEffect(() => {
      if (!wallet) return;
  
      const connection = new Connection(currentNetwork.rpcUrl, "confirmed");
  
      if (selectedToken.symbol === "ETH") {
        getUserNativeStaked(
          connection,
          wallet as AnchorWallet,
          currentNetwork.idl,
          currentNetwork.contractAddress,
          new PublicKey(currentNetwork.authorityPublicKey)
        )
        .then(setStaked);
      } else {
        getUserSplBalance(connection, wallet, selectedToken.mint)
        .then(setStaked);
      }
    }, [wallet, currentNetwork, selectedToken]);

  return (
    <div className="bg-white dark:bg-[#0A0F1C] rounded-2xl p-6 border-4 border-red-400">
      <TokenData
        symbol={tokenSymbol}
        amount={unstakeAmount}
        setAmount={setUnstakeAmount}
        value={unstakeValue}
        setValue={setUnstakeValue}
        currentPrice={currentPrice}
        balance={staked}
        selectedToken={selectedToken}
        setSelectedToken={setSelectedToken}
        supportedTokens={supportedTokens}
      />
      
      <StakePercentageButtons 
        balance={staked} 
        setStakeAmount={setUnstakeAmount} 
      />
      
      <div className="mt-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Current Price</span>
          <span className="font-bold">1 {tokenSymbol} = {currentPrice.toLocaleString()} USDC</span>
        </div>
      </div>

      <MemeButton
        className="w-full mt-6 bg-red-400 hover:bg-red-300 border-red-600"
        onClick={async () => {
          if (!wallet) {
            return;
          }

          const tx = await unstake(
              connection,
              wallet as AnchorWallet,
              unstakeAmount,
              currentNetwork.idl,
              currentNetwork.contractAddress,
              new PublicKey(currentNetwork.authorityPublicKey)
          );
          await sendTransaction(tx, connection)
            .then((e: unknown) => {
                // showSnackbar(`your tx hash is ${e}`, "success");
            })
            .catch((e: unknown) => {
                // showSnackbar(`${e}`, "error");
            })
            .finally(() => {
                // setLoading(false);
            });
      }}
      >
        Unstake tokens
      </MemeButton>
    </div>
  );
}