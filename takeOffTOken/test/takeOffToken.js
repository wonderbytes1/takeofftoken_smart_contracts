const { expect } = require("chai");
const { ethers } = require("hardhat");
const {BigNumber} = require ("ethers");


const address0 = "0x0000000000000000000000000000000000000000";
const tokenSupply = '500000000000000000000';

  //Declaring variables
  let TakeOffToken,takeOffToken, owner, addr1, addr2, rOwned, tOwnerBalance, rOwnerBalance, isExcludedFromFee , tTotal;   

describe("1- TakeOffToken's Contract's flow test", async() => {

    beforeEach( async()=>{
        [owner, addr1, addr2] = await ethers.getSigners();
    });

     //DEPLOYING CONTRACT
    it("should deploy the contract ", async()=>{
        TakeOffToken = await ethers.getContractFactory("TakeOffToken_test");
        takeOffToken = await TakeOffToken.deploy(('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'));
        await takeOffToken.deployed();
        console.log("==================================================");
        console.log("TakeOffToken :" , takeOffToken.address);
        console.log("==================================================");
    })

    //CHECKING THE CONSTRUCTOR WORK -BALANCE OF THE OWNER
    it("should update the **rOwned** mapping", async() => {

        tTotal = await takeOffToken._tTotal();
    
        rOwned = await takeOffToken._rOwned(owner.address); //calling the "_rOwned" mapping

        tOwnerBalance = await takeOffToken.balanceOf(owner.address);    //Balance of owner in normal values
        rOwnerBalance = await takeOffToken.tokenFromReflection(rOwned); //converted balance of owner i.e. reflection to normal

        expect( tOwnerBalance).to.equal(rOwnerBalance); //testing 

        console.log("==================================================");
        console.log("owner address:", owner.address);
        console.log("rOwned: OwnerBalance in Reflection:", rOwned);
        console.log("Normal Balance of owner:", tOwnerBalance);
        console.log("==================================================");
    })

    //OWNER SHOULD BE EXCLUDED FROM FEE
    it("Owner should be excluded from fee", async()=>{
        isExcludedFromFee = await takeOffToken._isExcludedFromFee(owner.address);   //Calling the mapping
        expect(isExcludedFromFee).to.equal(true);   //testing

        console.log("==================================================");
        console.log("Owner: _isExcludedFromFee: ", isExcludedFromFee);
        console.log("==================================================");
    })


    //CONTRACT ADDRESS SHOULD BE EXCLUDED FROM FEE
    it("Contract should be excluded from fee", async()=>{
        isExcludedFromFee = await takeOffToken._isExcludedFromFee(takeOffToken.address);   //Calling the mapping
        expect(isExcludedFromFee).to.equal(true);   //testing
    
        console.log("==================================================");        
        console.log("Contract: _isExcludedFromFee: ", isExcludedFromFee);
        console.log("==================================================");
    })

    describe("UniSwapv2 Pair Address checking", ()=>{
        it("Should check pair address is not dead address", async function(){
            expect(await takeOffToken.uniswapV2Pair()).to.not.equal(address0);
            console.log("====================================================");
            console.log("UniswapV2Pair address", await takeOffToken.uniswapV2Pair())
            console.log("====================================================");

        });
    })

    describe("Token and ETH min amount checking", ()=>{
        it("Should return the values greater than zero", async function(){
            expect(await takeOffToken.minTokenAmount()).to.not.equal(0);
            expect(await takeOffToken.minEthAmount()).to.not.equal(0);
            console.log("====================================================");
            console.log("Minimum Token Amount", await takeOffToken.minTokenAmount())
            console.log("Minimum ETH Amount", await takeOffToken.minEthAmount())
            console.log("====================================================");
        })
    })
    
})

//Test the function from ERC20
describe("2-TOKEN NAME", ()=>{
    it("should expect the name of token", async function(){
        expect(await takeOffToken.name()).to.equal("TAKEOFFTOKEN");
        console.log("====================================================");
        console.log("Token name", await takeOffToken._name());
        console.log("====================================================");

    })
})

//Test the function from ERC20
describe("3- TOKEN SYMBOL", ()=>{
    it("Should expect the symbol of token", async function(){
        expect(await takeOffToken.symbol()).to.equal("TOFF");

        console.log("====================================================");
        console.log("Token symbol", await takeOffToken._symbol());
        console.log("====================================================");
    })
})

//Test the function from ERC20
describe("4- TOKEN DECIMALS", ()=>{
    it("Should expect the decimal of token", async function(){
        expect(await takeOffToken.decimals()).to.equal(9);

        console.log("====================================================");
        console.log("Token decimals", await takeOffToken._decimals());
        console.log("====================================================");
    })
})

describe("5- tokenSupply function", ()=>{
    it("Should expect the total supply of token", async function(){
        expect(await takeOffToken.totalSupply()).to.equal(tokenSupply);
        console.log("====================================================");
        console.log("Token's totalSupply", await takeOffToken._tTotal());
        console.log("====================================================");

    })
})

describe("6- balanceOf function", ()=>{
    it("Should return the balance of owner account", async function(){
        const ownerBalance = await takeOffToken.balanceOf(owner.address); 
        expect(ownerBalance).to.equal(await takeOffToken.totalSupply());
        console.log("==================================================================");
        console.log("\nOwner Balance:\n ",ownerBalance);
        console.log("==================================================================");
    })
})


describe("7- transfer function", async()=> {
    it("it should transfer the takeOffTokens to the given contract", async() => {
    
        console.log("==================================================");      
        console.log("addr1 Balance before transfer function:", await takeOffToken.balanceOf(addr1.address));
        console.log("==================================================");  
    
        //signer for any transaction will be its object not its address
        await takeOffToken.connect(owner).transfer(addr1.address, parseInt(3000));
        expect (await takeOffToken.balanceOf(addr1.address)).to.equal(3000);   //testing
       
        console.log("==================================================");      
        console.log("addr1 Balance after transfer function:", await takeOffToken.balanceOf(addr1.address));
        console.log("==================================================");      
    })
})
    

describe("8- Batch Transfer Function", async() => {
    it("should Batch transfer the takeOffTokens", async() => {
        
        console.log("==================================================");      
        console.log("Balances of the recipients before batchTransfer:");
        console.log("addr1:", await takeOffToken.balanceOf(addr1.address));
        console.log("addr2:", await takeOffToken.balanceOf(addr2.address));
        console.log("==================================================");      

        await takeOffToken.connect(owner).batchTransfer([addr1.address, addr2.address], [parseInt(2000), parseInt(1000)]);
        expect(await takeOffToken.balanceOf(addr1.address)).to.equal(5000);
        expect(await takeOffToken.balanceOf(addr2.address)).to.equal(1000);


        console.log("==================================================");      
        console.log("Balances of the recipients after batchTransfer:");
        console.log("addr1:", await takeOffToken.balanceOf(addr1.address));
        console.log("addr2:", await takeOffToken.balanceOf(addr2.address));
        console.log("==================================================");      

    })
})

describe("9- allowance function ", ()=>{
    it("9- Should return the allowance of owner account and spender is addr1", async function(){
        const allowance = await takeOffToken.allowance(owner.address, addr1.address);
        expect(allowance).to.equal(0);
        console.log("==================================================================");
        console.log("\Allowance:\n ",allowance);
        console.log("==================================================================");
    })
})

describe("9- approve funtion ", ()=>{
    it("10- Should approve the 100 tokens of owner account for addr1", async function(){
        await takeOffToken.approve(addr1.address, parseInt(100));
        const allowance1 = await takeOffToken.allowance(owner.address, addr1.address);
        expect(allowance1).to.equal(100);
        console.log("==================================================================");
        console.log("\Allowance:\n ",allowance1);
        console.log("==================================================================");
    })
})

