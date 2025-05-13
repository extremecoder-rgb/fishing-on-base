export function initUI() {
    return {
       
        showScreen(screenId) {
            console.log('Showing screen:', screenId);
           
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            
           
            const screen = document.getElementById(`${screenId}Screen`);
            if (screen) {
                screen.classList.add('active');
                console.log('Screen shown:', screenId);
            } else {
                console.error('Screen not found:', screenId);
            }
        },
        
      
        updateWalletInfo(account) {
            const walletInfo = document.getElementById('wallet-info');
            if (walletInfo) {
                const shortAddress = `${account.slice(0, 6)}...${account.slice(-4)}`;
                walletInfo.textContent = shortAddress;
            }
        },
        
       
        async updateInventory() {
            const inventoryContainer = document.getElementById('inventoryContainer');
            if (!inventoryContainer) return;
            
            try {
              
                const fishNFTs = await this.getUserFishNFTs();
                
             
                inventoryContainer.innerHTML = '';
                
                
                fishNFTs.forEach(fish => {
                    const fishElement = this.createFishElement(fish);
                    inventoryContainer.appendChild(fishElement);
                });
                
            } catch (error) {
                console.error('Failed to update inventory:', error);
                this.showError('Failed to load inventory. Please try again.');
            }
        },
        
        async getUserFishNFTs() {
           
            return [];
        },
        
        createFishElement(fish) {
            const div = document.createElement('div');
            div.className = 'fish-item';
            div.innerHTML = `
                <img src="/assets/fish/${fish.type}.svg" alt="${fish.type} fish">
                <div class="fish-info">
                    <h3>${fish.type.charAt(0).toUpperCase() + fish.type.slice(1)} Fish</h3>
                    <p>Weight: ${fish.weight}kg</p>
                    <p>Length: ${fish.length}cm</p>
                    <p>Caught: ${new Date(fish.timestamp).toLocaleDateString()}</p>
                </div>
                <button class="sell-btn" data-id="${fish.id}">Sell</button>
            `;
            
           
            const sellBtn = div.querySelector('.sell-btn');
            sellBtn.addEventListener('click', () => this.handleSellFish(fish));
            
            return div;
        },
        
        // Marketplace
        async updateMarketplace() {
            const marketplaceContainer = document.getElementById('marketplaceContainer');
            if (!marketplaceContainer) return;
            
            try {
                
                const listedFish = await this.getListedFish();
                
              
                marketplaceContainer.innerHTML = '';
                
                
                listedFish.forEach(fish => {
                    const fishElement = this.createMarketplaceFishElement(fish);
                    marketplaceContainer.appendChild(fishElement);
                });
                
            } catch (error) {
                console.error('Failed to update marketplace:', error);
                this.showError('Failed to load marketplace. Please try again.');
            }
        },
        
        async getListedFish() {
            // TODO: Implement marketplace listing fetching from smart contract
            return [];
        },
        
        createMarketplaceFishElement(fish) {
            const div = document.createElement('div');
            div.className = 'marketplace-item';
            div.innerHTML = `
                <img src="/assets/fish/${fish.type}.svg" alt="${fish.type} fish">
                <div class="fish-info">
                    <h3>${fish.type.charAt(0).toUpperCase() + fish.type.slice(1)} Fish</h3>
                    <p>Weight: ${fish.weight}kg</p>
                    <p>Length: ${fish.length}cm</p>
                    <p>Seller: ${fish.seller.slice(0, 6)}...${fish.seller.slice(-4)}</p>
                    <p class="price">${fish.price} ETH</p>
                </div>
                <button class="buy-btn" data-id="${fish.id}">Buy</button>
            `;
            
            // Add buy button handler
            const buyBtn = div.querySelector('.buy-btn');
            buyBtn.addEventListener('click', () => this.handleBuyFish(fish));
            
            return div;
        },
        
       
        showNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        },
        
        showError(message) {
            const error = document.createElement('div');
            error.className = 'error-notification';
            error.textContent = message;
            
            document.body.appendChild(error);
            
            
            setTimeout(() => {
                error.remove();
            }, 5000);
        },
        
        
        async handleSellFish(fish) {
            try {
                // TODO: Implement fish selling logic
                this.showNotification('Fish listed for sale!');
                await this.updateInventory();
                
            } catch (error) {
                console.error('Failed to sell fish:', error);
                this.showError('Failed to sell fish. Please try again.');
            }
        },
        
        // Fish buying
        async handleBuyFish(fish) {
            try {
                // TODO: Implement fish buying logic
                this.showNotification('Fish purchased successfully!');
                await this.updateMarketplace();
                await this.updateInventory();
                
            } catch (error) {
                console.error('Failed to buy fish:', error);
                this.showError('Failed to buy fish. Please try again.');
            }
        }
    };
} 