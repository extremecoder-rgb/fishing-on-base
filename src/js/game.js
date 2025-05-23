
import { startFishing } from './contracts.js';


const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const WATER_LEVEL = 400;
const HOOK_SPEED = 3;
const FISH_SPAWN_RATE = 0.01; 
const BITE_DURATION = 1500; 
const REEL_SPEED = 2;
const MAX_TENSION = 100;
const TENSION_INCREASE_RATE = 0.5;
const TENSION_DECREASE_RATE = 0.3;


const FISH_TYPES = [
  { name: 'Common', probability: 0.6, minSize: 10, maxSize: 30, speed: 1.5, color: '#6a9ec0' },
  { name: 'Rare', probability: 0.25, minSize: 20, maxSize: 40, speed: 2, color: '#4db6ac' },
  { name: 'Epic', probability: 0.12, minSize: 30, maxSize: 50, speed: 2.5, color: '#9575cd' },
  { name: 'Legendary', probability: 0.03, minSize: 40, maxSize: 60, speed: 3, color: '#ffb74d' }
];


const GAME_STATES = {
  IDLE: 'idle',
  CASTING: 'casting',
  WAITING: 'waiting',
  BITE: 'bite',
  REELING: 'reeling',
  CAUGHT: 'caught',
  FAILED: 'failed'
};


const TIME_OF_DAY = {
  MORNING: { name: 'Morning', skyColor: '#87ceeb', biteRateModifier: 1.2 },
  NOON: { name: 'Noon', skyColor: '#4a90e2', biteRateModifier: 1.0 },
  EVENING: { name: 'Evening', skyColor: '#f47b42', biteRateModifier: 1.5 },
  NIGHT: { name: 'Night', skyColor: '#1a237e', biteRateModifier: 0.8 }
};


const WEATHER_TYPES = {
  CLEAR: { name: 'Clear', biteRateModifier: 1.0 },
  CLOUDY: { name: 'Cloudy', biteRateModifier: 0.9 },
  RAINY: { name: 'Rainy', biteRateModifier: 1.3 },
  STORMY: { name: 'Stormy', biteRateModifier: 0.7 }
};


const LOCATIONS = [
  { name: 'Pixel Pond', background: 'pond_bg.png', fishModifier: 1.0 },
  { name: 'Retro River', background: 'river_bg.png', fishModifier: 1.2 },
  { name: 'Blockchain Bay', background: 'bay_bg.png', fishModifier: 1.5 },
  { name: 'NFT Lake', background: 'lake_bg.png', fishModifier: 2.0 }
];


