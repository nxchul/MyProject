# Manual Labeling Tool for Peak/Dip Events

A comprehensive Streamlit application for manually labeling cryptocurrency peak and dip events to generate high-quality ground truth data for machine learning models.

## 🎯 Purpose

This tool is designed to:
- Generate ground truth data from `peak_dip_events.db`
- Provide a manual labeling interface for peak/dip events
- Extract technical indicators (MACD, RSI, Bollinger Bands, etc.) for each labeled point
- Store labeled data with `source='manual_labeling'` for ML model training
- Complement existing ML predictions with human-validated data

## 🌟 Features

- **Interactive Chart Visualization**: View candlestick charts with existing peak/dip events
- **Form-based Labeling**: Select time points and label them as peak/dip events
- **Technical Indicator Extraction**: Automatically extract 15+ technical indicators
- **Database Integration**: Save labeled data to SQLite database
- **Data Validation**: Ensure data quality with built-in validation
- **Statistics Dashboard**: Track labeling progress and statistics

## 🛠️ Installation

### Method 1: Automated Setup (Recommended)

```bash
# Clone or download the files
# Then run the setup script
python setup.py
```

### Method 2: Manual Installation

1. **Install TA-Lib** (most complex dependency):

   **Linux:**
   ```bash
   sudo apt-get update
   sudo apt-get install build-essential wget
   wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz
   tar -xzf ta-lib-0.4.0-src.tar.gz
   cd ta-lib
   ./configure --prefix=/usr
   make && sudo make install
   pip install TA-Lib
   ```

   **macOS:**
   ```bash
   brew install ta-lib
   pip install TA-Lib
   ```

   **Windows:**
   - Download from: https://www.lfd.uci.edu/~gohlke/pythonlibs/#ta-lib
   - Install with: `pip install TA_Lib-0.4.XX-cpXX-cpXX-win_amd64.whl`
   - Or use conda: `conda install -c conda-forge ta-lib`

2. **Install other requirements:**
   ```bash
   pip install -r requirements.txt
   ```

## 🚀 Usage

1. **Start the application:**
   ```bash
   streamlit run manual_labeling_tool.py
   ```

2. **Access the web interface:**
   - Open your browser to `http://localhost:8501`

3. **Using the tool:**
   - Select a cryptocurrency symbol from the dropdown
   - Choose date range for analysis
   - Review the candlestick chart with existing events
   - Use the manual labeling form to add new labels:
     - Select time point from dropdown
     - Choose event type (peak/dip)
     - Set validity (valid/invalid)
     - Select trend (uptrend/downtrend/sideways)
     - Submit the label

4. **Review results:**
   - View statistics showing total events, manual labels, and ML predictions
   - Check the extracted technical indicators for each labeled point

## 📊 Technical Indicators Extracted

The tool automatically extracts these technical indicators for each labeled point:

| Indicator | Description |
|-----------|-------------|
| RSI (14) | Relative Strength Index |
| MACD | Moving Average Convergence Divergence |
| Bollinger Bands | Upper, Middle, Lower bands |
| SMA (20) | Simple Moving Average |
| EMA (12, 26) | Exponential Moving Average |
| Stochastic (K, D) | Stochastic Oscillator |
| ATR (14) | Average True Range |
| Williams %R | Williams Percent Range |
| Volume SMA (20) | Volume Simple Moving Average |

## 🗄️ Database Schema

The tool works with these database tables:

### `peak_dip_events` Table
- `symbol`: Cryptocurrency symbol
- `detect_time`: Event timestamp
- `type`: 'peak' or 'dip'
- `price`: Price at event time
- `confidence`: Confidence score (1.0 for manual labels)
- `source`: 'manual_labeling' or 'ml_prediction'

### `events` Table
- `symbol`: Cryptocurrency symbol
- `detect_time`: Event timestamp
- `is_valid_peak_dip`: Boolean validity
- `trend_label`: 'uptrend', 'downtrend', or 'sideways'

### `labeling_features` Table
- Stores all extracted technical indicators
- Links to events via `symbol` and `timestamp`

## 🔧 Configuration

The tool uses these default configurations:
- **Database**: `./peak_dip_events.db`
- **Timeframe**: 3-minute candles
- **Exchange**: Binance Futures
- **Timezone**: Asia/Seoul (KST)

## 🎨 Visual Indicators

- **Blue triangles**: ML-predicted dip events
- **Gold triangles**: ML-predicted peak events
- **Red triangles**: Manually labeled events
- **Candlestick chart**: OHLCV price data

## 🤝 Contributing

When adding new features:
1. Follow the existing code structure
2. Add proper error handling
3. Include docstrings for functions
4. Test with different symbols and date ranges

## 📝 Notes

- The tool requires an internet connection to fetch OHLCV data
- Large date ranges may take longer to load
- Manual labels are immediately saved to the database
- The tool is designed for cryptocurrency data but can be adapted for other financial instruments

## 🔍 Troubleshooting

**Common issues:**

1. **TA-Lib installation fails:**
   - Try using conda: `conda install -c conda-forge ta-lib`
   - On Ubuntu/Debian: Install build tools first

2. **Database connection issues:**
   - Ensure `peak_dip_events.db` exists in the current directory
   - Check file permissions

3. **API rate limiting:**
   - The tool uses Binance's rate limiting
   - If you encounter issues, wait a few minutes and try again

4. **Memory issues with large datasets:**
   - Reduce the date range
   - Process data in smaller chunks

## 📈 Future Enhancements

- Click-to-label functionality (once Streamlit supports it)
- Bulk labeling operations
- Export labeled data to CSV/JSON
- Integration with more exchanges
- Advanced filtering and search capabilities

## 📄 License

This project is intended for educational and research purposes. 
