import Web3 from 'web3';
// Web3 integration for the Retro Fishing Game

// Debug logging function
function debugLog(message) {
  console.log(`[Web3 Debug] ${message}`);
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.textContent = message;
  }
}

/**
 * Initialize Web3 and connect to the Base network
 * @returns {Object} Web3 instance
 */
export async function initWeb3() {
  try {
    debugLog('Initializing Web3...');
    let provider;
    
    // Prefer Coinbase Wallet if available
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

    // Create a new instance of Web3
    debugLog('Creating Web3 instance...');
    const web3 = new Web3(provider);

    // Request account access if needed
    debugLog('Requesting account access...');
    await provider.request({ method: 'eth_requestAccounts' });

    // Check if connected to Base network
    debugLog('Checking network...');
    const chainId = await web3.eth.getChainId();
    debugLog(`Current chainId: ${chainId}`);
    
    // Base Sepolia testnet chainId is 84532
    // Base mainnet chainId is 8453
    const baseSepoliaChainId = 84532;
    const baseMainnetChainId = 8453;
      
    // If not on Base network, prompt to switch
    if (chainId !== baseSepoliaChainId && chainId !== baseMainnetChainId) {
      debugLog('Switching to Base network...');
      try {
        // Try to switch to Base Sepolia testnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: web3.utils.toHex(baseSepoliaChainId) }],
        });
      } catch (switchError) {
        debugLog(`Switch error: ${switchError.message}`);
        // This error code indicates that the chain has not been added to MetaMask
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

/**
 * Get the current account
 * @param {Object} web3 - Web3 instance
 * @returns {string} Current account address
 */
export async function getCurrentAccount(web3) {
  try {
    const accounts = await web3.eth.getAccounts();
    return accounts[0];
  } catch (error) {
    console.error('Error getting current account:', error);
    throw error;
  }
}

/**
 * Format an address to a shortened version
 * @param {string} address - Ethereum address
 * @returns {string} Shortened address
 */
export function formatAddress(address) {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Convert wei to ETH
 * @param {string|number} wei - Amount in wei
 * @param {Object} web3 - Web3 instance
 * @returns {string} Amount in ETH
 */
export function weiToEth(wei, web3) {
  return web3.utils.fromWei(wei.toString(), 'ether');
}

/**
 * Convert ETH to wei
 * @param {string|number} eth - Amount in ETH
 * @param {Object} web3 - Web3 instance
 * @returns {string} Amount in wei
 */
export function ethToWei(eth, web3) {
  return web3.utils.toWei(eth.toString(), 'ether');
}

/**
 * Connect wallet and return Web3 instance
 * @returns {Object} Web3 instance
 */
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

/**
 * Check if the user has sufficient balance for a transaction
 * @param {Object} web3 - Web3 instance
 * @param {string} account - User's account address
 * @param {string|number} amount - Amount in wei to check against
 * @returns {boolean} True if sufficient balance
 */
export async function hasSufficientBalance(web3, account, amount) {
  try {
    const balance = await web3.eth.getBalance(account);
    return BigInt(balance) >= BigInt(amount);
  } catch (error) {
    console.error('Error checking balance:', error);
    return false;
  }
}

/**
 * Estimate gas for a transaction
 * @param {Object} transaction - Transaction object
 * @param {Object} web3 - Web3 instance
 * @returns {number} Estimated gas
 */
export async function estimateGas(transaction, web3) {
  try {
    const gasEstimate = await web3.eth.estimateGas(transaction);
    // Add a 20% buffer to the gas estimate
    return Math.ceil(gasEstimate * 1.2);
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
}