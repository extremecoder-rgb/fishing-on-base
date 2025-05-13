
import { Game } from './game.js';
import { initWeb3, connectWallet, getCurrentAccount } from './web3.js';
import { initContracts } from './contracts.js';
import { initUI } from './ui.js';


function debugLog(message) {
  console.log(`[Main Debug] ${message}`);
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.textContent = message;
  }
}


let game = null;
let currentScreen = 'welcome';
let web3Instance = null;
let elements = null;
let screens = null;


function initializeElements() {
  debugLog('Initializing DOM elements...');
  
  
  screens = {
    welcome: document.getElementById('welcomeScreen'),
    game: document.getElementById('gameScreen'),
    inventory: document.getElementById('inventoryScreen'),
    marketplace: document.getElementById('marketplaceScreen')
  };

  
  elements = {
    connectWalletBtn: document.getElementById('connectWalletBtn'),
    walletInfo: document.getElementById('wallet-info'),
    inventoryBtn: document.getElementById('inventoryBtn'),
    marketplaceBtn: document.getElementById('marketplaceBtn'),
    backToGameBtn: document.getElementById('backToGameBtn'),
    backFromMarketBtn: document.getElementById('backFromMarketBtn'),
    gameCanvas: document.getElementById('gameCanvas'),
    inventoryContainer: document.getElementById('inventoryContainer'),
    marketplaceContainer: document.getElementById('marketplaceContainer')
  };

  
  debugElements();

  
  const missingElements = Object.entries(elements)
    .filter(([key, element]) => !element)
    .map(([key]) => key);
  
  if (missingElements.length > 0) {
    throw new Error(`Missing required elements: ${missingElements.join(', ')}`);
  }
}


function debugElements() {
  debugLog('Checking DOM elements...');
  Object.entries(elements).forEach(([key, element]) => {
    debugLog(`${key}: ${element ? 'Found' : 'Missing'}`);
  });
  Object.entries(screens).forEach(([key, screen]) => {
    debugLog(`${key} screen: ${screen ? 'Found' : 'Missing'}`);
  });
}


function showScreen(screenId) {
  debugLog(`Switching to screen: ${screenId}`);
  Object.values(screens).forEach(screen => {
    if (screen) {
      screen.classList.remove('active');
    }
  });
  if (screens[screenId]) {
    screens[screenId].classList.add('active');
  }
  currentScreen = screenId;

  
  const welcomeMusic = document.getElementById('welcomeMusic');
  if (welcomeMusic) {
    if (screenId === 'welcome') {
      welcomeMusic.currentTime = 0;
      welcomeMusic.play();
    } else {
      welcomeMusic.pause();
      welcomeMusic.currentTime = 0;
    }
  }
}


async function initGame(account, contracts) {
  debugLog('Initializing game...');
  try {
   
    const container = elements.gameCanvas.parentElement;
    elements.gameCanvas.width = container.clientWidth;
    elements.gameCanvas.height = container.clientHeight;

   
    game = new Game(elements.gameCanvas, contracts, account);
    
    // Load game assets
    const assetsLoaded = await game.loadAssets();
    if (!assetsLoaded) {
      throw new Error('Failed to load game assets');
    }
    
  
    game.start();
    
   
    showScreen('game');
    
   
    elements.walletInfo.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
    
    debugLog('Game initialized successfully');
  } catch (error) {
    debugLog(`Game initialization error: ${error.message}`);
    console.error('Failed to initialize game:', error);
    alert('Failed to initialize game. Please refresh the page.');
  }
}


function handleCaughtFish(fishData) {
  const template = document.getElementById('fishCardTemplate');
  const fishCard = template.content.cloneNode(true);

 
  fishCard.querySelector('.fish-type').textContent = fishData.type;
  fishCard.querySelector('.fish-weight').textContent = `Weight: ${fishData.weight}kg`;
  fishCard.querySelector('.fish-length').textContent = `Length: ${fishData.length}cm`;
  fishCard.querySelector('.fish-timestamp').textContent = new Date().toLocaleString();
  fishCard.querySelector('.fish-location').textContent = fishData.location;

  
  const fishImage = fishCard.querySelector('.fish-image');
  fishImage.style.backgroundImage = `url(./assets/fish/${fishData.type.toLowerCase()}.svg)`;

  elements.inventoryContainer.appendChild(fishCard);
}


async function setupEventListeners(web3) {
  debugLog('Setting up event listeners...');
  web3Instance = web3;
  
 
  if (elements.connectWalletBtn) {
    elements.connectWalletBtn.addEventListener('click', async () => {
      debugLog('Connect wallet button clicked');
      try {
       
        elements.connectWalletBtn.disabled = true;
        elements.connectWalletBtn.textContent = 'Connecting...';

        debugLog('Connecting wallet...');
        const account = await connectWallet();
        debugLog(`Wallet connected: ${account}`);
        
       
        debugLog('Initializing Web3...');
        const web3 = await initWeb3();
        if (!web3 || !web3.eth) {
          throw new Error('Failed to initialize Web3');
        }
        
        debugLog('Initializing contracts...');
        const contracts = await initContracts(web3);
        
        debugLog('Initializing game...');
        await initGame(account, contracts);
      } catch (error) {
        debugLog(`Error: ${error.message}`);
        console.error('Failed to connect wallet:', error);
        alert(error.message || 'Failed to connect wallet. Please try again.');
      } finally {
        
        elements.connectWalletBtn.disabled = false;
        elements.connectWalletBtn.textContent = 'Connect Wallet';
      }
    });
  }

 
  if (elements.inventoryBtn) {
    elements.inventoryBtn.addEventListener('click', () => showScreen('inventory'));
  }
  if (elements.marketplaceBtn) {
    elements.marketplaceBtn.addEventListener('click', () => showScreen('marketplace'));
  }
  if (elements.backToGameBtn) {
    elements.backToGameBtn.addEventListener('click', () => showScreen('game'));
  }
  if (elements.backFromMarketBtn) {
    elements.backFromMarketBtn.addEventListener('click', () => showScreen('game'));
  }

 
  window.addEventListener('resize', () => {
    if (game && elements.gameCanvas) {
      const container = elements.gameCanvas.parentElement;
      elements.gameCanvas.width = container.clientWidth;
      elements.gameCanvas.height = container.clientHeight;
      game.resize();
    }
  });
}