describe("11- TRANSFERFROM", ()=>{
    it("11- Should transfer the tokens from owner account to addr2", async function(){
        await takeOffToken.approve(addr1.address, parseInt(1000));
        await takeOffToken.connect(addr1).transferFrom(owner.address, addr2.address, parseInt(100));
        const allowance2 = await takeOffToken.allowance(owner.address, addr1.address);
        const addr2Balance = await takeOffToken.balanceOf(addr2.address); 
        const ownerBalance = await takeOffToken.balanceOf(owner.address); 
        console.log("==================================================================");
        console.log("\nAllowance:\n ",allowance2);
        console.log("\nBalance of addr2:\n ",addr2Balance);
        console.log("\nBalance of owner:\n ",ownerBalance);
        console.log("==================================================================");
    })
})


describe("12 & 13- INCREASE & DECREASE ALLOWANCE", ()=>{
    it("12- Should increase the allowance", async function(){
        await takeOffToken.approve(addr1.address, parseInt(1000));
        const allowance3 = await takeOffToken.allowance(owner.address, addr1.address);
        await takeOffToken.increaseAllowance(addr1.address, parseInt(4000));
        const allowance4 = await takeOffToken.allowance(owner.address, addr1.address);
        console.log("==================================================================");
        console.log("\nBefore Increase Allowance:\n ",allowance3);
        console.log("\After Increase Allowance:\n ",allowance4);
        console.log("==================================================================");
    })

    it("13- Should decrease the allowance", async function(){
        await takeOffToken.approve(addr1.address, parseInt(1000));
        const allowance5 = await takeOffToken.allowance(owner.address, addr1.address);
        await takeOffToken.decreaseAllowance(addr1.address, parseInt(500));
        const allowance6 = await takeOffToken.allowance(owner.address, addr1.address);
        expect(allowance6).to.equal(500);
        console.log("==================================================================");
        console.log("\nBefore Decrease Allowance:\n ",allowance5);
        console.log("\After Decrease Allowance:\n ",allowance6);
        console.log("==================================================================");
    })
})


describe("14- isExcludedFromReward function", ()=>{
    it("Should return the boolean value, addr1 is excluded from the reward or not?", async function(){
        const excludedFromReward = await takeOffToken.isExcludedFromReward(addr1.address);
        expect(excludedFromReward).to.equal(false);
        console.log("==================================================================");
        console.log("\nAddr1 is exclude from reward? \n", excludedFromReward);
        console.log("==================================================================");
    })
})

describe("15- TOTAL FEES", async ()=>{
    it("Should expect the total fees", async function(){
        const totalFee = await takeOffToken.totalFees();
        expect(totalFee).to.be.equal(0);
        console.log("==================================================================");
        console.log("\nTotal Fees:\n ",totalFee);
        console.log("==================================================================");
    })
})

describe("16- taxFee function: REFLECTION FEE", async ()=>{
    it("Should expect the reflection fee", async function(){
        const taxFee = await takeOffToken._taxFee(); 
        expect(taxFee).to.equal(2);
        console.log("==================================================================");
        console.log("\nReflection Fees:\n ",taxFee);
        console.log("==================================================================");
    })
})

describe("17- LIQUIDITY FEE", async ()=>{
    it("Should expect the liquidity fee", async function(){
        const liquidityFee = await takeOffToken._liquidityFee();
        expect(liquidityFee).to.equal(2);
        console.log("==================================================================");
        console.log("\nLiquidity Fees:\n ",liquidityFee);
        console.log("==================================================================");
    })
})



describe("18- BURN FEE", async ()=>{
    it("Should expect the burn fee", async function(){
        const burnFee = await takeOffToken._burnFee();
        expect(burnFee).to.equal(1);
        console.log("==================================================================");
        console.log("\nBurn Fees:\n ",burnFee);
        console.log("==================================================================");
    })
})

