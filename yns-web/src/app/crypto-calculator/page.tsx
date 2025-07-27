'use client';

import { useState, useEffect } from 'react';
import { ChartBarIcon, CurrencyDollarIcon, TrendingUpIcon, TrendingDownIcon } from '@heroicons/react/24/outline';

interface CalculatorState {
  averageBuyPrice: string;
  currentPrice: string;
  investmentAmount: string;
  currentProfit: string;
  selectedCrypto: string;
}

export default function CryptoCalculator() {
  const [values, setValues] = useState<CalculatorState>({
    averageBuyPrice: '',
    currentPrice: '',
    investmentAmount: '',
    currentProfit: '',
    selectedCrypto: 'BTC'
  });

  const [lastUpdated, setLastUpdated] = useState<string>('');

  const cryptos = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'ADA', name: 'Cardano' },
    { symbol: 'DOT', name: 'Polkadot' },
    { symbol: 'LINK', name: 'Chainlink' },
    { symbol: 'XRP', name: 'Ripple' },
    { symbol: 'LTC', name: 'Litecoin' },
    { symbol: 'BCH', name: 'Bitcoin Cash' }
  ];

  // Calculate missing value when 3 out of 4 inputs are filled
  useEffect(() => {
    const filledCount = [values.averageBuyPrice, values.currentPrice, values.investmentAmount, values.currentProfit]
      .filter(v => v !== '').length;

    if (filledCount === 3) {
      calculateMissingValue();
    }
  }, [values.averageBuyPrice, values.currentPrice, values.investmentAmount, values.currentProfit]);

  const calculateMissingValue = () => {
    const { averageBuyPrice, currentPrice, investmentAmount, currentProfit } = values;

    // Convert string values to numbers for calculation
    const avgPrice = parseFloat(averageBuyPrice);
    const curPrice = parseFloat(currentPrice);
    const investment = parseFloat(investmentAmount);
    const profit = parseFloat(currentProfit);

    if (!averageBuyPrice && currentPrice && investmentAmount && currentProfit) {
      // Calculate average buy price
      // profit = (currentPrice - avgPrice) * (investment / avgPrice)
      // profit = investment * (currentPrice / avgPrice - 1)
      // profit / investment + 1 = currentPrice / avgPrice
      // avgPrice = currentPrice / (profit / investment + 1)
      const calculatedAvgPrice = curPrice / (profit / investment + 1);
      setValues(prev => ({ ...prev, averageBuyPrice: calculatedAvgPrice.toFixed(6) }));
      setLastUpdated('averageBuyPrice');
    } else if (!currentPrice && averageBuyPrice && investmentAmount && currentProfit) {
      // Calculate current price
      // profit = investment * (currentPrice / avgPrice - 1)
      // currentPrice = avgPrice * (profit / investment + 1)
      const calculatedCurrentPrice = avgPrice * (profit / investment + 1);
      setValues(prev => ({ ...prev, currentPrice: calculatedCurrentPrice.toFixed(6) }));
      setLastUpdated('currentPrice');
    } else if (!investmentAmount && averageBuyPrice && currentPrice && currentProfit) {
      // Calculate investment amount
      // profit = investment * (currentPrice / avgPrice - 1)
      // investment = profit / (currentPrice / avgPrice - 1)
      const priceRatio = curPrice / avgPrice - 1;
      if (priceRatio !== 0) {
        const calculatedInvestment = profit / priceRatio;
        setValues(prev => ({ ...prev, investmentAmount: calculatedInvestment.toFixed(2) }));
        setLastUpdated('investmentAmount');
      }
    } else if (!currentProfit && averageBuyPrice && currentPrice && investmentAmount) {
      // Calculate current profit
      // profit = investment * (currentPrice / avgPrice - 1)
      const calculatedProfit = investment * (curPrice / avgPrice - 1);
      setValues(prev => ({ ...prev, currentProfit: calculatedProfit.toFixed(2) }));
      setLastUpdated('currentProfit');
    }
  };

  const handleInputChange = (field: keyof CalculatorState, value: string) => {
    // Clear the last updated field if user starts typing in it
    if (field === lastUpdated) {
      setLastUpdated('');
    }
    
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const clearAll = () => {
    setValues({
      averageBuyPrice: '',
      currentPrice: '',
      investmentAmount: '',
      currentProfit: '',
      selectedCrypto: values.selectedCrypto
    });
    setLastUpdated('');
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProfitIcon = (profit: number) => {
    if (profit > 0) return <TrendingUpIcon className="h-5 w-5 text-green-600" />;
    if (profit < 0) return <TrendingDownIcon className="h-5 w-5 text-red-600" />;
    return <ChartBarIcon className="h-5 w-5 text-gray-600" />;
  };

  const profitValue = parseFloat(values.currentProfit) || 0;
  const investmentValue = parseFloat(values.investmentAmount) || 0;
  const profitPercentage = investmentValue > 0 ? (profitValue / investmentValue) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Crypto Average-Down Calculator
          </h1>
          <p className="text-lg text-gray-600">
            Calculate your cryptocurrency investment metrics. Fill any 3 fields and the 4th will be calculated automatically.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Crypto Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Cryptocurrency
            </label>
            <select
              value={values.selectedCrypto}
              onChange={(e) => handleInputChange('selectedCrypto', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {cryptos.map((crypto) => (
                <option key={crypto.symbol} value={crypto.symbol}>
                  {crypto.symbol} - {crypto.name}
                </option>
              ))}
            </select>
          </div>

          {/* Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Average Buy Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Buy Price (USD)
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.000001"
                  value={values.averageBuyPrice}
                  onChange={(e) => handleInputChange('averageBuyPrice', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    lastUpdated === 'averageBuyPrice' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter average buy price"
                />
              </div>
            </div>

            {/* Current Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Price (USD)
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.000001"
                  value={values.currentPrice}
                  onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    lastUpdated === 'currentPrice' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter current price"
                />
              </div>
            </div>

            {/* Investment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount (USD)
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={values.investmentAmount}
                  onChange={(e) => handleInputChange('investmentAmount', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    lastUpdated === 'investmentAmount' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter investment amount"
                />
              </div>
            </div>

            {/* Current Profit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Profit/Loss (USD)
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={values.currentProfit}
                  onChange={(e) => handleInputChange('currentProfit', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    lastUpdated === 'currentProfit' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter profit/loss (negative for loss)"
                />
              </div>
            </div>
          </div>

          {/* Results Summary */}
          {values.currentProfit && values.investmentAmount && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                {getProfitIcon(profitValue)}
                <span className="ml-2">Investment Summary</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${parseFloat(values.investmentAmount).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Investment</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getProfitColor(profitValue)}`}>
                    {profitValue >= 0 ? '+' : ''}${profitValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Profit/Loss</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getProfitColor(profitValue)}`}>
                    {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">Return %</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center">
            <button
              onClick={clearAll}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How to use:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Fill any 3 out of 4 fields</li>
              <li>• The 4th field will be calculated automatically</li>
              <li>• Use negative values for losses in the profit field</li>
              <li>• Results update in real-time as you type</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}