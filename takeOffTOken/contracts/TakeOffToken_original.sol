pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./IUniswapV2Factory.sol";
import "./IUniswapV2Pair.sol";
import "./IUniswapV2Router02.sol";

contract TakeOffToken is Context, ERC20Burnable, Ownable {
   
    using Address for address;
   
    mapping (address => uint256) private _rOwned;
    mapping (address => uint256) private _tOwned;
    mapping (address => bool) public walletLocked;
    mapping (address => mapping (address => uint256)) private _allowances;
    mapping (address => bool) private _isExcludedFromFee;
    mapping (address => bool) private _isExcluded;
    mapping(address => uint256) private sellcooldown;
    mapping(address => uint256) private firstsell;
    mapping(address => uint256) private sellnumber;
    
    uint256 private constant MAX = ~uint256(0);
    uint256 private _tTotal = 500000000000 * 10 ** _decimals;
    uint256 private _rTotal = (MAX - (MAX % _tTotal));
    uint256 private _tFeeTotal;
    uint256 private _totalSupply = _tTotal;
    uint private latestEthBalance;   //will store the current Eth balance after converting the half balance of the contract 

    string private constant _name = "TAKEOFFTOKEN";
    string private constant _symbol = "TOFF";
    uint8 private constant _decimals = 9;
    
    uint256 public _taxFee = 2;
    uint256 private _previousTaxFee = _taxFee;
    
    uint256 public _liquidityFee = 2;
    uint256 private _previousLiquidityFee = _liquidityFee;
    uint256 private _liquidityFeeConstant = _liquidityFee;
    
    uint256 public _burnFee = 1;
    uint256 private _previousBurnFee = _burnFee;
    
    uint256 public _maxAmount = 100000 * 10**9;
    uint256 public _maxBuyAmount = 250000000 * 10**9;
    uint256 public _maxSellAmount = 1600000 * 10**9;
    
    uint256 private constant _maxFee = 10;

    uint256 private numTokensSellToAddToLiquidity = 3000000 * 10**1 * 10**9;
    // uint256 public numTokensSellToAddToLiquidity = 100 * 10 ** 9;    //for testing
    
    // We are using this variables for swapTokenForEth and addLiquidity functions
    uint256 private minTokenAmount;
    uint256 private minEthAmount;

    IUniswapV2Router02 public uniswapV2Router;
    IUniswapV2Pair public uniswapV2Pair;
    address private WETH;

    bool inSwapAndLiquify;
    bool public swapAndLiquifyEnabled = true;
    
    event MinTokensBeforeSwapUpdated(uint256 minTokensBeforeSwap);
    event SwapAndLiquifyEnabledUpdated(bool enabled);
    event SwapAndLiquify(uint256 tokensSwapped, uint256 ethReceived, uint256 tokensIntoLiqudity);
    event LiquidityFee(uint256 liquidityFee);
    event ReflectionFee(uint256 reflectionFee);
    event BurnFee(uint256 burnFee);
    event ReflectionFeeUpdated(uint256 _feeTax);
    event LiquidityFeeUpdated(uint256 _feeLiauidity);
    event BurnFeeUpdated(uint256 _feeBurn);
    event MaxBuyLimitUpdated(uint256 _feeMax);
    event MaxSellLimitUpdated(uint256 _maxBuyPercent);
    event MaxLimitUpdated(uint256 _maxSellPercent);
    event MinTokenAmountUpdated(uint256 _minTokenAmount);
    event MinEthAmountUpdated(uint256 _minEthAmount);

    modifier lockTheSwap {
        inSwapAndLiquify = true;
        _;
        inSwapAndLiquify = false;
    }
    
    
    constructor(address routerAddress) ERC20(
        _name,
        _symbol
    ) {
        _rOwned[_msgSender()] = _rTotal;
        minTokenAmount = 1;
        minEthAmount = 1;

        // UniswapRouter02 address:
        //0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
         
        IUniswapV2Router02 _uniswapV2Router = IUniswapV2Router02(routerAddress);
        WETH = _uniswapV2Router.WETH();
        _approve(address(this), routerAddress, MAX);

         // Create a uniswap pair for this new token
        address uniswapPairAddress = IUniswapV2Factory(_uniswapV2Router.factory())
        .createPair(address(this), WETH);
        
    
        uniswapV2Router = _uniswapV2Router;
        uniswapV2Pair = IUniswapV2Pair(uniswapPairAddress);
        
        
        //exclude owner and this contract from fee
        _isExcludedFromFee[owner()] = true;
        _isExcludedFromFee[address(this)] = true;
        
        emit Transfer(address(0), _msgSender(), _tTotal);
    }

    function totalSupply() public view override returns(uint256){
        return _totalSupply;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    // THIS WILL RETURN THE BALANCE OF THE ACCOUNT ADDRESS
    function balanceOf(address account) public view override returns (uint256) {
        if (_isExcluded[account] == true){
            return _tOwned[account];
        } else{
            return tokenFromReflection(_rOwned[account]);
        }
    }
    
    // THIS FUNCTION WILL CALL
    // WHEN SOMEONE BUY, SELL, OR TRANSFER THE TOKENS 
    function batchTransfer(address[] memory recipient, uint256[] memory amount) external returns (bool) {
        require(recipient.length == amount.length,"You are passing wrong values");
        for(uint8 i = 0; i < recipient.length; i++)
            _transfer(_msgSender(), recipient[i], amount[i]);    
        return true;
    }

    // THIS FUNCTION WILL RETURN TRUE OR FALSE
    // YOU USE THIS FUNCTION FOR CHECKING THE ACCOUNT IS EXCLUDED FROM THE REWARD OR NOT.
    // IF AN ADDRESS IS EXCLUDED FROM THE REWARD THEN THE FUNCTION WILL RETURN TRUE.
    function isExcludedFromReward(address account) external view returns (bool) {
        return _isExcluded[account];
    }

    // IT WILL RETURN THE TOTAL FEES 
    function totalFees() external view returns (uint256) {
        return _tFeeTotal;
    }
    
    // THIS FUNCTION WILL USE FOR LOCK THE WALLET
    function setWalletLocked(address wallet) external onlyOwner{
        require(walletLocked[wallet] == false,"This account is already locked.");
        walletLocked[wallet] = true;
    }
    
    // THIS FUNCTION WILL USE FOR UNLOCK THE WALLET
    function setWalletUnLocked(address wallet) external onlyOwner{
        require(walletLocked[wallet] == true,"This account is already Unlocked.");
        walletLocked[wallet] = false;
    }
    
    function _burn(address account, uint amount) internal virtual override{
        require(account != address(0), "ERC20: burn from the zero address");
        require(balanceOf(account) >= amount, "ERC20: token amount exceeds from the balance");


        _beforeTokenTransfer(account, address(0), amount);

        emit Transfer(account, address(0), amount);

        _afterTokenTransfer(account, address(0), amount);
    }

    //THIS FUNCTION WILL USE FOR BURNING THE TOKENS
    function burn(uint256 amount) public override onlyOwner {
        require(_msgSender() != address(0), "ERC20: burn from the zero address");
        address sender = _msgSender();        
     
        uint256 r_amount = reflectionFromToken(amount, false);
        _burn(sender, amount);
       

        if (_isExcluded[sender] == true) {
            _tOwned[sender] -= amount;
            _rOwned[sender] -= r_amount;
        } else {
            _rOwned[sender] -= r_amount;
        }

        _totalSupply -= amount;
        _tTotal -= amount;
        _rTotal -= r_amount; //subtracting from the total reflection
    }

    // THIS FUNCTION WILL RETURN THE BALANCE IN MAX NUMBER
    // IF THE "deductTransferFee" WILL TRUE THEN IT WILL CALCULATE THE TAX FEE AND SHOW THE ESTIMATE VALUE 
    function reflectionFromToken(uint256 tAmount, bool deductTransferFee) public view returns(uint256) {
        require(tAmount <= _tTotal, "Amount must be less than supply");
        if (!deductTransferFee) {
            (uint256 rAmount,,,,,,) = _getValues(tAmount);
            return rAmount;
        } else {
            (,uint256 rTransferAmount,,,,,) = _getValues(tAmount);
            return rTransferAmount;
        }
    }
    
    // THIS FUNCTION WILL CONVERT THE MAX NUMNER IN NORMAL DECIMAL NUMBER
    function tokenFromReflection(uint256 rAmount) public view returns(uint256) {
        require(rAmount <= _rTotal, "Amount must be less than total reflections");
        uint256 currentRate =  _getRate();
        return rAmount/currentRate;
    }

    // THIS FUNCTION WILL EXCLUDE THE ADDRESS FROM THE HOLDERS DISTRIBUTION REWARD 
    function excludeFromReward(address account) external onlyOwner() {
        //require(account != 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D, 'We can not exclude Uniswap router.');
        require(!_isExcluded[account], "Account is already excluded");
        if(_rOwned[account] > 0) {
            _tOwned[account] = tokenFromReflection(_rOwned[account]);
        }

        _rTotal -= _rOwned[account];
        _tTotal -= _tOwned[account];
        _isExcluded[account] = true;
    }
    
    // THIS FUNCTION WILL INCLUDE THE ADDRESS IN THE HOLDERS DISTRIBUTION REWARD 
    function includeInReward(address account) external onlyOwner() {
        require(_isExcluded[account], "Account is already included");
        _tTotal += _tOwned[account];    //line added
        _rTotal += _rOwned[account];
        _tOwned[account] = 0;
        _isExcluded[account] = false;
    }
    
    // THIS FUNCTION WILL CALL WHEN RECIPIENT AND SENDER BOTH THE EXCLUDED FROM THE FEES
    function _transferBothExcluded(address sender, address recipient, uint256 tAmount) private {
        (uint256 rAmount, uint256 rTransferAmount, uint256 rFee, uint256 tTransferAmount, uint256 tFee, uint256 tLiquidity, uint256 tBurn) = _getValues(tAmount);
        uint256 tTotal;
        uint256 rTotal;
        _tOwned[sender]-= (tAmount);
        _rOwned[sender] -=(rAmount) ;
        _tOwned[recipient] +=(tTransferAmount) ;
        _rOwned[recipient] += (rTransferAmount) ;     
        
        tTotal = tAmount + tTransferAmount;
        rTotal = rAmount + rTransferAmount;

        _tTotal -= tTotal;
        _rTotal -= rTotal;

        _takeLiquidity(tLiquidity);
        _takeBurnFee(tBurn);
        _reflectFee(rFee, tFee);
        emit Transfer(sender, recipient, tTransferAmount);
    }
    
    function setMinTokensToSwapAndLiquify(uint256 minTokens) external onlyOwner {
        numTokensSellToAddToLiquidity = minTokens * 10 ** _decimals;
        emit MinTokensBeforeSwapUpdated(numTokensSellToAddToLiquidity);
    }

    function setMinTokenAmount(uint256 _minTokenAmount) external onlyOwner {
        require(_minTokenAmount > 0, "Minimum token amount should be greater than zero.");
        minTokenAmount = _minTokenAmount;
        emit MinTokenAmountUpdated(minTokenAmount);
    }

    function setMinEthAmount(uint256 _minEthAmount) external onlyOwner {
        require(_minEthAmount > 0, "Minimum ETH amount should be greater than zero.");
        minEthAmount = _minEthAmount;
        emit MinEthAmountUpdated(minEthAmount);
    }

    // THIS FUNCTION WILL EXCLUDE THE ADDRESS FROM THE FEE AND IT CAN ONLY CALL BY OWNER
    function excludeFromFee(address account) external onlyOwner {
        _isExcludedFromFee[account] = true;
    }
    
    // THIS FUNCTION WILL INCLUDE THE ADDRESS IN THE FEE AND IT CAN ONLY CALL BY OWNER
    function includeInFee(address account) external onlyOwner {
        _isExcludedFromFee[account] = false;
    }
    
    // THIS FUNCTION WILL SET HOLDERS DISTRIBUTION PERCENTAGE AND IT CAN ONLY CALL BY OWNER 
    function setTaxFeePercent(uint256 taxFee) external onlyOwner() {
        require(taxFee > 0 && taxFee <= _maxFee, "Fee percentage is invalid.");
        _taxFee = taxFee;
        emit ReflectionFeeUpdated(taxFee);
    }
    
    // THIS FUNCTION WILL SET LIQUIDITY FEE PERCENTAGE AND IT CAN ONLY CALL BY OWNER 
    function setLiquidityFeePercent(uint256 liquidityFee) external onlyOwner() {
        require(liquidityFee > 0 && liquidityFee <= _maxFee, "Fee percentage is invalid.");
        _liquidityFee = liquidityFee;
        emit LiquidityFeeUpdated(liquidityFee);
    }
    
    // THIS FUNCTION WILL SET THE BURN FEE PERCENTAGE AND IT CAN ONLY CALL BY OWNER 
    function setBurnFeePercent(uint256 burnFee) external onlyOwner() {
        require(burnFee > 0 && burnFee <= _maxFee, "Fee percentage is invalid.");
        _burnFee = burnFee;
        emit BurnFeeUpdated(burnFee);
    }
    
   // THIS FUNCTION WILL SET THE MAX VALUE FOR BUYING TOKENS AND IT CAN ONLY CALL BY OWNER 
   function setMaxBuyPercent(uint256 maxBuyPercent) external onlyOwner() {
        _maxBuyAmount = (_tTotal*maxBuyPercent)/(
            10**2
        );
        emit MaxBuyLimitUpdated(maxBuyPercent);
    }

    // THIS FUNCTION WILL SET THE MAX VALUE FOR SELLING TOKENS AND IT CAN ONLY CALL BY OWNER 
   function setMaxSellPercent(uint256 maxSellPercent) external onlyOwner() {
        _maxSellAmount = (_tTotal*maxSellPercent)/(
            10**2
        );
        emit MaxSellLimitUpdated(maxSellPercent);
    }

    // THIS FUNCTION WILL SET THE MAX VALUE OF TOKEN AND IT CAN ONLY CALL BY OWNER 
   function setMaxPercent(uint256 maxPercent) external onlyOwner() {
        _maxAmount = (_tTotal*maxPercent)/(
            10**2
        );
        emit MaxLimitUpdated(maxPercent);
    }

    // IF THE "SwapAndLiquify" IS "true" THEN IT MEANS CONTRACT CAN ADD LIQUIDITY
    function setSwapAndLiquifyEnabled(bool _enabled) external onlyOwner {
        swapAndLiquifyEnabled = _enabled;
        emit SwapAndLiquifyEnabledUpdated(_enabled);
    }
    
     //to recieve ETH from uniswapV2Router when swaping
    receive() external payable {}

    // public FUMCTIONS :-
    function _reflectFee(uint256 rFee, uint256 tFee) private {
        _rTotal = _rTotal-rFee;
        _tFeeTotal = _tFeeTotal+tFee;
        emit ReflectionFee(tFee);
    }

    function _getValues(uint256 tAmount) private view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256) {
        (uint256 tTransferAmount, uint256 tFee, uint256 tLiquidity, uint256 tBurn) = _getTValues(tAmount);
        (uint256 rAmount, uint256 rTransferAmount, uint256 rFee) = _getRValues(tAmount, tFee, tLiquidity, tBurn, _getRate());
        return (rAmount, rTransferAmount, rFee, tTransferAmount, tFee, tLiquidity, tBurn);
    }

    function _getTValues(uint256 tAmount) private view returns (uint256, uint256, uint256, uint256) {
        uint256 tFee = calculateTaxFee(tAmount);
        uint256 tLiquidity = calculateLiquidityFee(tAmount);
        uint256 tBurn = calculateBurnFee(tAmount);
        
        uint256 tTransferAmount = tAmount-tFee-tLiquidity-tBurn;
        return (tTransferAmount, tFee, tLiquidity, tBurn);
    }

    function _getRValues(uint256 tAmount, uint256 tFee, uint256 tLiquidity, uint256 tBurn, uint256 currentRate) private pure returns (uint256, uint256, uint256) {
        uint256 rAmount = tAmount*currentRate;
        uint256 rFee = tFee*currentRate;
        uint256 rLiquidity = tLiquidity*currentRate;
        uint256 rBurn = tBurn*currentRate;
        
        uint256 rTransferAmount = rAmount-rFee-rLiquidity-rBurn;
        return (rAmount, rTransferAmount, rFee);
    }

    function _getRate() private view returns(uint256) {
        (uint256 rSupply, uint256 tSupply) = _getCurrentSupply();
        return rSupply/tSupply;
    }

    function _getCurrentSupply() private view returns(uint256, uint256) {
        return (_rTotal, _tTotal);
    }
    
    function _takeLiquidity(uint256 tLiquidity) private {
        uint256 currentRate =  _getRate();
        uint256 rLiquidity = tLiquidity*currentRate;
        _rOwned[address(this)] = _rOwned[address(this)]+rLiquidity;
        if(_isExcluded[address(this)])
            _tOwned[address(this)] = _tOwned[address(this)]+tLiquidity;
        emit LiquidityFee(tLiquidity);
    }


    function _takeBurnFee(uint256 tBurn) private{
        uint256 currentRate = _getRate();
        uint256 rBurn = tBurn*currentRate;
        _rOwned[address(0)] = _rOwned[address(0)]+rBurn;
        if(_isExcluded[address(this)])
            _tOwned[address(0)] = _tOwned[address(0)]+tBurn;
        emit BurnFee(tBurn);
    }
    
    function calculateTaxFee(uint256 _amount) private view returns (uint256) {
        return _amount*_taxFee/(
            10**2
        );
    }

    function calculateLiquidityFee(uint256 _amount) private view returns (uint256) {
        return _amount*_liquidityFee/(
            10**2
        );
    }
    
    function calculateBurnFee(uint256 _amount) private view returns (uint256) {
        return _amount*_burnFee/(
            10**2
        );
    }
    
    function removeAllFee() private {
        if(_taxFee == 0 && _liquidityFee == 0 && _burnFee == 0) return;
        _previousTaxFee = _taxFee;
        _previousBurnFee = _burnFee;
        _previousLiquidityFee = _liquidityFee;
        _taxFee = 0;
        _liquidityFee = 0;
        _burnFee = 0;
    }

    function restoreAllFee(bool _afterLiquidity) private {
        _taxFee = _previousTaxFee;
        if(_afterLiquidity == true)
            _liquidityFee = _liquidityFeeConstant;
        else
            _liquidityFee = _previousLiquidityFee;
        _burnFee = _previousBurnFee;
    }

    function isExcludedFromFee(address account) external view returns(bool) {
        return _isExcludedFromFee[account];
    }

    // isPossibleLiquidityAdd checks if there's any extra WETH in the pair. If there is,
    // the user might be trying to add liquidity with WETH first. This will prevent the tx
    // from failing by swapping and liquifying if that is the case.
    function isPossibleLiquidityAdd() private view returns (bool) {
        uint256 wethBal = IERC20(WETH).balanceOf(address(uniswapV2Pair));
        (uint256 r0, uint256 r1,) = uniswapV2Pair.getReserves();
        if(uniswapV2Pair.token0() == address(this)) {
            return wethBal > r1;
        }
        return wethBal > r0;
    }
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(walletLocked[to] == false,"Your wallet is locked.");
        require(walletLocked[from] == false,"Your wallet is locked.");
        require(amount > 0, "Transfer amount must be greater than zero");
        bool isRecipientMarketPair =  address(uniswapV2Pair) == address(to);
        bool isSenderMarketPair = address(uniswapV2Pair) == address(from);
        if (isRecipientMarketPair && !isSenderMarketPair && from != owner()  && from != address(this)) {
            require(sellcooldown[from] < block.timestamp);
            //if(from != owner()){
                require(amount <= _maxSellAmount, "Transfer amount exceeds the Sell Limit.");
            //}
            if(firstsell[from] + (1 days) < block.timestamp){
                sellnumber[from] = 0;
            }
            if (sellnumber[from] == 0) {
                sellnumber[from]++;
                firstsell[from] = block.timestamp;
            }
            else if (sellnumber[from] == 1) {
                sellnumber[from]++;
            }
            else if (sellnumber[from] == 2) {
                sellnumber[from]++;
            }
            else if (sellnumber[from] == 3) {
                sellnumber[from]++;
            }
            else if (sellnumber[from] == 4) {
                sellnumber[from]++;
                sellcooldown[from] = firstsell[from] + (1 days);
            }
            setFee(sellnumber[from]);
        }else if(!isRecipientMarketPair && isSenderMarketPair && to != owner()){
            //if(to != owner())
                require(amount <= _maxBuyAmount, "Transfer amount exceeds the Buy Limit.");
        }else{
            if(from != owner() && to != owner()){
                require(amount <= _maxAmount, "Transfer amount exceeds the Sell Limit.");
            }
        }
        // is the token balance of this contract address over the min number of
        // tokens that we need to initiate a swap + liquidity lock?
        // also, don't get caught in a circular liquidity event.
        // also, don't swap & liquify if sender is uniswap pair.
        uint256 contractTokenBalance = balanceOf(address(this));
        bool afterLiquidity = false;
        uint256 numTokens = numTokensSellToAddToLiquidity;
        bool overMinTokenBalance = contractTokenBalance >= numTokens;
        if (
            overMinTokenBalance &&
            !inSwapAndLiquify &&
            isRecipientMarketPair && // Only swap & liquify on sells.
            !isSenderMarketPair &&
            swapAndLiquifyEnabled
        ) {
            // Try to swap and liquify.
            try this.swapAndLiquify(numTokens) {
                afterLiquidity = true;
            } catch {}
        }
        bool takeFee = true;
        if(_isExcludedFromFee[from] || _isExcludedFromFee[to]){
            takeFee = false;
        }
        _tokenTransfer(from, to, amount, takeFee, afterLiquidity);
        restoreAllFee(afterLiquidity);
    }



    function setFee(uint256 multiplier) private {
        _previousLiquidityFee = _liquidityFee;
        _liquidityFee = _liquidityFee+multiplier;
    }

    function swapAndLiquify(uint256 contractTokenBalance) external lockTheSwap {
        require(msg.sender == address(this), "can only be called by the contract");
        // Perform the possible liquidity add check in here as it makes a call
        // to UniswapRouter and we want to lock all calls to the router
        // in a try/catch statement to avoid potential breakage due to
        // incorrect router address being set.
        require(!isPossibleLiquidityAdd(), "possible liquidity added");

        // split the contract balance into halves
        uint256 half = contractTokenBalance / 2;
        uint256 otherHalf = contractTokenBalance - half;
        
        // swap tokens for ETH
        swapTokensForEth(half, minEthAmount);

        // how much ETH did we just swap into?
        uint256 newBalance = address(this).balance;
        latestEthBalance = newBalance;

        // add liquidity to uniswap
        addLiquidity(otherHalf, newBalance, minTokenAmount, minEthAmount);
        
        emit SwapAndLiquify(half, newBalance, otherHalf);
    }

    function swapTokensForEth(uint256 tokenAmount, uint256 _minEthAmount) private {
        // generate the uniswap pair path of token -> weth
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = WETH;

        uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            _minEthAmount, // accept any amount of ETH
            path,
            address(this),
            block.timestamp
        );
    }

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount, uint256 _minTokenAmount, uint256 _minEthAmount) private {
        // add the liquidity
        uniswapV2Router.addLiquidityETH{value: ethAmount}(
            address(this),
            tokenAmount,
            _minTokenAmount, // slippage is unavoidable
            _minEthAmount, // slippage is unavoidable
            owner(),
            block.timestamp
        );
    }


    //this method is responsible for taking all fee, if takeFee is true
    function _tokenTransfer(address sender, address recipient, uint256 amount, bool takeFee, bool _afterLiquidity) private {
        if(!takeFee)
            removeAllFee();
        if (_isExcluded[sender] && !_isExcluded[recipient]) {
            _transferFromExcluded(sender, recipient, amount);
        } else if (!_isExcluded[sender] && _isExcluded[recipient]) {
            _transferToExcluded(sender, recipient, amount);
        } else if (!_isExcluded[sender] && !_isExcluded[recipient]) {
            _transferStandard(sender, recipient, amount);
        } else if (_isExcluded[sender] && _isExcluded[recipient]) {
            _transferBothExcluded(sender, recipient, amount);
        } else {
            _transferStandard(sender, recipient, amount);
        }
        if(!takeFee)
            restoreAllFee(_afterLiquidity);
    }

     function _transferStandard(address sender, address recipient, uint256 tAmount) private {
        (uint256 rAmount, uint256 rTransferAmount, uint256 rFee, uint256 tTransferAmount, uint256 tFee, uint256 tLiquidity, uint256 tBurn) = _getValues(tAmount);
        
        
        _rOwned[sender] -= rAmount;
        _rOwned[recipient] += rTransferAmount;


        _takeLiquidity(tLiquidity);
        _takeBurnFee(tBurn);
        _reflectFee(rFee, tFee);
        emit Transfer(sender, recipient, tTransferAmount);
    }

    function _transferToExcluded(address sender, address recipient, uint256 tAmount) private {
        (uint256 rAmount, uint256 rTransferAmount, uint256 rFee, uint256 tTransferAmount, uint256 tFee, uint256 tLiquidity, uint256 tBurn) = _getValues(tAmount);
        _rOwned[sender]-= rAmount;
        _tOwned[recipient] += tTransferAmount;
        _rOwned[recipient] += rTransferAmount;   

        _tTotal -= tTransferAmount;
        _rTotal -= rTransferAmount;

        _takeLiquidity(tLiquidity);
        _takeBurnFee(tBurn);
        _reflectFee(rFee, tFee);
        emit Transfer(sender, recipient, tTransferAmount);
    }

    function _transferFromExcluded(address sender, address recipient, uint256 tAmount) private {
        (uint256 rAmount, uint256 rTransferAmount, uint256 rFee, uint256 tTransferAmount, uint256 tFee, uint256 tLiquidity, uint256 tBurn) = _getValues(tAmount);
        _tOwned[sender] -= tAmount;
        _rOwned[sender] -= rAmount;
        _rOwned[recipient] += rTransferAmount;  

        _rTotal -= rAmount;
        _tTotal -= tAmount;

        _takeLiquidity(tLiquidity);
        _takeBurnFee(tBurn);
        _reflectFee(rFee, tFee);
        emit Transfer(sender, recipient, tTransferAmount);
    }
}