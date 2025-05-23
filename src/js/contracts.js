
const CONTRACT_ADDRESSES = {
  
  '84532': {
    fishingGameNFT: '0x4A7Ff7f24f553ed5ec9df7f03893a71C7EC13893',
    fishMarketplace: '0x5ff1F6e18119Af6978D75a1aE21E4350050353af',
  },
  // Base mainnet (placeholder)
  '8453': {
    fishingGameNFT: '0x0000000000000000000000000000000000000000',
    fishMarketplace: '0x0000000000000000000000000000000000000000',
  }
};


async function loadContractABIs() {
  try {
    console.log('Loading contract ABIs...');
    
    
    const fishingGameResponse = await fetch('../abi/FishingGameNFT.json');
    if (!fishingGameResponse.ok) {
      throw new Error(`Failed to load FishingGameNFT ABI: ${fishingGameResponse.statusText}`);
    }
    
    const fishMarketplaceResponse = await fetch('../abi/FishMarketplace.json');
    if (!fishMarketplaceResponse.ok) {
      throw new Error(`Failed to load FishMarketplace ABI: ${fishMarketplaceResponse.statusText}`);
    }
    
   
    const fishingGameData = await fishingGameResponse.json();
    const fishMarketplaceData = await fishMarketplaceResponse.json();
    
    console.log('Contract ABIs loaded successfully');
    console.log('FishingGameNFT ABI:', fishingGameData.abi);
    console.log('FishMarketplace ABI:', fishMarketplaceData.abi);
    
    return {
      fishingGameABI: fishingGameData.abi,
      fishMarketplaceABI: fishMarketplaceData.abi
    };
  } catch (error) {
    console.error("Error loading contract ABIs:", error);
    throw new Error(`Failed to load contract ABIs: ${error.message}`);
  }
}


export async function initContracts(web3) {
  try {
    console.log('Initializing contracts...');
    
   
    if (!web3 || !web3.eth) {
      throw new Error('Invalid Web3 instance. Please ensure Web3 is properly initialized.');
    }
    
    const chainId = await web3.eth.getChainId();
    const chainIdString = chainId.toString();
    console.log('Connected to chain ID:', chainIdString);

    if (!CONTRACT_ADDRESSES[chainIdString]) {
      throw new Error(`Unsupported network: ${chainIdString}. Please switch to Base Sepolia.`);
    }

    const addresses = CONTRACT_ADDRESSES[chainIdString];
    console.log('Contract addresses:', addresses);
    
   
    const { fishingGameABI, fishMarketplaceABI } = await loadContractABIs();

  
    let fishingGameNFT;
    let fishMarketplace;

    try {
      fishingGameNFT = new web3.eth.Contract(
        fishingGameABI,
        addresses.fishingGameNFT
      );
      console.log('FishingGameNFT contract initialized:', fishingGameNFT);
    } catch (error) {
      console.error('Error initializing FishingGameNFT contract:', error);
      throw new Error('Failed to initialize FishingGameNFT contract');
    }

    try {
      fishMarketplace = new web3.eth.Contract(
        fishMarketplaceABI,
        addresses.fishMarketplace
      );
      console.log('FishMarketplace contract initialized:', fishMarketplace);
    } catch (error) {
      console.error('Error initializing FishMarketplace contract:', error);
      throw new Error('Failed to initialize FishMarketplace contract');
    }

   
    if (!fishingGameNFT.methods.startFishing) {
      throw new Error('FishingGameNFT contract is missing startFishing method');
    }
    if (!fishMarketplace.methods.listFish) {
      throw new Error('FishMarketplace contract is missing listFish method');
    }

    console.log("Contracts initialized successfully");

    return {
      fishingGameNFT,
      fishMarketplace
    };
  } catch (error) {
    console.error('Error initializing contracts:', error);
    throw new Error(`Failed to initialize contracts: ${error.message}`);
  }
}

export async function startFishing() {
  console.log("Starting fishing...");
 
}

