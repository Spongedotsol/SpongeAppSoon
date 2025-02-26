import dynamic from "next/dynamic";
import Script from "next/script";
import { Metadata } from "next";

const Homepage = dynamic(() => import("./components/Home"), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});

export const metadata: Metadata = {
  title: "Sponge",
  description: "Stake SOL, Get Exposure from Bluechips",
  icons: {
    icon: '/favicon.ico',
  },
}

async function DappInterface () {

  return (
    <div>
      <Homepage/>
      {/* <SimpleSnackbar /> */}
      <Script src="https://terminal.jup.ag/main-v1.js" data-preload />
    </div>
  )
}

export default DappInterface;