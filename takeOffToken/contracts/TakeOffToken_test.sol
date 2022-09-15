pragma solidity 0.8.4;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./IUniswapV2Factory.sol";
import "./IUniswapV2Pair.sol";
import "./IUniswapV2Router02.sol";

contract TakeOffToken_test is Context, ERC20Burnable, Ownable {
    using Address for address;

    mapping(address => uint256) public _rOwned;
    mapping(address => uint256) public _tOwned;
    mapping(address => bool) public walletLocked;
    mapping(address => bool) public _isExcludedFromFee;
    mapping(address => bool) public _isExcluded;
    mapping(address => uint256) public sellcooldown;
    mapping(address => uint256) public firstsell;
    mapping(address => uint256) public sellnumber;

    uint256 public constant MAX = ~uint256(0);
    uint256 public _tTotal = 500000000000 * 10**tokenDecimals;
    uint256 public _rTotal = (MAX - (MAX % _tTotal));
    uint256 public _tFeeTotal;
    uint256 public tokenTotalSupply = _tTotal;
    uint256 public latestEthBalance;
    uint256 public slippagePercentage;

    string public constant tokenName = "TAKEOFFTOKEN";
    string public constant tokenSymbol = "TOFF";
    uint8 public constant tokenDecimals = 9;

    uint256 public _taxFee = 2;
    uint256 public _previousTaxFee = _taxFee;

    uint256 public _liquidityFee = 2;
    uint256 public _previousLiquidityFee = _liquidityFee;

    uint256 public _burnFee = 1;
    uint256 public _previousBurnFee = _burnFee;

    uint256 public _maxAmount = 100000 * 10**9;
    uint256 public _maxBuyAmount = 250000000 * 10**9;
    uint256 public _maxSellAmount = 1600000 * 10**9;

    uint256 public constant _maxFee = 10;

    uint256 public numTokensSellToAddToLiquidity = 10 * 10**9;

    IUniswapV2Router02 public uniswapV2Router;
    IUniswapV2Pair public uniswapV2Pair;
    address public WETH;

    bool inSwapAndLiquify;

    event MinTokensBeforeSwapUpdated(uint256 minTokensBeforeSwap);
    event SwapAndLiquify(
        uint256 tokensSwapped,
        uint256 ethReceived,
        uint256 tokensIntoLiqudity
    );
    event LiquidityFee(uint256 liquidityFee);
    event ReflectionFee(uint256 reflectionFee);
    event BurnFee(uint256 burnFee);
    event ReflectionFeeUpdated(uint256 _feeTax);
    event LiquidityFeeUpdated(uint256 _feeLiauidity);
    event BurnFeeUpdated(uint256 _feeBurn);
    event MaxBuyLimitUpdated(uint256 _feeMax);
    event MaxSellLimitUpdated(uint256 _maxBuyPercent);
    event MaxLimitUpdated(uint256 _maxSellPercent);
    event SlippagePercentageUpdated(uint256 _slippagePercentage);
    event WithdrawalCompleted(uint256 _ethAmount);

    modifier lockTheSwap() {
        inSwapAndLiquify = true;
        _;
        inSwapAndLiquify = false;
    }

    constructor(address routerAddress) ERC20(tokenName, tokenSymbol) {
        _rOwned[_msgSender()] = _rTotal;

        IUniswapV2Router02 _uniswapV2Router = IUniswapV2Router02(routerAddress);
        WETH = _uniswapV2Router.WETH();
        _approve(address(this), routerAddress, MAX);

        address uniswapPairAddress = IUniswapV2Factory(
            _uniswapV2Router.factory()
        ).createPair(address(this), WETH);

        uniswapV2Router = _uniswapV2Router;
        uniswapV2Pair = IUniswapV2Pair(uniswapPairAddress);

        _isExcludedFromFee[owner()] = true;
        _isExcludedFromFee[address(this)] = true;

        emit Transfer(address(0), _msgSender(), tokenFromReflection(_rTotal));
    }

    function name() public pure override returns (string memory) {
        return tokenName;
    }

    function symbol() public pure override returns (string memory) {
        return tokenSymbol;
    }

    function totalSupply() public view override returns (uint256) {
        return tokenTotalSupply;
    }

    function decimals() public view virtual override returns (uint8) {
        return tokenDecimals;
    }

    function balanceOf(address account) public view override returns (uint256) {
        if (_isExcluded[account] == true) {
            return _tOwned[account];
        } else {
            return tokenFromReflection(_rOwned[account]);
        }
    }

    function batchTransfer(address[] memory recipient, uint256[] memory amount)
        external
        returns (bool)
    {
        require(
            recipient.length == amount.length,
            "You are passing wrong values"
        );
        for (uint8 i = 0; i < recipient.length; i++)
            _transfer(_msgSender(), recipient[i], amount[i]);
        return true;
    }

    function isExcludedFromReward(address account)
        external
        view
        returns (bool)
    {
        return _isExcluded[account];
    }

    function totalFees() external view returns (uint256) {
        return _tFeeTotal;
    }

    function setWalletLocked(address wallet) external onlyOwner {
        require(
            walletLocked[wallet] == false,
            "This account is already locked."
        );
        walletLocked[wallet] = true;
    }

    function setWalletUnLocked(address wallet) external onlyOwner {
        require(
            walletLocked[wallet] == true,
            "This account is already Unlocked."
        );
        walletLocked[wallet] = false;
    }

    function _burn(address account, uint256 amount) internal virtual override {
        require(
            balanceOf(account) >= amount,
            "ERC20: token amount exceeds from the balance"
        );
        uint256 r_amount = reflectionFromToken(amount, false);
        if (_isExcluded[account] == true) {
            _tOwned[account] -= amount;
            _rOwned[account] -= r_amount;
        } else {
            _rOwned[account] -= r_amount;
        }
        tokenTotalSupply -= amount;
        _tTotal -= amount;
        _rTotal -= r_amount;
        emit Transfer(account, address(0), amount);
    }

    function burn(uint256 amount) public override onlyOwner {
        require(
            _msgSender() != address(0),
            "ERC20: burn from the zero address"
        );
        address sender = _msgSender();
        _burn(sender, amount);
    }

    function reflectionFromToken(uint256 tAmount, bool deductTransferFee)
        public
        view
        returns (uint256)
    {
        require(tAmount <= _tTotal, "Amount must be less than supply");
        if (!deductTransferFee) {
            (uint256 rAmount, , , , , , ) = _getValues(tAmount);
            return rAmount;
        } else {
            (, uint256 rTransferAmount, , , , , ) = _getValues(tAmount);
            return rTransferAmount;
        }
    }

    function tokenFromReflection(uint256 rAmount)
        public
        view
        returns (uint256)
    {
        require(
            rAmount <= _rTotal,
            "Amount must be less than total reflections"
        );
        uint256 currentRate = _getRate();
        return rAmount / currentRate;
    }

    function excludeFromReward(address account) external onlyOwner {
        require(
            account != 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D,
            "We can not exclude Uniswap router."
        );
        require(!_isExcluded[account], "Account is already excluded");
        if (_rOwned[account] > 0) {
            _tOwned[account] = tokenFromReflection(_rOwned[account]);
        }

        _rTotal -= _rOwned[account];
        _tTotal -= _tOwned[account];
        _isExcluded[account] = true;
    }

    function includeInReward(address account) external onlyOwner {
        require(_isExcluded[account], "Account is already included");
        _tTotal += _tOwned[account];
        _rTotal += _rOwned[account];
        _tOwned[account] = 0;
        _isExcluded[account] = false;
    }

    function _transferBothExcluded(
        address sender,
        address recipient,
        uint256 tAmount
    ) public {
        (
            uint256 rAmount,
            uint256 rTransferAmount,
            uint256 rFee,
            uint256 tTransferAmount,
            uint256 tFee,
            uint256 tLiquidity,
            uint256 tBurn
        ) = _getValues(tAmount);
        uint256 tTotal;
        uint256 rTotal;
        _tOwned[sender] -= (tAmount);
        _rOwned[sender] -= (rAmount);
        _tOwned[recipient] += (tTransferAmount);
        _rOwned[recipient] += (rTransferAmount);

        tTotal = tAmount + tTransferAmount;
        rTotal = rAmount + rTransferAmount;

        _tTotal -= tTotal;
        _rTotal -= rTotal;

        _takeLiquidity(tLiquidity);
        _takeBurnFee(tBurn);
        _reflectFee(rFee, tFee);
        emit Transfer(sender, recipient, tTransferAmount);
    }

    function excludeFromFee(address account) external onlyOwner {
        require(
            _isExcludedFromFee[account] == false,
            "Account is already excluded from Fee."
        );
        _isExcludedFromFee[account] = true;
    }

    function includeInFee(address account) external onlyOwner {
        require(
            _isExcludedFromFee[account] == true,
            "Account is already included in Fee."
        );
        _isExcludedFromFee[account] = false;
    }

    function setMinTokensToSwapAndLiquify(uint256 minTokens)
        external
        onlyOwner
    {
        numTokensSellToAddToLiquidity = minTokens * 10**tokenDecimals;
        emit MinTokensBeforeSwapUpdated(numTokensSellToAddToLiquidity);
    }
    
    function setTaxFeePercent(uint256 taxFee) external onlyOwner {
        require(taxFee > 0 && taxFee <= _maxFee, "Fee percentage is invalid.");
        _taxFee = taxFee;
        emit ReflectionFeeUpdated(taxFee);
    }

    function setLiquidityFeePercent(uint256 liquidityFee) external onlyOwner {
        require(
            liquidityFee > 0 && liquidityFee <= _maxFee,
            "Fee percentage is invalid."
        );
        _liquidityFee = liquidityFee;
        emit LiquidityFeeUpdated(liquidityFee);
    }

    function setBurnFeePercent(uint256 burnFee) external onlyOwner {
        require(
            burnFee > 0 && burnFee <= _maxFee,
            "Fee percentage is invalid."
        );
        _burnFee = burnFee;
        emit BurnFeeUpdated(burnFee);
    }

    function setMaxBuyPercent(uint256 maxBuyPercent) external onlyOwner {
        _maxBuyAmount = (_tTotal * maxBuyPercent) / (10**2);
        emit MaxBuyLimitUpdated(maxBuyPercent);
    }

    function setMaxSellPercent(uint256 maxSellPercent) external onlyOwner {
        _maxSellAmount = (_tTotal * maxSellPercent) / (10**2);
        emit MaxSellLimitUpdated(maxSellPercent);
    }

    function setMaxPercent(uint256 maxPercent) external onlyOwner {
        _maxAmount = (_tTotal * maxPercent) / (10**2);
        emit MaxLimitUpdated(maxPercent);
    }

    function setSlippageValue(uint256 percentageAmount) external onlyOwner {
        require(
            percentageAmount > 0,
            "Slippage percentage must be greater than 0."
        );
        slippagePercentage = percentageAmount;
        emit SlippagePercentageUpdated(percentageAmount);
    }

    receive() external payable {}

    function _reflectFee(uint256 rFee, uint256 tFee) public {
        _rTotal = _rTotal - rFee;
        _tFeeTotal = _tFeeTotal + tFee;
        emit ReflectionFee(tFee);
    }

    function _getValues(uint256 tAmount)
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        (
            uint256 tTransferAmount,
            uint256 tFee,
            uint256 tLiquidity,
            uint256 tBurn
        ) = _getTValues(tAmount);
        (uint256 rAmount, uint256 rTransferAmount, uint256 rFee) = _getRValues(
            tAmount,
            tFee,
            tLiquidity,
            tBurn,
            _getRate()
        );
        return (
            rAmount,
            rTransferAmount,
            rFee,
            tTransferAmount,
            tFee,
            tLiquidity,
            tBurn
        );
    }

    function _getTValues(uint256 tAmount)
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        uint256 tFee = calculateTaxFee(tAmount);
        uint256 tLiquidity = calculateLiquidityFee(tAmount);
        uint256 tBurn = calculateBurnFee(tAmount);

        uint256 tTransferAmount = tAmount - tFee - tLiquidity - tBurn;
        return (tTransferAmount, tFee, tLiquidity, tBurn);
    }

    function _getRValues(
        uint256 tAmount,
        uint256 tFee,
        uint256 tLiquidity,
        uint256 tBurn,
        uint256 currentRate
    )
        public
        pure
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        uint256 rAmount = tAmount * currentRate;
        uint256 rFee = tFee * currentRate;
        uint256 rLiquidity = tLiquidity * currentRate;
        uint256 rBurn = tBurn * currentRate;

        uint256 rTransferAmount = rAmount - rFee - rLiquidity - rBurn;
        return (rAmount, rTransferAmount, rFee);
    }

    function _getRate() public view returns (uint256) {
        (uint256 rSupply, uint256 tSupply) = _getCurrentSupply();
        return rSupply / tSupply;
    }

    function _getCurrentSupply() public view returns (uint256, uint256) {
        return (_rTotal, _tTotal);
    }

    function _takeLiquidity(uint256 tLiquidity) public {
        uint256 currentRate = _getRate();
        uint256 rLiquidity = tLiquidity * currentRate;
        _rOwned[address(this)] = _rOwned[address(this)] + rLiquidity;
        if (_isExcluded[address(this)])
            _tOwned[address(this)] = _tOwned[address(this)] + tLiquidity;
        emit LiquidityFee(tLiquidity);
    }

    function _takeBurnFee(uint256 tBurn) public {
        uint256 currentRate = _getRate();
        uint256 rBurn = tBurn * currentRate;
        _rOwned[address(0)] = _rOwned[address(0)] + rBurn;
        if (_isExcluded[address(this)])
            _tOwned[address(0)] = _tOwned[address(0)] + tBurn;
        emit BurnFee(tBurn);
    }

    function calculateTaxFee(uint256 _amount) public view returns (uint256) {
        return (_amount * _taxFee) / (10**2);
    }

    function calculateLiquidityFee(uint256 _amount)
        public
        view
        returns (uint256)
    {
        return (_amount * _liquidityFee) / (10**2);
    }

    function calculateBurnFee(uint256 _amount) public view returns (uint256) {
        return (_amount * _burnFee) / (10**2);
    }

    function removeAllFee() public {
        _previousTaxFee = _taxFee;
        _previousBurnFee = _burnFee;
        _previousLiquidityFee = _liquidityFee;
        _taxFee = 0;
        _liquidityFee = 0;
        _burnFee = 0;
    }

    function restoreAllFee() public {
        _taxFee = _previousTaxFee;
        _liquidityFee = _previousLiquidityFee;
        _burnFee = _previousBurnFee;
    }

    function isExcludedFromFee(address account) external view returns (bool) {
        return _isExcludedFromFee[account];
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(walletLocked[to] == false, "Your wallet is locked.");
        require(walletLocked[from] == false, "Your wallet is locked.");
        require(amount > 0, "Transfer amount must be greater than zero");
        bool isRecipientMarketPair = address(uniswapV2Pair) == address(to);
        bool isSenderMarketPair = address(uniswapV2Pair) == address(from);
        if (
            isRecipientMarketPair &&
            !isSenderMarketPair &&
            from != owner() &&
            from != address(this)
        ) {
            require(sellcooldown[from] < block.timestamp);

            require(
                amount <= _maxSellAmount,
                "Transfer amount exceeds the Sell Limit."
            );

            if (firstsell[from] + (1 days) < block.timestamp) {
                sellnumber[from] = 0;
            }
            if (sellnumber[from] == 0) {
                sellnumber[from]++;
                firstsell[from] = block.timestamp;
            } else if (sellnumber[from] >= 1 && sellnumber[from] <= 3) {
                sellnumber[from]++;
            } else if (sellnumber[from] == 4) {
                sellnumber[from]++;
                sellcooldown[from] = firstsell[from] + (1 days);
            }
        } else if (
            !isRecipientMarketPair && isSenderMarketPair && to != owner()
        ) {
            require(
                amount <= _maxBuyAmount,
                "Transfer amount exceeds the Buy Limit."
            );
        } else {
            if (from != owner() && to != owner()) {
                require(
                    amount <= _maxAmount,
                    "Transfer amount exceeds the Sell Limit."
                );
            }
        }

        uint256 contractTokenBalance = balanceOf(address(this));

        uint256 numTokens = numTokensSellToAddToLiquidity;
        bool overMinTokenBalance = contractTokenBalance >= numTokens;
        if (
            overMinTokenBalance &&
            isRecipientMarketPair &&
            !isSenderMarketPair &&
            !inSwapAndLiquify
        ) {
            try this.swapAndLiquify(numTokens) {} catch {}
        }
        bool takeFee = true;
        if (_isExcludedFromFee[from] || _isExcludedFromFee[to]) {
            takeFee = false;
        }
        _tokenTransfer(from, to, amount, takeFee);
    }

    function swapAndLiquify(uint256 contractTokenBalance) external lockTheSwap {
        uint256 half = contractTokenBalance / 2;
        uint256 otherHalf = contractTokenBalance - half;

        swapTokensForEth(half);

        uint256 newBalance = address(this).balance;
        latestEthBalance = newBalance;

        addLiquidity(otherHalf, newBalance);

        emit SwapAndLiquify(half, newBalance, otherHalf);
    }

    function getMinEthAmount(uint256 _tokenAmount, address[] memory _path)
        public
        view
        returns (uint256)
    {
        uint256[] memory amounts = uniswapV2Router.getAmountsOut(
            _tokenAmount,
            _path
        );
        uint256 minEthAmount = (amounts[1] * slippagePercentage) / 100;
        return (amounts[1] - minEthAmount);
    }

    function getAmountsOut(uint256 _tokenAmount, address[] memory _path) public view returns(uint256[] memory returnedAmounts){
        returnedAmounts = uniswapV2Router.getAmountsOut(_tokenAmount, _path);
    }

    function swapTokensForEth(uint256 tokenAmount) public {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = WETH;

        uint256 _minEthAmount = getMinEthAmount(tokenAmount, path);

        uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            _minEthAmount,
            path,
            address(this),
            block.timestamp
        );
    }

    function getAmounts(uint256 tokensAmount, uint256 EthAmount)
        public
        view
        returns (uint256, uint256)
    {
        uint256 _minTokenAmount = tokensAmount -
            ((tokensAmount * slippagePercentage) / 100);
        uint256 _minEthAmount = (EthAmount * slippagePercentage) / 100;

        return (_minTokenAmount, EthAmount - _minEthAmount);
    }

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) public {
        (uint256 minTokenAmount, ) = getAmounts(
            tokenAmount,
            ethAmount
        );

        uniswapV2Router.addLiquidityETH{value: ethAmount}(
            address(this),
            tokenAmount,
            minTokenAmount,
            0,
            owner(),
            block.timestamp
        );
    }

    function _tokenTransfer(
        address sender,
        address recipient,
        uint256 amount,
        bool takeFee
    ) public {
        if (!takeFee) removeAllFee();
        if (_isExcluded[sender] && !_isExcluded[recipient]) {
            _transferFromExcluded(sender, recipient, amount);
        } else if (!_isExcluded[sender] && _isExcluded[recipient]) {
            _transferToExcluded(sender, recipient, amount);
        } else if (!_isExcluded[sender] && !_isExcluded[recipient]) {
            _transferStandard(sender, recipient, amount);
        } else if (_isExcluded[sender] && _isExcluded[recipient]) {
            _transferBothExcluded(sender, recipient, amount);
        } 
        if (!takeFee) restoreAllFee();
    }

    function _transferStandard(
        address sender,
        address recipient,
        uint256 tAmount
    ) public {
        (
            uint256 rAmount,
            uint256 rTransferAmount,
            uint256 rFee,
            uint256 tTransferAmount,
            uint256 tFee,
            uint256 tLiquidity,
            uint256 tBurn
        ) = _getValues(tAmount);

        _rOwned[sender] -= rAmount;
        _rOwned[recipient] += rTransferAmount;

        _takeLiquidity(tLiquidity);
        _takeBurnFee(tBurn);
        _reflectFee(rFee, tFee);
        emit Transfer(sender, recipient, tTransferAmount);
    }

    function _transferToExcluded(
        address sender,
        address recipient,
        uint256 tAmount
    ) public {
        (
            uint256 rAmount,
            uint256 rTransferAmount,
            uint256 rFee,
            uint256 tTransferAmount,
            uint256 tFee,
            uint256 tLiquidity,
            uint256 tBurn
        ) = _getValues(tAmount);
        _rOwned[sender] -= rAmount;
        _tOwned[recipient] += tTransferAmount;
        _rOwned[recipient] += rTransferAmount;

        _tTotal -= tTransferAmount;
        _rTotal -= rTransferAmount;

        _takeLiquidity(tLiquidity);
        _takeBurnFee(tBurn);
        _reflectFee(rFee, tFee);
        emit Transfer(sender, recipient, tTransferAmount);
    }

    function _transferFromExcluded(
        address sender,
        address recipient,
        uint256 tAmount
    ) public {
        (
            uint256 rAmount,
            uint256 rTransferAmount,
            uint256 rFee,
            uint256 tTransferAmount,
            uint256 tFee,
            uint256 tLiquidity,
            uint256 tBurn
        ) = _getValues(tAmount);
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

    function contractEthBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdrawFromContract() public onlyOwner {
        uint256 contractEthBal = address(this).balance;
        require(
            contractEthBal > 0,
            "Contract balance must be greater than zero."
        );
        (bool success, ) = payable(owner()).call{value: contractEthBal}("");

        if (!success) {
            revert("Payment Sending Failed");
        } else {
            emit WithdrawalCompleted(contractEthBal);
        }
    }
}
