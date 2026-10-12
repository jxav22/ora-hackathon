"use client";

import { useEffect, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider as PrivyWagmiProvider } from "@privy-io/wagmi";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { ChatWidget } from "~~/components/ora/ChatWidget";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { AuthSessionSync } from "~~/hooks/useAuthSession";
import { privyConfig } from "~~/services/web3/privyConfig";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { isPrivyEnabled } from "~~/utils/auth/isPrivyEnabled";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="border-b border-border/60 bg-[var(--paper)]/80">
          <p className="container-page py-2 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground sm:tracking-[0.18em]">
            Sepolia testnet prototype · Demo assets · Not a production financial product · Lending via Aave V3
          </p>
        </div>
        <main className="relative flex flex-1 flex-col">{children}</main>
        <Footer />
      </div>
      <ChatWidget />
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const RainbowKitAppProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme()}
        >
          <ProgressBar height="3px" color="#2299dd" />
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

const PrivyAppProviders = ({ children }: { children: React.ReactNode }) => {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <PrivyProvider
      appId={appId}
      config={{
        ...privyConfig,
        appearance: {
          ...privyConfig.appearance,
          theme: mounted && isDarkMode ? "dark" : "light",
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PrivyWagmiProvider config={wagmiConfig}>
          <AuthSessionSync />
          <ProgressBar height="3px" color="#2299dd" />
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  if (isPrivyEnabled) {
    return <PrivyAppProviders>{children}</PrivyAppProviders>;
  }

  return <RainbowKitAppProviders>{children}</RainbowKitAppProviders>;
};