describe("19 & 20- Wallet Lock or Unlock", async ()=>{
    
    it("Should fail because addr1 is not the owner", async function(){
        await expect(takeOffToken.connect(addr1).setWalletLocked(addr2.address)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    })

    it("Should lock the addr1", async function(){
        await expect(takeOffToken.connect(owner).setWalletLocked(addr1.address)).not.to.be.reverted;
        const isWallet1Locked = await takeOffToken.walletLocked(addr1.address);
        console.log("==================================================================");
        console.log("\nIs Addr1 Wallet Locked:\n ",isWallet1Locked);
        console.log("==================================================================");
    })



    it("Should transfer the tokens to addr1", async function(){
        //unlocking the wallet for test
        await expect(takeOffToken.connect(owner).setWalletUnLocked(addr1.address)).not.to.be.reverted;

        //now calling the function
        await expect(takeOffToken.connect(owner).transfer(addr1.address, parseInt(1000))).not.to.be.reverted;
    })


    it("Should not transfer the tokens to addr2", async function(){
        //making the addr1 wallect locked
        await takeOffToken.connect(owner).setWalletLocked(addr1.address);

        //testing
        await expect(takeOffToken.connect(addr1).transfer(addr2.address, parseInt(500))).to.be.revertedWith(
            "Your wallet is locked."
        )
    })

    it("Shouldn't lock again the addr1", async function(){
        await expect(takeOffToken.connect(owner).setWalletLocked(addr1.address)).to.be.revertedWith(
            "This account is already locked."
        )
    })

    it("Shouldn't unlock the addr2", async function(){
        const isWallet2Locked = await takeOffToken.walletLocked(addr2.address);
        await expect(takeOffToken.setWalletUnLocked(addr2.address)).to.be.revertedWith(
            "This account is already Unlocked."
        )
        console.log("==================================================================");
        console.log("\nIs Addr2 Wallet Locked:\n ",isWallet2Locked);
        console.log("==================================================================");
    })

    it("Should unlock the addr1", async function(){
        await expect(takeOffToken.setWalletUnLocked(addr1.address)).not.to.be.reverted;
        const isWallet1Locked = await takeOffToken.walletLocked(addr1.address);
        console.log("==================================================================");
        console.log("\nIs Addr1 Wallet Locked:\n ",isWallet1Locked);
        console.log("==================================================================");
    })
})


//TESTING BURN FUNCTION -21
describe("21- burn function", async() => {
    it("it should burn the tokens", async() =>{
        ownerBalanceBeforeBurning = await takeOffToken.balanceOf(owner.address);

        console.log("==================================================");  
        console.log("ownerBalanceBeforeBurning", ownerBalanceBeforeBurning);
        console.log("==================================================");  

        await takeOffToken.connect(owner).burn(1000);

        ownerBalanceAfterBurning = await takeOffToken.balanceOf(owner.address);
        
        console.log("==================================================");  
        console.log("ownerBalanceAfterBurning", ownerBalanceAfterBurning);
        console.log("==================================================");  

        expect(await ownerBalanceAfterBurning).to.equal(ownerBalanceBeforeBurning.sub(1000));
    })

    
        it("should not be called by any user except owner", async() => {
            await expect(takeOffToken.connect(addr1).burn(5000)).to.be.revertedWith(
                "Ownable: caller is not the owner"
        )
        })

})

//TESTIN reflectionFromToken FUNCTION -22
describe("22- reflectionFromToken", async() => {
    it("should return reflection from takeOffToken -true scenario", async() => {
        const reflectionFromToken  = await takeOffToken.reflectionFromToken(3000, true);
        const getValues =   await takeOffToken._getValues(3000);    //calling this function because this is how reflection is returned
        
        expect (await reflectionFromToken).to.equal(getValues[1]);  //getValues[1] is the rTransferAmount

        console.log("==================================================");      
        console.log("reflection from takeOffToken with fee deduction: ", reflectionFromToken);
        console.log("==================================================");      

    })

    it("should return reflection from takeOffToken -false scenario", async() => {
        const reflectionFromToken  = await takeOffToken.reflectionFromToken(3000, false);
        const getValues =   await takeOffToken._getValues(3000);    //calling this function because this is how reflection is returned
        
        expect (await reflectionFromToken).to.equal(getValues[0]);  //getValues[0] is the rAmount

        console.log("==================================================");      
        console.log("reflection from takeOffToken without fee deduction: ", reflectionFromToken);
        console.log("==================================================");      
    })



    it("should not proceed further if the amount is greater than the supply either true/False", async() => {
        await expect(takeOffToken.reflectionFromToken(BigNumber.from('500000000000000000001'), false)).to.be.revertedWith(
            "Amount must be less than supply");
    })
})

//TESTING takeOffTokenFromReflection FUNCTION -23
describe("23- tokenFromReflection", async() => {

    it("should return the takeOffToken from reflection", async() => {
        const rAmount = parseInt(BigNumber.from('694752535423897172541425910052127447119619907993843384234000'));
        const currentRate = await takeOffToken._getRate();
        
        console.log("==================================================");   
        console.log("Current Rate Of takeOffToken", currentRate);
        console.log("==================================================");   

        const takeOffTokenFromReflection = await takeOffToken.tokenFromReflection('694752535423897172541425910052127447119619907993843384234000');
        expect (await takeOffTokenFromReflection).to.equal(rAmount/currentRate);

        //should return 3000
        console.log("==================================================");      
        console.log("token From Reflection: ", takeOffTokenFromReflection);
        console.log("==================================================");      

    })
    
    it("should not run because amount must be less than total reflection", async() => {
        await expect(takeOffToken.tokenFromReflection(BigNumber.from('115792089237316195423570985008687907853269984665640564039000000000000000000000'))).to.be.revertedWith(
            "Amount must be less than total reflections"        
            )

    })

    it("should not be called by any user except owner", async() => {
        await expect(takeOffToken.connect(addr1).excludeFromReward(addr2.address)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })
})


describe("excludeFromReward function", async() => {
    it("should exclude the address from reward", async() => {
        await takeOffToken.connect(owner).excludeFromReward(addr1.address);
        expect (await takeOffToken._isExcluded(addr1.address)).to.equal(true);


        console.log("==================================================");      
        console.log("exclude from reward: ", await takeOffToken._isExcluded(addr1.address));
        console.log("==================================================");  
    })


    it("should return that the account is Already excluded", async() => {
        await expect (takeOffToken.connect(owner).excludeFromReward(addr1.address)).to.be.revertedWith(
            "Account is already excluded"
        )
    })


    it("should not be called by any user except owner", async() => {
        await expect( takeOffToken.connect(addr1).excludeFromReward(addr2.address)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })
})

//onlyOwner Funtion
describe("includeInReward function", async() => {
    it("should include the address from reward", async() => {
        await takeOffToken.connect(owner).includeInReward(addr1.address);
        expect (await takeOffToken._isExcluded(addr1.address)).to.equal(false);


        console.log("==================================================");      
        console.log("include from reward: ", await takeOffToken._isExcluded(addr1.address) );
        console.log("==================================================");  
    })

    
    it("should return that the account is Already included", async() => {
        await expect (takeOffToken.connect(owner).includeInReward(addr1.address)).to.be.revertedWith(
            "Account is already included"
        )
        
    })

    it("should not be called by any user except owner", async() => {
        await expect(takeOffToken.connect(addr1).includeInReward(addr2.address)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })
})


describe("26- TRANSFER BOTH EXCLUDED?", ()=>{
    it("Should transfer the tokens from excluded to excluded from the fee", async function(){
        await takeOffToken.excludeFromReward(addr1.address);
        await takeOffToken.excludeFromReward(addr2.address);

        const addr1Balance = await takeOffToken.balanceOf(addr1.address); 
        const addr2Balance = await takeOffToken.balanceOf(addr2.address); 
        //await takeOffToken.connect(owner).transfer(addr1.address, parseInt(5000));
        
        console.log("addr1Balance",addr1Balance);
        console.log("addr2Balance",addr2Balance);


        await takeOffToken.connect(addr1)._transferBothExcluded(addr1.address, addr2.address, 1000); 


        const addr1BalanceAfter = await takeOffToken.balanceOf(addr1.address); 
        const addr2BalanceAfter = await takeOffToken.balanceOf(addr2.address); 
        //await takeOffToken.connect(owner).transfer(addr1.address, parseInt(5000));
        
        console.log("addr1BalanceAfter",addr1BalanceAfter);
        console.log("addr2BalanceAfter",addr2BalanceAfter);
    
        expect(await takeOffToken.balanceOf(addr1.address)).to.equal(addr1Balance.sub(1000));
        expect(await takeOffToken.balanceOf(addr2.address)).to.equal(addr2Balance.add(950));
        console.log("==================================================================");
        console.log("\nBalance of addr1:\n ",await takeOffToken.balanceOf(addr1.address));
        console.log("\nBalance of addr2:\n ",await takeOffToken.balanceOf(addr2.address));
        console.log("==================================================================");
    })

    it("it should emit a Transfer event", async function(){
        await expect(await takeOffToken._transferBothExcluded(addr1.address, addr2.address, parseInt(2000)))
        .to.emit(takeOffToken, "Transfer")
        .withArgs(addr1.address, addr2.address, parseInt(1900));
        console.log("==================================================================");
        console.log("Transfer event emitted");
        console.log("==================================================================");
    })
})

//onlyOwner Funtion
describe("27- excludeFromReward function", async() => {
    it("should exclude the address from reward", async() => {
        //addr1: including in reward in order to make it excluded for further testing
        await takeOffToken.connect(owner).includeInReward(addr1.address);

        await takeOffToken.connect(owner).excludeFromReward(addr1.address);
        expect (await takeOffToken._isExcluded(addr1.address)).to.equal(true);

        console.log("==================================================");      
        console.log("exclude from reward: ", await takeOffToken._isExcluded(addr1.address));
        console.log("==================================================");  
    })


    it("should return that the account is Already excluded", async() => {
        await expect(takeOffToken.connect(owner).excludeFromReward(addr1.address)).to.be.revertedWith(
            "Account is already excluded"
        )
    })


    it("should not be called by any user except owner", async() => {
        await expect(takeOffToken.connect(addr1).excludeFromReward(addr2.address)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })
})



//TESTING IncludeInReward FUNCTION -25
//onlyOwner Funtion
describe("28- includeInReward function", async() => {
    it("should include the address from reward", async() => {
        await takeOffToken.connect(owner).includeInReward(addr1.address);
        expect (await takeOffToken._isExcluded(addr1.address)).to.equal(false);


        console.log("==================================================");      
        console.log("include from reward: ", await takeOffToken._isExcluded(addr1.address) );
        console.log("==================================================");  
    })

    it("should return that the account is Already included", async() => {
        await expect(takeOffToken.connect(owner).includeInReward(addr1.address)).to.be.revertedWith(
            "Account is already included"
        )

    })

    it("should not be called by any user except owner", async() => {
        await expect(takeOffToken.connect(addr1).includeInReward(addr2.address)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })
})

//TESTING setTaxFeePercent FUNCTION -29
//onlyOwner Function
describe("29- setTaxFeePercent Function", async() => {
    it("should set Tax Fee Percent", async() => {

        console.log("==================================================");  
        console.log("Tax Fee before :", await takeOffToken._taxFee());
        console.log("==================================================");  

            const taxFee = await takeOffToken.connect(owner).setTaxFeePercent(10);
            expect (await takeOffToken._taxFee()).to.equal(10);

        console.log("==================================================");  
        console.log("Tax Fee after :", await takeOffToken._taxFee());
        console.log("==================================================");  

    })

    
    it("should not be called by any user except owner", async() => {
        await expect(takeOffToken.connect(addr1).setTaxFeePercent(20)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })


    it("it should emit the SetTaXFeePercent Event", async() => {
        await expect(await takeOffToken.setTaxFeePercent(10))
        .to.emit(takeOffToken, "ReflectionFeeUpdated")
        .withArgs(await takeOffToken._taxFee());
        
        console.log("==================================================");  
        console.log("ReflectionFeeUpdated event emitted for setTaxFeePercent function ");  
        console.log("==================================================");  
    })
})


//TESTING setBurnFeePercent FUNCTION -31
//onlyOwner Function
describe("30- setBurnFeePercent Function", async() => {
    it("should set Burn Fee Percent", async() => {

        console.log("==================================================");  
        console.log("Burn Fee before :", await takeOffToken._burnFee());
        console.log("==================================================");  

            const taxFee = await takeOffToken.connect(owner).setBurnFeePercent(5);
            expect (await takeOffToken._burnFee()).to.equal(5);

        console.log("==================================================");  
        console.log("Burn Fee after :", await takeOffToken._burnFee());
        console.log("==================================================");  

    })

    
    it("should not be called by any user except owner", async() => {
        await expect(takeOffToken.connect(addr1).setBurnFeePercent(8)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })

})     
describe("SET LIQUIDITY FEE", async()=>{
    it("30- Should set the liquidity fee", async function(){
        await takeOffToken.setLiquidityFeePercent(parseInt(5));
        const liquidityFee = await takeOffToken._liquidityFee(); 
        expect(liquidityFee).to.equal(5);
        console.log("==================================================================");
        console.log("\nLiquidity Fees:\n ",liquidityFee);
        console.log("==================================================================");
    })

    it("it should emit a SetLiquidityFeePercent event", async function(){
        await expect(await takeOffToken.setLiquidityFeePercent(5))
        .to.emit(takeOffToken, "LiquidityFeeUpdated")
        .withArgs(5);
        console.log("==================================================================");
        console.log("LiquidityFeeUpdated event emitted");
        console.log("==================================================================");
    })


    describe("31- setBurnFeePercentage", async() => {
    //SetBurnFeePercent
    it("it should emit the SetBurnFeePercent Event", async() => {
        await takeOffToken.setBurnFeePercent(10);
        expect(await takeOffToken._burnFee()).to.equal(10);
        
        
        console.log("==================================================");  
        console.log("await takeOffToken._burnFee()");  
        console.log("==================================================");  
    })


    it("should not be called by any user except owner", async() => {
        await expect(takeOffToken.connect(addr1).setBurnFeePercent(9)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })

    it("it should emit a SetBurnFeePercent event", async function(){
        await expect(await takeOffToken.setBurnFeePercent(10))
        .to.emit(takeOffToken, "BurnFeeUpdated").
        withArgs(10);
    })

})
})


//TESTING setMaxPercent FUNCTION -32
//onlyOwner Function
describe("32- setMaxPercent Function", async() => {
    it("it should set Max Percent", async() => {

        console.log("==================================================");  
        console.log("Max Transaction Fee before :", await takeOffToken._maxAmount());
        console.log("==================================================");  

        await takeOffToken.connect(owner).setMaxPercent(13);
        const maxTxAmount = await takeOffToken._maxAmount();
        expect (parseInt(maxTxAmount)).to.equal(parseInt(tTotal* 13 / 10 **2));


        console.log("==================================================");  
        console.log("Max Transaction Fee after :", await takeOffToken._maxAmount());
        console.log("==================================================");  

    })

    
    it("should not be called by any user except owner", async() => {
        await expect(takeOffToken.connect(addr1).setMaxPercent(8)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })

    it("it should emit a SetMaxTxPercent event", async function(){
        await expect(await takeOffToken.setMaxPercent(13))
        .to.emit(takeOffToken, "MaxLimitUpdated").
        withArgs(13);
    })
})

//TESTING setMaxBuyPercent function
//onlyOwner
describe("33- setMaxBuyPercent Fucntion", async() => {
    it("it should set Max Buy Percent for Buying the takeOffTokens", async() => {
        console.log("==================================================");  
        console.log("Max Buy percent before :", await takeOffToken._maxBuyAmount());
        console.log("==================================================");  

        await takeOffToken.connect(owner).setMaxBuyPercent(20);
        const maxBuyPercent = await takeOffToken._maxBuyAmount();
        expect (parseInt(maxBuyPercent)).to.equal(parseInt(tTotal* 20 / 10 **2));


        console.log("==================================================");  
        console.log("Max Buy percent after :", await takeOffToken._maxBuyAmount());
        console.log("==================================================");  

    })
    
    it("should not be called by any user except owner", async() => {
        await expect(takeOffToken.connect(addr1).setMaxBuyPercent(8)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })
    it("it should emit a SetMaxBuyPercent event", async function(){
        await expect(await takeOffToken.setMaxBuyPercent(20))
        .to.emit(takeOffToken, "MaxBuyLimitUpdated").
        withArgs(20);
    })
})


//TESTING setMaxBuyPercent function
//onlyOwner
describe("34- setMaxSellPercent Function", async() => {
    it("it should set Max Sell Percent for Buying the takeOffTokens", async() => {
        console.log("==================================================");  
        console.log("Max Sell percent before :", await takeOffToken._maxSellAmount());
        console.log("==================================================");  

        await takeOffToken.connect(owner).setMaxSellPercent(43);
        const maxBuyPercent = await takeOffToken._maxSellAmount();
        expect (parseInt(maxBuyPercent)).to.equal(parseInt(tTotal* 43 / 10 **2));


        console.log("==================================================");  
        console.log("Max Sell percent after :", await takeOffToken._maxSellAmount());
        console.log("==================================================");  

    })

    
    it("should not be called by any user except owner", async() => {
        await expect(takeOffToken.connect(addr1).setMaxSellPercent(8)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })

    it("it should emit a SetMaxSellPercent event", async function(){
        await expect(await takeOffToken.setMaxSellPercent(43))
        .to.emit(takeOffToken, "MaxSellLimitUpdated").
        withArgs(43);
    })
})

describe("35- setSwapAndLiquifyEnabled function",async() => {
    it("it should update swapAndLiquifyEnabled variable", async() => {

        console.log("==================================================");  
        console.log("swapAndLiquifyEnabled before", await takeOffToken.swapAndLiquifyEnabled());
        console.log("==================================================");  

        await takeOffToken.connect(owner).setSwapAndLiquifyEnabled(true);

        console.log("==================================================");  
        console.log("swapAndLiquifyEnabled after", await takeOffToken.swapAndLiquifyEnabled());
        console.log("==================================================");  
    })

    it("it should emit a SwapAndLiquifyEnabledUpdated event", async function(){
        await expect(await takeOffToken.setSwapAndLiquifyEnabled(true))
        .to.emit(takeOffToken, "SwapAndLiquifyEnabledUpdated")
        .withArgs(true);
        
        console.log("==================================================");  
        console.log("SwapAndLiquifyEnabledUpdated event emitted");  
        console.log("==================================================");  
    })

    it("should not be called by any other user except the owner", async() => {
        await expect(takeOffToken.connect(addr1).setSwapAndLiquifyEnabled(true)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })
})

describe("36- _reflectFee function", async() => {
    it("it should subtract the rFee from rTotal and add tFee in tTotal", async() => {
        const rTotal = await takeOffToken._rTotal();    //from contract
        const tFeeTotal = await takeOffToken._tFeeTotal();  //from Contract

        console.log("=================================================="); 
        console.log("rTotal before", rTotal);   
        console.log("tFeeTotal before", tFeeTotal);
        console.log("=================================================="); 

        await takeOffToken._reflectFee(parseInt(1111111111), 300);  //calling The Function

        const rTotalAfterFromContract = await takeOffToken._rTotal();   //Contract rTotal after calling the function
        const rTotalafterSub = BigNumber.from(rTotal.toString()).sub(BigNumber.from('1111111111')); //making variable for testing

        const tFeeTotalFromContract = await takeOffToken._tFeeTotal();
        const tFeeTotalafterAdd = BigNumber.from(tFeeTotal.toString()).add(BigNumber.from('300'));

        expect (BigNumber.from(rTotalAfterFromContract.toString())).to.equal(rTotalafterSub);   //Contract tFeeTotal after calling the function
        expect (BigNumber.from(tFeeTotalFromContract.toString())).to.equal(tFeeTotalafterAdd);  //making variable for testing

        console.log("=================================================="); 
        console.log("rTotal after sub", rTotalafterSub);
        console.log("tFeeTotal after add", tFeeTotalafterAdd);
        console.log("=================================================="); 

        
    it("it should emit a SwapAndLiquifyEnabledUpdated event", async function(){
        await expect(await takeOffToken._reflectFee(parseInt(1111111111), 300))
        .to.emit(takeOffToken, "ReflectionFeeCharged")
        .withArgs(300);
        
        console.log("==================================================");  
        console.log("ReflectionFeeCharged event emitted");  
        console.log("==================================================");  
    })
    })
})


describe("37-  _getValues function", async() => {
    it("should work properly and return amounts", async() =>{
        const getValues = await takeOffToken._getValues(5000);

        console.log("=================================================="); 
        console.log("_getValues() Return", getValues);
        console.log("=================================================="); 

    })
})


describe("38- _getTValues funtion", async() => {
    it("it should work properly and should return the return values", async() =>{
        const getTValues = await takeOffToken._getTValues(1000);

        console.log("=================================================="); 
        console.log("getTValues() Return", getTValues);
        console.log("=================================================="); 

    })
})


describe("39- _getRValues function", async() => {
    it("it should work right and should return the return values of function", async() =>{

    const getRValues = await takeOffToken._getRValues(830, 100, 20, 50, takeOffToken._getRate() );  //values taken from the above "getTValues" function
    
    console.log("=================================================="); 
    console.log("getRValues() Return", getRValues);
    console.log("=================================================="); 

    })
})



describe("_getRate function", async() => {
    it("it should return the current rate", async() =>{

        //getting the values from the contract's variable for testing
        const rSupply = await takeOffToken._getCurrentSupply(); 
        const tSupply = await takeOffToken._getCurrentSupply();

        const getRate = await takeOffToken._getRate();

        expect (getRate).to.equal(BigNumber.from(rSupply[0].toString()).div(BigNumber.from(tSupply[1].toString())));

        console.log("=================================================="); 
        console.log("getRate() Return", getRate);
        console.log("=================================================="); 

    })
})


describe("41- _getCurrentSupply function", async() => {
    it("should return the current Supply in r & t", async() => {
        const currentSupply = await takeOffToken._getCurrentSupply();

        console.log("===========================================================");
        console.log("Current Supply", currentSupply);
        console.log("===========================================================");

    })
})

    
describe("42- TAKE LIQUIDITY", ()=>{
    it("Should take the liquidity fee", async function(){
        await takeOffToken._takeLiquidity(parseInt(5));
        // WE ARE CHECKING THE BALANCE OF CONTRACT FOR VERIIFCATION OF LIQUIDITY FEE
        // BECAUSE LIQUIDITY FEE IS STORING IN THE CONTRACT.
        const contractBalance = await takeOffToken.balanceOf(takeOffToken.address); 
        expect(contractBalance).to.equal(65);
        console.log("==================================================================");
        console.log("\nBalance of contract:\n ",contractBalance);
        console.log("==================================================================");
    })

    it("it should emit a LiquidityFee event", async function(){
        await expect(await takeOffToken._takeLiquidity(5))
        .to.emit(takeOffToken, "LiquidityFee")
        .withArgs(5);
        console.log("==================================================================");
        console.log("LiquidityFee event emitted");
        console.log("==================================================================");
    })
})

describe("43- TAKE BURN FEE", ()=>{
    it("44- Should take the burn fee", async function(){
        await takeOffToken._takeBurnFee(parseInt(7));
        // WE ARE CHECKING THE BALANCE OF DEAD ADDRESS FOR VERIIFCATION OF BURN FEE
        // BECAUSE BURN FEE IS GOIING TO THE DEAD ADDRESS.
        const deadAddrBalance = await takeOffToken.balanceOf(address0); 
        expect(deadAddrBalance).to.equal(37);
        console.log("==================================================================");
        console.log("\nBalance of dead address:\n ", deadAddrBalance);
        console.log("==================================================================");
    })

    it("it should emit a BurnFee event", async function(){
        await expect(await takeOffToken._takeBurnFee(7))
        .to.emit(takeOffToken, "BurnFee")
        .withArgs(7);
        console.log("==================================================================");
        console.log("BurnFee event emitted");
        console.log("==================================================================");
    })
})

describe("44- CALCULATE TAX FEE", ()=>{
    it("45- Should calculate the tax fee", async function(){
        const tokenAmount = 0.5;
        const taxFee = await takeOffToken._taxFee();
        const calc = await takeOffToken.calculateTaxFee(tokenAmount*10**9);
        const formula = parseFloat(((taxFee*tokenAmount)/100)*(10**9));
        expect(calc).to.equal(formula);
        console.log("==================================================================");
        console.log("\nToken amount:\n",tokenAmount);
        console.log("\nTax Fee:\n",taxFee);
        console.log("\nCalculate Tax Fee:\n ", parseFloat(calc/10**9));
        console.log("==================================================================");
    })
})
    
describe("45- CALCULATE LIQUIDITY FEE", ()=>{
    it("46- Should calculate the liquidity fee", async function(){
        const tokenAmount = 10;
        const liquidityFee = await takeOffToken._liquidityFee();
        const calc = await takeOffToken.calculateLiquidityFee(tokenAmount*10**9);
        const formula = parseFloat(((liquidityFee*tokenAmount)/100)*(10**9));
        expect(calc).to.equal(formula);
        console.log("==================================================================");
        console.log("\nToken amount:\n",tokenAmount);
        console.log("\nLiquidity Fee:\n",liquidityFee);
        console.log("\nCalculate Liquidity Fee:\n ", parseFloat(calc/10**9));
        console.log("==================================================================");
    })
})

describe("46- CALCULATE BURN FEE", ()=>{
    it("Should calculate the burn fee", async function(){
        const tokenAmount = 6;
        const burnFee = await takeOffToken._burnFee();
        const calc = await takeOffToken.calculateBurnFee(tokenAmount*10**9);
        const formula = parseFloat(((burnFee*tokenAmount)/100)*(10**9));
        expect(calc).to.equal(formula);
        console.log("==================================================================");
        console.log("\nToken amount:\n",tokenAmount);
        console.log("\nBurn Fee:\n",burnFee);
        console.log("\nCalculate Burn Fee:\n ", parseFloat(calc/10**9));
        console.log("==================================================================");
    })
})

    

//private Function
describe("47- removeAllFee function", async() => {
    it("it should remove all the fee", async() => {


        const taxFeeBefore = await takeOffToken._taxFee();
        const liquidityFeeBefore = await takeOffToken._liquidityFee();
        const burnFeeBefore = await takeOffToken._burnFee();

        console.log("==================================================");      
        console.log("_taxFee", taxFeeBefore);
        console.log("_liquidityFee",liquidityFeeBefore);
        console.log("_burnFee", burnFeeBefore);
        console.log("==================================================");      


        await takeOffToken.removeAllFee();

        const taxFeeAfter = await takeOffToken._taxFee();
        const liquidityFeeAfter = await takeOffToken._liquidityFee();
        const burnFeeAfter = await takeOffToken._burnFee();

        expect (taxFeeAfter).to.equal(0);
        expect (liquidityFeeAfter).to.equal(0);
        expect (burnFeeAfter).to.equal(0);

        console.log("==================================================");      
        console.log("_taxFee", taxFeeAfter);
        console.log("_liquidityFee",liquidityFeeAfter);
        console.log("_burnFee", burnFeeAfter);
        console.log("==================================================");      

    })
})


//Private Function
describe("48- restoreAllFee function", async() =>{
    it(" it should restore all the fee", async() =>{

        const taxFeeBefore = await takeOffToken._taxFee();
        const liquidityFeeBefore = await takeOffToken._liquidityFee();
        const burnFeeBefore = await takeOffToken._burnFee();

        console.log("==================================================");      
        console.log("_taxFee", taxFeeBefore);
        console.log("_liquidityFee",liquidityFeeBefore);
        console.log("_burnFee", burnFeeBefore);
        console.log("==================================================");      

        await takeOffToken.restoreAllFee(false);

        const taxFeeAfter = await takeOffToken._taxFee();
        const liquidityFeeAfter = await takeOffToken._liquidityFee();
        const burnFeeAfter = await takeOffToken._burnFee();

        expect (await takeOffToken._previousTaxFee()).to.equal(taxFeeAfter);
        expect (await takeOffToken._previousLiquidityFee()).to.equal(liquidityFeeAfter);
        expect (await takeOffToken._previousBurnFee()).to.equal(burnFeeAfter);

        console.log("==================================================");      
        console.log("_taxFee", taxFeeAfter);
        console.log("_liquidityFee",liquidityFeeAfter);
        console.log("_burnFee", burnFeeAfter);
        console.log("==================================================");      

    })
})


//Public Function
describe("49- isExcludedFromFee function", async() => {
    it("it should return bool regarding isExcludedFromFee status of ther address", async() =>{

        const isExcludedFromFee = await takeOffToken.isExcludedFromFee(addr1.address);

        expect (isExcludedFromFee).to.equal(await takeOffToken._isExcludedFromFee(addr1.address));

        console.log("==================================================");      
        console.log("isExcludedFromFee ", isExcludedFromFee);
        console.log("==================================================");      

    })
})

describe("50- setFee", async() =>{
    it("it should set the liquidity fee with the multiplier ", async() => {

        const liquidityFeeBefore = await takeOffToken._liquidityFee(); 

        console.log("==================================================");    
        console.log(" Liquidity Fee Before ", liquidityFeeBefore);
        console.log("==================================================");    

        await  takeOffToken.setFee(2);

        const liquidityFeeAfter = await takeOffToken._liquidityFee(); 

        expect(liquidityFeeAfter).to.equal(liquidityFeeBefore.add(2));

        console.log("==================================================");    
        console.log(" Liquidity Fee Before ", liquidityFeeAfter);
        console.log("==================================================");    
 
    })
})


describe("51- ADD TO LIQUIDITY", ()=>{
    it("Should add liquidity", async function(){
        const ownerEthBalance = await ethers.provider.getBalance(owner.address);
        
        const transactionHash = await owner.sendTransaction({
            to: takeOffToken.address,
            value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
        });
        
        console.log("uniswap router : ", await takeOffToken.uniswapV2Router());
        console.log("uniswap pair : ", await takeOffToken.uniswapV2Pair());
        console.log("contract token balance: ", await takeOffToken.balanceOf(takeOffToken.address));
        console.log("owner eth balance: ", ownerEthBalance);
        console.log("token address: ", await takeOffToken.address);
        
        const contractEthBalance = await ethers.provider.getBalance(takeOffToken.address);
        console.log("contract eth balance: ", contractEthBalance);
        await takeOffToken.addLiquidity(await takeOffToken.balanceOf(takeOffToken.address), contractEthBalance, takeOffToken.minTokenAmount(), takeOffToken.minEthAmount()); 
        const updatedContractEthBalance = await ethers.provider.getBalance(takeOffToken.address);
        const updatedContractTokenBalance = await takeOffToken.balanceOf(takeOffToken.address);
        
        expect(updatedContractEthBalance).to.equal(0);
        expect(updatedContractTokenBalance).to.equal(0);
        console.log("==================================================================");
        console.log("\n**AFTER LIQUIDITY**");
        console.log("ETH balance of contract = ",updatedContractEthBalance);
        console.log("Token balance of contract = ",updatedContractTokenBalance);
        console.log("==================================================================");
        
    })
})

describe("52- _TOKEN TRANSFER", function(){
    it("setting the fee percent to 5 percent", async () => {
        //making the fee 5% in total
        await takeOffToken.setLiquidityFeePercent(2);
        await takeOffToken.setBurnFeePercent(1);
        await takeOffToken.setTaxFeePercent(2);
    })

    it("Should transfer the tokens - TransferFromExcluded", async () => {
        const addr1Balance = await takeOffToken.balanceOf(addr1.address);
        const addr2Balance = await takeOffToken.balanceOf(addr2.address);
        
        console.log("==================================================================");
        console.log("Addr1 Balance = ", addr1Balance);
        console.log("Addr2 Balance = ", addr2Balance);
        console.log("==================================================================");

        await takeOffToken.connect(owner).includeInReward(addr2.address);
    
        //making the addr1 excluded from rewards
        await takeOffToken.connect(owner).excludeFromReward(addr1.address);

        console.log("address 1 is excluded from reward ?", await takeOffToken.isExcludedFromReward(addr1.address)); //true
        console.log("address 2 is excluded from reward ?", await takeOffToken.isExcludedFromReward(addr2.address)); //false

        //calling the function
        await takeOffToken.connect(addr1)._tokenTransfer(addr1.address, addr2.address, '500' , true, false);
        
        const updatedAddr1Balance = await takeOffToken.balanceOf(addr1.address);
        const updatedAddr2Balance = await takeOffToken.balanceOf(addr2.address);
        
        expect(updatedAddr1Balance).to.equal(addr1Balance.sub(500));
        expect(updatedAddr2Balance).to.equal(addr2Balance.add(BigNumber.from('500').sub(500 /100 * 5)));    //subtracting the 5% fee that we set
        
        console.log("==================================================================");
        console.log("Addr1 Balance = ", updatedAddr1Balance);
        console.log("Addr2 Balance = ", updatedAddr2Balance);
        console.log("==================================================================");
    })

    it("Should transfer the tokens -TransferToExcluded", async () => {

        //making the addresses included and excluded as per the requirement
        await takeOffToken.connect(owner).includeInReward(addr1.address);   //including
        await takeOffToken.connect(owner).excludeFromReward(addr2.address); //excluding

        console.log("address 1 is excluded from reward ?", await takeOffToken.isExcludedFromReward(addr1.address));
        console.log("address 2 is excluded from reward ?", await takeOffToken.isExcludedFromReward(addr2.address));

        const addr1Balance = await takeOffToken.balanceOf(addr1.address);
        const addr2Balance = await takeOffToken.balanceOf(addr2.address);
        
        console.log("==================================================================");
        console.log("Addr1 Balance = ", addr1Balance);
        console.log("Addr2 Balance = ", addr2Balance);
        console.log("==================================================================");

        // _transferToExcluded will be executed
        await takeOffToken.connect(addr1)._tokenTransfer(addr1.address, addr2.address, '500' , true, false);
        
        const updatedAddr1Balance2 = await takeOffToken.balanceOf(addr1.address);
        const updatedAddr2Balance2 = await takeOffToken.balanceOf(addr2.address);
        
        expect(updatedAddr1Balance2).to.equal(addr1Balance.sub(500));
        expect(updatedAddr2Balance2).to.equal(addr2Balance.add(BigNumber.from('500').sub(500 /100 * 5)));    //subtracting the 5% fee that we set


        console.log("==================================================================");
        console.log("Addr1 Balance = ", updatedAddr1Balance2);
        console.log("Addr2 Balance = ", updatedAddr2Balance2);
        console.log("==================================================================");

    })
    
    it("Should transfer the tokens -TransferStandard", async () => {

        const addr1Balance = await takeOffToken.balanceOf(addr1.address);
        const addr2Balance = await takeOffToken.balanceOf(addr2.address);
        
        console.log("==================================================================");
        console.log("Addr1 Balance = ", addr1Balance);
        console.log("Addr2 Balance = ", addr2Balance);
        console.log("==================================================================");
        
        //excluding from reward, so that both the addresses will be excluded for executing the _transferStandard funtion
        await takeOffToken.connect(owner).includeInReward(addr2.address);

        console.log("address 1 is excluded from reward ?", await takeOffToken.isExcludedFromReward(addr1.address));
        console.log("address 2 is excluded from reward ?", await takeOffToken.isExcludedFromReward(addr2.address));
        
        // _transferStandard will be executed
        await takeOffToken.connect(addr2)._tokenTransfer(addr1.address, addr2.address, '500', true, false);
        
        const updatedAddr1Balance3 = await takeOffToken.balanceOf(addr1.address);
        const updatedAddr2Balance3 = await takeOffToken.balanceOf(addr2.address);
        
        expect(updatedAddr1Balance3).to.equal(addr1Balance.sub(500));
        expect(updatedAddr2Balance3).to.equal(addr2Balance.add(BigNumber.from('500').sub(500 /100 * 5)));    //subtracting the 5% fee that we set

        
        console.log("==================================================================");
        console.log("Addr1 Balance = ", updatedAddr1Balance3);
        console.log("Addr2 Balance = ", updatedAddr2Balance3);
        console.log("==================================================================");
        })

        it("Should transfer the tokens -TransferBothExcluded", async () => {
       const addr1Balance = await takeOffToken.balanceOf(addr1.address);
       const addr2Balance = await takeOffToken.balanceOf(addr2.address);
       
       console.log("==================================================================");
       console.log("Addr1 Balance = ", addr1Balance);
       console.log("Addr2 Balance = ", addr2Balance);
       console.log("==================================================================");

       //excluding both the addresses from the reward
        await takeOffToken.connect(owner).excludeFromReward(addr1.address);
        await takeOffToken.connect(owner).excludeFromReward(addr2.address);

        console.log("address 1 is excluded from reward ?", await takeOffToken.isExcludedFromReward(addr1.address));
        console.log("address 2 is excluded from reward ?", await takeOffToken.isExcludedFromReward(addr2.address));
        
        // _transferBothExcluded will be executed
        await takeOffToken.connect(addr1)._tokenTransfer(addr2.address, addr1.address, '500', true, false);
        
        const updatedAddr1Balance4 = await takeOffToken.balanceOf(addr1.address);
        const updatedAddr2Balance4 = await takeOffToken.balanceOf(addr2.address);
        
        // expect(updatedAddr1Balance4).to.equal(addr1Balance.sub(500));
        // expect(updatedAddr2Balance4).to.equal(addr2Balance.add(BigNumber.from('500').sub(500 /100 * 5)));    //subtracting the 5% fee that we set

        
        console.log("==================================================================");
        console.log("Addr1 Balance = ", updatedAddr1Balance4);
        console.log("Addr2 Balance = ", updatedAddr2Balance4);
        console.log("==================================================================");
    })
})
  
describe("53- SWAP TOKENS FOR ETH", ()=>{
    it(" Should swap tokens for ETH", async function(){
        await takeOffToken.connect(owner).transfer(takeOffToken.address, parseInt(5000));
        const contractTokenBalance = await takeOffToken.balanceOf(takeOffToken.address);
        const contractEthBalance = await ethers.provider.getBalance(takeOffToken.address);
        console.log("==================================================================");
        console.log("Before Swapping");
        console.log("Token balance of contract = ", contractTokenBalance);
        console.log("ETH balance of contract = ", contractEthBalance);
        await takeOffToken.swapTokensForEth(contractTokenBalance, takeOffToken.minEthAmount());
        const updatedContractTokenBalance = await takeOffToken.balanceOf(takeOffToken.address);
        expect(updatedContractTokenBalance).to.equal(0);
        console.log("After Swapping");
        console.log("ETH balance of contract = ", await ethers.provider.getBalance(takeOffToken.address));
        console.log("Token balance of contract = ", updatedContractTokenBalance);
        console.log("==================================================================");
    })
})
  
describe("54- SWAP AND LIQUIFY", ()=>{
    let swap; 
    it(" Should swap half contract token balance into ETH and add liquidity", async function(){
        await takeOffToken.connect(owner).transfer(takeOffToken.address, parseInt(50000));
        const contractTokenBalance = await takeOffToken.balanceOf(takeOffToken.address);
        console.log("==================================================================");
        console.log("Token balance of contract = ", contractTokenBalance);
        swap = await takeOffToken.swapAndLiquify(contractTokenBalance);
        const updatedContractTokenBalance = await takeOffToken.balanceOf(takeOffToken.address);
        console.log("Token balance of contract = ", updatedContractTokenBalance);
        console.log("==================================================================");

    })

    it("it should emit a SwapAndLiquify event", async function(){
        await takeOffToken.transfer(takeOffToken.address, parseInt(50000));
        const contractTokenBalance = await takeOffToken.balanceOf(takeOffToken.address);
        console.log("Token balance of contract = ", contractTokenBalance);
        console.log("ETH balance of contract = ", await ethers.provider.getBalance(takeOffToken.address) / 10**18);
        
        let latestEthBalance = await takeOffToken.latestEthBalance();

        await expect(swap)
        .to.emit(takeOffToken, "SwapAndLiquify")
        .withArgs(25000, latestEthBalance, 25000);

        console.log("==================================================================");
        console.log("SwapAndLiquify event emitted");
        console.log("==================================================================");

        
    })
})

describe("55- _transferStandard function", async() =>{

    let getValue;   // for later use

    it("it should transfer to recipient, when both the sender & recipient are not excluded from reward", async() => {

    //making the sender and recipient exclude from rewards
    const senderExcludeStatus = await takeOffToken._isExcluded(owner.address);
    const recipientExcludeStatus = await takeOffToken._isExcluded(addr1.address);

    console.log("==================================================");    
    console.log(" Sender & recipient address exclude Status:");
    console.log("sender:", senderExcludeStatus);
    console.log("recipient", recipientExcludeStatus);
    console.log("==================================================");    

    //for comparing later
    const _rOwnedSenderPreviousValue = await takeOffToken._rOwned(owner.address);
    const _rOwnedRecipientPreviousValue = await takeOffToken._rOwned(addr1.address);


    const getValues = await takeOffToken._getValues(3000);
    getValue = getValues;
    await takeOffToken._transferStandard(owner.address, addr1.address, 3000);

    console.log("==================================================");    
    console.log("getValues:", getValues);
    console.log("==================================================");    


    //Taking the rAmount & rTransferAmount that is on index "0" &  "1" of getValues
    expect(_rOwnedSenderPreviousValue.sub(getValues[0])).to.equal(await takeOffToken._rOwned(owner.address)); 
    expect(_rOwnedRecipientPreviousValue.add(getValues[1])).to.equal(await takeOffToken._rOwned(addr1.address)); 

    console.log("==================================================");    
    console.log("Current Balance of the sender in _rOwned", await takeOffToken._rOwned(owner.address));
    console.log("Current Balance of the recipient in _rOwned", await takeOffToken._rOwned(addr1.address));
    console.log("==================================================");    
    })

    it("it should emit the Transfer Event", async() => {
        await expect(await takeOffToken._transferStandard(owner.address, addr1.address, 3000))
        .to.emit(takeOffToken, "Transfer")
        .withArgs(owner.address, addr1.address, getValue[3]);
        
    
        console.log("==================================================");  
        console.log("Transfer event emitted for _transferStandard function");  
        console.log("==================================================");  
    })
})


//TESTING _transferToExcluded FUNCTION -56
//PRIVATE FUNCTION
describe("56- _transferToExcluded function", async() =>{

    let getValue;   // for later use

    it("it should transfer to recipient, when sender is Excluded & recipient is not excluded from reward", async() => {

    //making the sender not excluded & recipient excluded from rewards

    //await takeOffToken.excludeFromReward(addr1.address);

    const senderExcludeStatus = await takeOffToken._isExcluded(owner.address);
    const recipientExcludeStatus = await takeOffToken._isExcluded(addr1.address)

    console.log("==================================================");    
    console.log(" Sender & recipient address exclude Status:");
    console.log("sender:", senderExcludeStatus );
    console.log("recipient", recipientExcludeStatus);
    console.log("==================================================");    

    //for comparing later
    const _rOwnedSenderPreviousValue = await takeOffToken._rOwned(owner.address);
    const _tOwnedRecipientPreviousValue = await takeOffToken._tOwned(addr1.address);
    const _rOwnedRecipientPreviousValue = await takeOffToken._rOwned(addr1.address);
    

    const getValues = await takeOffToken._getValues(5000);
    getValue = getValues;
    await takeOffToken._transferToExcluded(owner.address, addr1.address, 5000);

    console.log("==================================================");    
    console.log("getValues:", getValues);
    console.log("==================================================");    

   
    //Taking the rAmount, tTransferAmount & rTransferAmountthat is on index "0","1" &  "3" of getValues - comparison lines are written at the right of the code
    expect(_rOwnedSenderPreviousValue.sub(getValues[0])).to.equal(await takeOffToken._rOwned(owner.address)); //_rOwned[sender] = _rOwned[sender].sub(rAmount)
    expect(_tOwnedRecipientPreviousValue.add(getValues[3])).to.equal(await takeOffToken._tOwned(addr1.address)); // _tOwned[recipient] = _tOwned[recipient].add(tTransferAmount)
    expect(_rOwnedRecipientPreviousValue.add(getValues[1])).to.equal(await takeOffToken._rOwned(addr1.address));  //_rOwned[recipient] = _rOwned[recipient].add(rTransferAmount);

    console.log("==================================================");    
    console.log("Current Balance of the sender in _rOwned", await takeOffToken._rOwned(owner.address));
    console.log("Current Balance of the recipient in _tOwned", await takeOffToken._tOwned(addr1.address));
    console.log("Current Balance of the recipient in _rOwned", await takeOffToken._rOwned(addr1.address));
    console.log("==================================================");    

    })

    it("it should emit the Transfer Event", async() => {
        await expect(await takeOffToken._transferToExcluded(owner.address, addr1.address, 5000))
        .to.emit(takeOffToken, "Transfer")
        .withArgs(owner.address, addr1.address, getValue[3]);
        
        console.log("==================================================");  
        console.log("Transfer event emitted for _transferToExcluded function ");  
        console.log("==================================================");  
    })
})


//TESTING _transferToExcluded FUNCTION -56
//PRIVATE FUNCTION
describe("57- _transferFromExcluded function", async() =>{

    let getValue;   // for later use

    it("it should transfer to recipient, when sender is Excluded & recipient is not excluded from reward", async() => {


    console.log("balanceOf owner", await takeOffToken.balanceOf(owner.address));
    //making the sender excluded & recipient not excluded from rewards
     await takeOffToken.excludeFromReward(owner.address); 
    await takeOffToken.includeInReward(addr1.address);

    const senderExcludeStatus = await takeOffToken._isExcluded(owner.address);
    const recipientExcludeStatus = await takeOffToken._isExcluded(addr1.address)


    console.log("==================================================");    
    console.log(" Sender & recipient address exclude Status:");
    console.log("sender:", senderExcludeStatus);
    console.log("recipient", recipientExcludeStatus);
    console.log("==================================================");    

    //for comparing later
    const _tOwnedSenderPreviousValue = await takeOffToken._tOwned(owner.address);
    const _rOwnedSenderPreviousValue = await takeOffToken._rOwned(owner.address);
    const _rOwnedRecipientPreviousValue = await takeOffToken._rOwned(addr1.address);
    

    const getValues = await takeOffToken._getValues(2000);
    getValue = getValues;
    await takeOffToken._transferFromExcluded(owner.address, addr1.address, 2000);

    console.log("==================================================");    
    console.log("getValues:", getValues);
    console.log("==================================================");    

   
    // //Taking the rAmount, tTransferAmount & rTransferAmountthat is on index "0","1" &  "3" of getValues - comparison lines are written at the right of the code
    expect(_tOwnedSenderPreviousValue.sub(2000)).to.equal(await takeOffToken._tOwned(owner.address)); //_tOwned[sender] = _tOwned[sender].sub(tAmount); 
    expect(_rOwnedSenderPreviousValue.sub(getValues[0])).to.equal(await takeOffToken._rOwned(owner.address)); //_rOwned[sender] = _rOwned[sender].sub(rAmount)
    expect(_rOwnedRecipientPreviousValue.add(getValues[1])).to.equal(await takeOffToken._rOwned(addr1.address)); //_rOwned[recipient] = _rOwned[recipient].add(rTransferAmount)

    console.log("==================================================");    
    console.log("Current Balance of the sender in _rOwned", await takeOffToken._rOwned(owner.address));
    console.log("Current Balance of the recipient in _tOwned", await takeOffToken._tOwned(owner.address));
    console.log("Current Balance of the recipient in _rOwned", await takeOffToken._rOwned(addr1.address));
    console.log("==================================================");    

    })

    it("it should emit the Transfer Event", async() => {
        await expect(await takeOffToken._transferFromExcluded(owner.address, addr1.address, 2000))
        .to.emit(takeOffToken, "Transfer")
        .withArgs(owner.address, addr1.address, getValue[3]);
        
        console.log("==================================================");  
        console.log("Transfer event emitted for _transferFromExcluded function ");  
        console.log("==================================================");  
    })
})


describe("58- setMinTokensToSwapAndLiquify", async() => {
    it("should run setMinTokensToSwapAndLiquify function", async() => {

        await takeOffToken.setMinTokensToSwapAndLiquify(500);
        expect (await takeOffToken.numTokensSellToAddToLiquidity()).to.equal(500 * 10 ** 9);
    })

    it("it should emit MinTokensBeforeSwapUpdated event", async() => {

        await expect (await takeOffToken.setMinTokensToSwapAndLiquify(500))
        .to.emit(takeOffToken, "MinTokensBeforeSwapUpdated")
        .withArgs(500 * 10 ** 9);
    })
})

describe("59- isPossibleLiquidityAdd", ()=>{
    it("should return boolean value", async() =>{
        const isItPossible = await takeOffToken.isPossibleLiquidityAdd();
        expect(isItPossible).to.equal(false);
        console.log("==================================================");
        console.log("isPossibleLiquidityAdd : ",isItPossible);
        console.log("==================================================");
})
})

describe("60- setMinTokenAmount", async() => {
    
    it("Should revert with error string", async () =>{
        await expect(takeOffToken.setMinTokenAmount(0)).to.be.revertedWith(
            "Minimum token amount should be greater than zero."
        );
    })
    it("Should run setMinTokenAmount function", async () => {
        await takeOffToken.setMinTokenAmount(2); 
        const minTokenAmount = await takeOffToken.minTokenAmount();
        expect(minTokenAmount).to.be.equal(2);
        console.log("==================================================");
        console.log("Minimum Token Amount:", minTokenAmount);
        console.log("==================================================");
    })

    it("it should emit SetMinTokenAmount event", async() => {
        await expect (await takeOffToken.setMinTokenAmount(2))
        .to.emit(takeOffToken, "MinTokenAmountUpdated")
        .withArgs(2);
    })
})

describe("61- setMinEthAmount", async() => {
    
    it("Should revert with error string", async () =>{
        await expect(takeOffToken.setMinEthAmount(0)).to.be.revertedWith(
            "Minimum ETH amount should be greater than zero."
        );
    })

    it("Should run setMinEthAmount function", async () => {
        await takeOffToken.setMinEthAmount(3); 
        const minEthAmount = await takeOffToken.minEthAmount();
        expect(minEthAmount).to.be.equal(3);
        console.log("==================================================");
        console.log("Minimum ETH Amount:", minEthAmount);
        console.log("==================================================");
    })

    it("it should emit SetMinEthAmount event", async() => {
        await expect (await takeOffToken.setMinEthAmount(3))
        .to.emit(takeOffToken, "MinEthAmountUpdated")
        .withArgs(3);
    })
})