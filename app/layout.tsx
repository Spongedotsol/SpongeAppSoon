import "./globals.css";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./components/ThemeProvider";
import dynamic from "next/dynamic";

const WalletContextProvider = dynamic(
  () => import("./components/ui/walletContextProvider"),
  { 
    ssr: false,
    loading: () => <div>Loading wallet...</div>
  }
);

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sponge",
  description: "Stake SOL, Get Exposure from Bluechips",
  icons: {
    icon: "/sponge.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="min-h-screen bg-yellow-50 dark:bg-[#030711]">
            <Navbar />
            <WalletContextProvider>{children}</WalletContextProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
