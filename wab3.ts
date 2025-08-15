import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Network configurations
const NETWORKS = {
  mintme: {
    chainId: "0x6000", // 24576 in hex
    chainName: "MintMe.com Coin",
    nativeCurrency: {
      name: "MintMe.com Coin",
      symbol: "MINTME",
      decimals: 18,
    },
    rpcUrls: ["https://node1.mintme.com"],
    blockExplorerUrls: ["https://www.mintme.com/explorer"],
  },
  cronos: {
    chainId: "0x19", // 25 in hex
    chainName: "Cronos Mainnet Beta",
    nativeCurrency: {
      name: "Cronos",
      symbol: "CRO",
      decimals: 18,
    },
    rpcUrls: ["https://evm.cronos.org"],
    blockExplorerUrls: ["https://cronoscan.com"],
  },
  bsc: {
    chainId: "0x38", // 56 in hex
    chainName: "BNB Smart Chain",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: ["https://bsc-dataseed.binance.org"],
    blockExplorerUrls: ["https://bscscan.com"],
  },
};

// T2PRAWANTA token contract address
const T2P_TOKEN_ADDRESS = "0x318059eb1254ad209bcc0950451197333cef650c";

// ERC20 ABI (simplified)
const ERC20_ABI = [{"constant":false,"inputs":[{"name":"_token","type":"address"},{"name":"_index","type":"uint32"}],"name":"unregisterConverter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"tokens","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"},{"name":"_index","type":"uint32"}],"name":"converterAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_converter","type":"address"}],"name":"tokenAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tokenCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"}],"name":"converterCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_token","type":"address"},{"name":"_converter","type":"address"}],"name":"registerConverter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_token","type":"address"},{"indexed":false,"name":"_address","type":"address"}],"name":"ConverterAddition","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_token","type":"address"},{"indexed":false,"name":"_address","type":"address"}],"name":"ConverterRemoval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_prevOwner","type":"address"},{"indexed":true,"name":"_newOwner","type":"address"}],"name":"OwnerUpdate","type":"event"}]
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error("No crypto wallet found. Please install MetaMask or another Web3 wallet.");
  }

  try {
    await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    return address;
  } catch (error: any) {
    throw new Error(error.message || "Failed to connect wallet");
  }
}

export async function disconnectWallet(): Promise<void> {
  // MetaMask doesn't have a disconnect method, so we'll just clear local state
  // The actual disconnection happens in the component state
  return Promise.resolve();
}

export async function getAccount(): Promise<string | null> {
  if (!window.ethereum) return null;

  try {
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });
    return accounts[0] || null;
  } catch (error) {
    console.error("Error getting account:", error);
    return null;
  }
}

export async function switchNetwork(networkId: string): Promise<void> {
  if (!window.ethereum) {
    throw new Error("No crypto wallet found");
  }

  const network = NETWORKS[networkId as keyof typeof NETWORKS];
  if (!network) {
    throw new Error("Unsupported network");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.chainId }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [network],
        });
      } catch (addError) {
        throw new Error("Failed to add network to wallet");
      }
    } else {
      throw new Error("Failed to switch network");
    }
  }
}

export async function getTokenBalance(address: string, networkId: string): Promise<string> {
  try {
    // For demo purposes, return mock balance
    // In production, you would query the actual contract
    const mockBalances = {
      mintme: "1500.0",
      cronos: "750.0",
      bsc: "2200.0",
    };

    return mockBalances[networkId as keyof typeof mockBalances] || "0.0";
  } catch (error) {
    console.error("Error getting token balance:", error);
    return "0.0";
  }
}

export async function executeBridge(
  amount: string,
  fromNetwork: string,
  toNetwork: string,
  fromAddress: string
): Promise<string> {
  if (!window.ethereum) {
    throw new Error("No crypto wallet found");
  }

  try {
    // Switch to source network if needed
    await switchNetwork(fromNetwork);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // For demo purposes, create a mock transaction hash
    // In production, this would execute the actual bridge contract
    const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return mockTxHash;
  } catch (error: any) {
    throw new Error(error.message || "Failed to execute bridge transaction");
  }
}

export async function claimAirdrop(address: string, amount: string): Promise<string> {
  if (!window.ethereum) {
    throw new Error("No crypto wallet found");
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // For demo purposes, create a mock transaction hash
    // In production, this would execute the actual airdrop contract
    const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    return mockTxHash;
  } catch (error: any) {
    throw new Error(error.message || "Failed to claim airdrop");
  }
}