export class Game {
  constructor(canvas, contracts, account) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.contracts = contracts;
    this.account = account;
    
   
    this.state = GAME_STATES.IDLE;
    this.score = 0;
    this.fish = [];
    this.fishingRod = null;
    this.hook = { x: 0, y: 0 };
    this.caughtFish = null;
    
    
    this.assets = {
      background: null,
      fishingRod: null,
      fish: {
        common: null,
        rare: null,
        legendary: null
      }
    };
    
    
    this.fishTypes = {
      common: {
        probability: 0.7,
        value: 1,
        speed: 2,
        color: '#4CAF50'
      },
      rare: {
        probability: 0.25,
        value: 5,
        speed: 3,
        color: '#9C27B0'
      },
      legendary: {
        probability: 0.05,
        value: 20,
        speed: 4,
        color: '#FFD700'
      }
    };
    
    
    this.update = this.update.bind(this);
    this.draw = this.draw.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.canvas.addEventListener('click', this.handleClick);
  }
  
  async loadAssets() {
    try {
      
      this.assets.background = await this.loadImage('/assets/backgrounds/pond_bg.svg');
      
    
      this.assets.fishingRod = await this.loadImage('/assets/fishing_rod.svg');
      
      
      this.assets.fish.common = await this.loadImage('/assets/fish/common.svg');
      this.assets.fish.rare = await this.loadImage('/assets/fish/rare.svg');
      this.assets.fish.legendary = await this.loadImage('/assets/fish/legendary.svg');
      
      return true;
    } catch (error) {
      console.error('Failed to load assets:', error);
      return false;
    }
  }
  
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  
  resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    
   
    const gameUI = document.getElementById('game-ui');
    if (gameUI) {
      gameUI.style.width = `${this.canvas.width}px`;
      gameUI.style.height = `${this.canvas.height}px`;
    }
  }
  
  start() {
    if (this.state === GAME_STATES.IDLE) {
      this.state = GAME_STATES.CASTING;
      this.spawnFish();
      this.gameLoop();
    }
  }
  
  spawnFish() {
    const numFish = Math.floor(Math.random() * 3) + 2; 
    
    for (let i = 0; i < numFish; i++) {
      const type = this.getRandomFishType();
      const fish = {
        type,
        x: Math.random() * this.canvas.width,
        y: Math.random() * (this.canvas.height * 0.6) + this.canvas.height * 0.2,
        speed: this.fishTypes[type].speed,
        direction: Math.random() > 0.5 ? 1 : -1,
        width: 100,
        height: 50
      };
      this.fish.push(fish);
    }
  }
  
  getRandomFishType() {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [type, props] of Object.entries(this.fishTypes)) {
      cumulative += props.probability;
      if (rand <= cumulative) {
        return type;
      }
    }
    
    return 'common';
  }
  
  update() {
    if (this.state === GAME_STATES.CASTING) {
      
      this.fish.forEach(fish => {
        fish.x += fish.speed * fish.direction;
        
       
        if (fish.x < 0 || fish.x > this.canvas.width) {
          fish.direction *= -1;
        }
      });
      
      
      this.fish = this.fish.filter(fish => 
        fish.x > -fish.width && fish.x < this.canvas.width + fish.width
      );
      
      
      if (this.fish.length < 2) {
        this.spawnFish();
      }
    }
  }
  
  draw() {
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    
    if (this.assets.background) {
      this.ctx.drawImage(this.assets.background, 0, 0, this.canvas.width, this.canvas.height);
    }
    
   
    this.fish.forEach(fish => {
      const fishImage = this.assets.fish[fish.type];
      if (fishImage) {
        this.ctx.save();
        if (fish.direction < 0) {
          this.ctx.scale(-1, 1);
          this.ctx.drawImage(fishImage, -fish.x - fish.width, fish.y, fish.width, fish.height);
        } else {
          this.ctx.drawImage(fishImage, fish.x, fish.y, fish.width, fish.height);
        }
        this.ctx.restore();
      }
    });
    
    
    if (this.state === GAME_STATES.CASTING && this.assets.fishingRod) {
      this.ctx.drawImage(this.assets.fishingRod, this.canvas.width / 2 - 50, 0, 100, 200);
    }
  }
  
  gameLoop() {
    if (this.state === GAME_STATES.CASTING) {
      this.update();
      this.draw();
      requestAnimationFrame(this.gameLoop);
    }
  }
  
  async handleClick(event) {
    if (this.state !== GAME_STATES.CASTING) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    
    const clickedFish = this.fish.find(fish => {
      return x >= fish.x && x <= fish.x + fish.width &&
             y >= fish.y && y <= fish.y + fish.height;
    });
    
    if (clickedFish) {
      this.state = GAME_STATES.CAUGHT;
      this.caughtFish = clickedFish;
      
      
      this.fish = this.fish.filter(fish => fish !== clickedFish);
      
      
      await this.addToInventory(clickedFish);
      
      
      this.score += this.fishTypes[clickedFish.type].value;
      
      
      setTimeout(() => {
        this.state = GAME_STATES.CASTING;
        this.caughtFish = null;
        this.gameLoop();
      }, 1000);
    }
  }
  
  async addToInventory(fish) {
    try {
      console.log('Adding fish to inventory:', fish);
      
     
      const result = await this.contracts.fishingGameNFT.methods.startFishing(
        'Pixel Pond' 
      ).send({ from: this.account });
      
      console.log('Fish added to inventory:', result);
      
      
      const event = new CustomEvent('fishCaught', {
        detail: {
          type: fish.type,
          weight: (Math.random() * 5 + 1).toFixed(2), 
          length: Math.floor(Math.random() * 50 + 20), 
          location: 'Pixel Pond',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
      
      return true;
    } catch (error) {
      console.error('Failed to add fish to inventory:', error);
      throw error;
    }
  }
  
  stop() {
    this.state = GAME_STATES.IDLE;
  }
}