async function init() {
  debugLog('Initializing application...');
  try {
    
    initializeElements();

    debugLog('Initializing Web3...');
    const web3 = await initWeb3();
    
    debugLog('Setting up event listeners...');
    await setupEventListeners(web3);
    
    debugLog('Showing welcome screen...');
    showScreen('welcome');
  } catch (error) {
    debugLog(`Initialization error: ${error.message}`);
    console.error('Failed to initialize application:', error);
    alert('Failed to initialize application. Please refresh the page.');
  }
}


function initializeDebugInfo() {
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.style.display = 'block';
    debugInfo.style.position = 'fixed';
    debugInfo.style.bottom = '10px';
    debugInfo.style.left = '10px';
    debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debugInfo.style.color = 'white';
    debugInfo.style.padding = '10px';
    debugInfo.style.borderRadius = '5px';
    debugInfo.style.fontFamily = 'monospace';
    debugInfo.style.zIndex = '1000';
  }
}


window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Global error:', msg, 'at', url, ':', lineNo);
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.innerHTML += `<div>Error: ${msg}</div>`;
  }
  return false;
};


debugLog('Waiting for DOM to load...');
document.addEventListener('DOMContentLoaded', () => {
  initializeDebugInfo();
  init();
});

class App {
    constructor() {
        this.game = null;
        this.contracts = null;
        this.account = null;
        this.ui = null;
        this.web3 = null;
        
       
        this.init();
    }
    
    async init() {
        try {
         
            this.ui = initUI();
            
           
            debugLog('Initializing Web3...');
            this.web3 = await initWeb3();
            if (!this.web3 || !this.web3.eth) {
                throw new Error('Failed to initialize Web3');
            }
            
           
            debugLog('Initializing contracts...');
            this.contracts = await initContracts(this.web3);
            
           
            this.setupEventListeners();
            
          
            debugLog('Showing welcome screen...');
            this.ui.showScreen('welcome');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.ui.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    setupEventListeners() {
       
        document.getElementById('connectWalletBtn').addEventListener('click', async () => {
            try {
                
                const connectBtn = document.getElementById('connectWalletBtn');
                connectBtn.disabled = true;
                connectBtn.textContent = 'Connecting...';

                debugLog('Connecting wallet...');
                this.account = await connectWallet();
                debugLog(`Wallet connected: ${this.account}`);
                
              
                await this.initGame();
                
             
                this.ui.updateWalletInfo(this.account);
                debugLog('Showing game screen...');
                this.ui.showScreen('game');
            } catch (error) {
                console.error('Failed to connect wallet:', error);
                this.ui.showError('Failed to connect wallet. Please try again.');
            } finally {
               
                const connectBtn = document.getElementById('connectWalletBtn');
                connectBtn.disabled = false;
                connectBtn.textContent = 'Connect Wallet';
            }
        });
        
       
        document.getElementById('inventoryBtn').addEventListener('click', () => this.showInventory());
        document.getElementById('marketplaceBtn').addEventListener('click', () => this.showMarketplace());
        document.getElementById('backToGameBtn').addEventListener('click', () => this.showGame());
        document.getElementById('backFromMarketBtn').addEventListener('click', () => this.showGame());
        
      
        window.addEventListener('fishCaught', (event) => this.handleFishCaught(event.detail));
    }
    
    async initGame() {
        debugLog('Initializing game...');
        const canvas = document.getElementById('gameCanvas');
        this.game = new Game(canvas, this.contracts, this.account);
        
      
        const assetsLoaded = await this.game.loadAssets();
        if (!assetsLoaded) {
            throw new Error('Failed to load game assets');
        }
        
      
        this.game.resize();
        window.addEventListener('resize', () => this.game.resize());
        
    
        debugLog('Starting game...');
        this.game.start();
    }
    
    showInventory() {
        debugLog('Showing inventory screen...');
        this.ui.showScreen('inventory');
        if (this.game) {
            this.game.stop();
        }
    }
    
    showMarketplace() {
        debugLog('Showing marketplace screen...');
        this.ui.showScreen('marketplace');
        if (this.game) {
            this.game.stop();
        }
    }
    
    showGame() {
        debugLog('Showing game screen...');
        this.ui.showScreen('game');
        if (this.game) {
            this.game.start();
        }
    }
    
    async handleFishCaught(fishData) {
       
        await this.ui.updateInventory();
        
       
        this.ui.showNotification(`Caught a ${fishData.type} fish! Weight: ${fishData.weight}kg, Length: ${fishData.length}cm`);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new App();
});