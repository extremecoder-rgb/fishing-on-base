import Web3 from 'web3';



function debugLog(message) {
  console.log(`[Web3 Debug] ${message}`);
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.textContent = message;
  }
}


export async function initWeb3() {
  try {
    debugLog('Initializing Web3...');
    let provider;
    
    
    if (window.coinbaseWalletExtension) {
      debugLog('Coinbase Wallet detected');
      provider = window.coinbaseWalletExtension;
    } else if (window.ethereum) {
      debugLog('MetaMask detected');
      provider = window.ethereum;
    } else {
      debugLog('No wallet detected');
      throw new Error('No Ethereum provider detected. Please install Coinbase Wallet or MetaMask.');
    }

   
    debugLog('Creating Web3 instance...');
    const web3 = new Web3(provider);

    
    debugLog('Requesting account access...');
    await provider.request({ method: 'eth_requestAccounts' });

   
    debugLog('Checking network...');
    const chainId = await web3.eth.getChainId();
    debugLog(`Current chainId: ${chainId}`);
    
    // Base Sepolia testnet chainId is 84532
    // Base mainnet chainId is 8453
    const baseSepoliaChainId = 84532;
    const baseMainnetChainId = 8453;
      
   
    if (chainId !== baseSepoliaChainId && chainId !== baseMainnetChainId) {
      debugLog('Switching to Base network...');
      try {
        
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: web3.utils.toHex(baseSepoliaChainId) }],
        });
      } catch (switchError) {
        debugLog(`Switch error: ${switchError.message}`);
       
        if (switchError.code === 4902) {
          try {
            debugLog('Adding Base network...');
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: web3.utils.toHex(baseSepoliaChainId),
                  chainName: 'Base Sepolia Testnet',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia.base.org'],
                  blockExplorerUrls: ['https://sepolia.basescan.org'],
                },
              ],
            });
          } catch (addError) {
            debugLog(`Add network error: ${addError.message}`);
            throw new Error('Please add the Base network to your wallet manually.');
          }
        } else {
          throw new Error('Failed to switch to the Base network. Please try manually.');
        }
      }
    }
      
    debugLog('Web3 initialized successfully');
    return web3;
  } catch (error) {
    debugLog(`Error: ${error.message}`);
    console.error('Error initializing Web3:', error);
    throw error;
  }
}


export async function getCurrentAccount(web3) {
  try {
    const accounts = await web3.eth.getAccounts();
    return accounts[0];
  } catch (error) {
    console.error('Error getting current account:', error);
    throw error;
  }
}


export function formatAddress(address) {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}


export function weiToEth(wei, web3) {
  return web3.utils.fromWei(wei.toString(), 'ether');
}


export function ethToWei(eth, web3) {
  return web3.utils.toWei(eth.toString(), 'ether');
}


export async function connectWallet() {
  try {
    debugLog('Connecting wallet...');
    if (!window.ethereum && !window.coinbaseWalletExtension) {
      throw new Error('No Ethereum wallet detected. Please install MetaMask or Coinbase Wallet.');
    }

    const web3 = await initWeb3();
    debugLog('Getting accounts...');
    const accounts = await web3.eth.getAccounts();
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please connect your wallet.');
    }

    const account = accounts[0];
    debugLog(`Connected to: ${formatAddress(account)}`);
    return account;
  } catch (error) {
    debugLog(`Connection error: ${error.message}`);
    console.error('Error connecting wallet:', error);
    throw error;
  }
}


export async function hasSufficientBalance(web3, account, amount) {
  try {
    const balance = await web3.eth.getBalance(account);
    return BigInt(balance) >= BigInt(amount);
  } catch (error) {
    console.error('Error checking balance:', error);
    return false;
  }
}


export async function estimateGas(transaction, web3) {
  try {
    const gasEstimate = await web3.eth.estimateGas(transaction);
    
    return Math.ceil(gasEstimate * 1.2);
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
}