import streamlit as st
import sqlite3
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime, timedelta
import ccxt
import numpy as np
import json

# Configure page
st.set_page_config(page_title="Manual Labeling Tool", layout="wide")

# Database setup
def init_database():
    """Initialize database with updated schema"""
    conn = sqlite3.connect("./peak_dip_events.db")
    cursor = conn.cursor()
    
    # Add source column if it doesn't exist
    try:
        cursor.execute("ALTER TABLE peak_dip_events ADD COLUMN source TEXT DEFAULT 'ml_prediction'")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Create features table for storing extracted features
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS labeling_features (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            price REAL NOT NULL,
            rsi_14 REAL,
            macd_line REAL,
            macd_signal REAL,
            macd_histogram REAL,
            bb_upper REAL,
            bb_middle REAL,
            bb_lower REAL,
            volume_sma_20 REAL,
            price_sma_20 REAL,
            price_ema_12 REAL,
            price_ema_26 REAL,
            stoch_k REAL,
            stoch_d REAL,
            atr_14 REAL,
            williams_r REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

# Binance Futures connection
@st.cache_resource
def get_exchange():
    return ccxt.binance({
        'enableRateLimit': True,
        'options': {'defaultType': 'future'}
    })

# Feature extraction functions
def extract_features(df, target_idx):
    """Extract technical indicators for a specific index using pandas"""
    if len(df) < 50:  # Need enough data for indicators
        return {}
    
    # Calculate technical indicators using pandas
    features = {}
    
    try:
        # Create a copy to avoid modifying original
        df_temp = df.copy()
        
        # RSI (simplified version)
        delta = df_temp['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        features['rsi_14'] = rsi.iloc[target_idx] if not pd.isna(rsi.iloc[target_idx]) else None
        
        # MACD
        ema_12 = df_temp['close'].ewm(span=12).mean()
        ema_26 = df_temp['close'].ewm(span=26).mean()
        macd_line = ema_12 - ema_26
        macd_signal = macd_line.ewm(span=9).mean()
        macd_histogram = macd_line - macd_signal
        
        features['macd_line'] = macd_line.iloc[target_idx] if not pd.isna(macd_line.iloc[target_idx]) else None
        features['macd_signal'] = macd_signal.iloc[target_idx] if not pd.isna(macd_signal.iloc[target_idx]) else None
        features['macd_histogram'] = macd_histogram.iloc[target_idx] if not pd.isna(macd_histogram.iloc[target_idx]) else None
        
        # Bollinger Bands
        bb_middle = df_temp['close'].rolling(window=20).mean()
        bb_std = df_temp['close'].rolling(window=20).std()
        bb_upper = bb_middle + (bb_std * 2)
        bb_lower = bb_middle - (bb_std * 2)
        
        features['bb_upper'] = bb_upper.iloc[target_idx] if not pd.isna(bb_upper.iloc[target_idx]) else None
        features['bb_middle'] = bb_middle.iloc[target_idx] if not pd.isna(bb_middle.iloc[target_idx]) else None
        features['bb_lower'] = bb_lower.iloc[target_idx] if not pd.isna(bb_lower.iloc[target_idx]) else None
        
        # Moving Averages
        sma_20 = df_temp['close'].rolling(window=20).mean()
        features['price_sma_20'] = sma_20.iloc[target_idx] if not pd.isna(sma_20.iloc[target_idx]) else None
        
        features['price_ema_12'] = ema_12.iloc[target_idx] if not pd.isna(ema_12.iloc[target_idx]) else None
        features['price_ema_26'] = ema_26.iloc[target_idx] if not pd.isna(ema_26.iloc[target_idx]) else None
        
        # Volume indicators
        volume_sma_20 = df_temp['volume'].rolling(window=20).mean()
        features['volume_sma_20'] = volume_sma_20.iloc[target_idx] if not pd.isna(volume_sma_20.iloc[target_idx]) else None
        
        # Stochastic (simplified)
        high_14 = df_temp['high'].rolling(window=14).max()
        low_14 = df_temp['low'].rolling(window=14).min()
        stoch_k = 100 * (df_temp['close'] - low_14) / (high_14 - low_14)
        stoch_d = stoch_k.rolling(window=3).mean()
        
        features['stoch_k'] = stoch_k.iloc[target_idx] if not pd.isna(stoch_k.iloc[target_idx]) else None
        features['stoch_d'] = stoch_d.iloc[target_idx] if not pd.isna(stoch_d.iloc[target_idx]) else None
        
        # ATR (simplified)
        high_low = df_temp['high'] - df_temp['low']
        high_close = np.abs(df_temp['high'] - df_temp['close'].shift())
        low_close = np.abs(df_temp['low'] - df_temp['close'].shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = ranges.max(axis=1)
        atr = true_range.rolling(window=14).mean()
        features['atr_14'] = atr.iloc[target_idx] if not pd.isna(atr.iloc[target_idx]) else None
        
        # Williams %R (simplified)
        williams_r = -100 * (high_14 - df_temp['close']) / (high_14 - low_14)
        features['williams_r'] = williams_r.iloc[target_idx] if not pd.isna(williams_r.iloc[target_idx]) else None
        
    except Exception as e:
        st.error(f"Feature extraction error: {e}")
    
    return features

# Data loading functions (from original code)
@st.cache_data(ttl=60)
def load_ohlcv_data(symbol, start_date, end_date, timeframe='3m'):
    exchange = get_exchange()
    symbol_ccxt = f"{symbol}/USDT"
    timeframe_duration_in_ms = exchange.parse_timeframe(timeframe) * 1000
    since = exchange.parse8601(f'{start_date}T00:00:00Z')
    end_ts = exchange.parse8601(f'{end_date}T23:59:59Z')
    all_ohlcv = []

    try:
        while since < end_ts:
            ohlcv = exchange.fetch_ohlcv(symbol_ccxt, timeframe, since=since, limit=1000)
            if not ohlcv:
                break
            all_ohlcv.extend(ohlcv)
            since = ohlcv[-1][0] + timeframe_duration_in_ms
        
        if not all_ohlcv:
            return pd.DataFrame()

        df = pd.DataFrame(all_ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"])
        df.drop_duplicates(subset=['timestamp'], inplace=True)
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms').dt.tz_localize('UTC').dt.tz_convert('Asia/Seoul')
        
        start_dt_seoul = pd.Timestamp(start_date, tz='Asia/Seoul')
        end_dt_seoul = (pd.Timestamp(end_date) + pd.Timedelta(days=1)).tz_localize('Asia/Seoul')
        df = df[(df['timestamp'] >= start_dt_seoul) & (df['timestamp'] < end_dt_seoul)]
        
        return df
    except Exception as e:
        st.error(f"OHLCV 데이터 로딩 실패: {e}")
        return pd.DataFrame()

@st.cache_data(ttl=60)
def load_event_data(db_path):
    conn = sqlite3.connect(db_path)
    query = """
    SELECT
        pde.*,
        e.is_valid_peak_dip,
        e.trend_label
    FROM peak_dip_events pde
    LEFT JOIN events e ON pde.symbol = e.symbol AND pde.detect_time = e.detect_time
    ORDER BY pde.detect_time DESC
    """
    df = pd.read_sql(query, conn)
    conn.close()
    df['detect_time'] = pd.to_datetime(df['detect_time'])
    return df

def save_manual_label(symbol, timestamp, price, event_type, is_valid, trend_label, features):
    """Save manually labeled event to database"""
    conn = sqlite3.connect("./peak_dip_events.db")
    cursor = conn.cursor()
    
    try:
        # Save to peak_dip_events table
        cursor.execute("""
            INSERT INTO peak_dip_events 
            (symbol, detect_time, type, price, confidence, source)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (symbol, timestamp, event_type, price, 1.0, 'manual_labeling'))
        
        # Save to events table
        cursor.execute("""
            INSERT OR REPLACE INTO events 
            (symbol, detect_time, is_valid_peak_dip, trend_label)
            VALUES (?, ?, ?, ?)
        """, (symbol, timestamp, is_valid, trend_label))
        
        # Save features
        feature_columns = ', '.join(features.keys())
        feature_values = ', '.join(['?' for _ in features])
        cursor.execute(f"""
            INSERT INTO labeling_features 
            (symbol, timestamp, price, {feature_columns})
            VALUES (?, ?, ?, {feature_values})
        """, (symbol, timestamp, price, *features.values()))
        
        conn.commit()
        return True
    except Exception as e:
        st.error(f"데이터 저장 실패: {e}")
        return False
    finally:
        conn.close()

# Initialize database
init_database()

# Main UI
st.title("🏷️ Manual Labeling Tool for Peak/Dip Events")

# Load data
DB_PATH = "./peak_dip_events.db"
df_events = load_event_data(DB_PATH)

if not df_events.empty:
    available_symbols = sorted(df_events['symbol'].unique())
    min_date = df_events['detect_time'].min().date()
    max_date = df_events['detect_time'].max().date()

    # UI Controls
    col1, col2, col3 = st.columns([2, 1, 1])
    with col1:
        selected_symbol = st.selectbox("🔘 코인 선택", available_symbols)
    with col2:
        start_date = st.date_input("🗓️ 시작일", value=max_date - timedelta(days=1), min_value=min_date, max_value=max_date)
    with col3:
        end_date = st.date_input("🗓️ 종료일", value=max_date, min_value=min_date, max_value=max_date)

    if start_date > end_date:
        st.error("종료일은 시작일보다 이전일 수 없습니다.")
        st.stop()

    # Load OHLCV data
    df_ohlcv = load_ohlcv_data(selected_symbol, start_date, end_date)
    
    if not df_ohlcv.empty:
        # Filter events
        df_range = df_events[
            (df_events['symbol'] == selected_symbol) &
            (df_events['detect_time'].dt.date >= start_date) &
            (df_events['detect_time'].dt.date <= end_date)
        ]

        # Create interactive chart
        fig = go.Figure()

        # Candlestick chart
        fig.add_trace(go.Candlestick(
            x=df_ohlcv['timestamp'],
            open=df_ohlcv['open'],
            high=df_ohlcv['high'],
            low=df_ohlcv['low'],
            close=df_ohlcv['close'],
            name='OHLCV',
            showlegend=False
        ))

        # Existing events
        for _, row in df_range.iterrows():
            color = 'red' if row['source'] == 'manual_labeling' else ('blue' if row.type == 'dip' else '#FFD700')
            fig.add_trace(go.Scatter(
                x=[row.detect_time],
                y=[row.price],
                mode='markers',
                marker=dict(
                    symbol='triangle-down' if row.type == 'dip' else 'triangle-up',
                    color=color,
                    size=12,
                    line=dict(color='black', width=1)
                ),
                name=f"{row.type.upper()} ({'Manual' if row['source'] == 'manual_labeling' else 'ML'})",
                showlegend=False
            ))

        fig.update_layout(
            title=f'Manual Labeling for {selected_symbol} ({start_date} ~ {end_date})',
            xaxis_title='Time',
            yaxis_title='Price',
            xaxis_rangeslider_visible=False,
            height=600
        )

        # Display chart
        st.subheader("📊 Chart & Manual Labeling")
        st.info("💡 차트를 확인하고 아래 폼에서 수동으로 레이블링하세요. 빨간색 마커는 수동 레이블링된 이벤트입니다.")
        
        st.plotly_chart(fig, use_container_width=True)

        # Manual labeling form
        st.subheader("🏷️ Manual Labeling")
        
        with st.form("manual_labeling_form"):
            col1, col2 = st.columns(2)
            
            with col1:
                # Time selection
                selected_time = st.selectbox(
                    "시간 선택",
                    options=df_ohlcv['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S'),
                    help="레이블링할 시간을 선택하세요"
                )
                
                # Event type
                event_type = st.selectbox(
                    "이벤트 유형",
                    ["peak", "dip"],
                    help="이벤트 유형을 선택하세요"
                )
                
                # Validity
                is_valid = st.selectbox(
                    "유효성",
                    [True, False],
                    format_func=lambda x: "유효함" if x else "유효하지 않음",
                    help="이벤트가 유효한지 선택하세요"
                )
            
            with col2:
                # Trend
                trend_label = st.selectbox(
                    "추세",
                    ["uptrend", "downtrend", "sideways"],
                    help="현재 추세를 선택하세요"
                )
                
                # Price input (optional override)
                selected_timestamp = pd.to_datetime(selected_time)
                closest_idx = (df_ohlcv['timestamp'] - selected_timestamp).abs().idxmin()
                default_price = df_ohlcv.loc[closest_idx, 'close']
                
                price_override = st.number_input(
                    "가격 (선택사항)",
                    value=float(default_price),
                    format="%.4f",
                    help="기본값은 해당 시간의 종가입니다"
                )
                
                # Show selected point info
                st.info(f"선택된 시간: {selected_time}\n가격: {price_override:.4f}")
            
            # Submit button
            submitted = st.form_submit_button("💾 레이블 저장", type="primary")
            
            if submitted:
                with st.spinner("특징 추출 및 저장 중..."):
                    try:
                        # Extract features
                        features = extract_features(df_ohlcv, closest_idx)
                        
                        # Save to database
                        success = save_manual_label(
                            selected_symbol,
                            selected_timestamp,
                            price_override,
                            event_type,
                            is_valid,
                            trend_label,
                            features
                        )
                        
                        if success:
                            st.success("✅ 레이블이 성공적으로 저장되었습니다!")
                            st.balloons()
                            
                            # Show extracted features
                            st.subheader("📈 추출된 특징")
                            feature_df = pd.DataFrame([features]).T
                            feature_df.columns = ['값']
                            st.dataframe(feature_df)
                            
                            # Clear cache to reload data
                            st.cache_data.clear()
                            st.rerun()
                        else:
                            st.error("❌ 레이블 저장에 실패했습니다.")
                    except Exception as e:
                        st.error(f"❌ 오류 발생: {e}")

        # Display existing labels
        st.subheader("📋 기존 레이블")
        manual_labels = df_range[df_range['source'] == 'manual_labeling']
        
        if not manual_labels.empty:
            st.write(f"**수동 레이블링된 이벤트: {len(manual_labels)}개**")
            display_df = manual_labels[['detect_time', 'type', 'price', 'is_valid_peak_dip', 'trend_label']].copy()
            display_df['detect_time'] = display_df['detect_time'].dt.strftime('%Y-%m-%d %H:%M:%S')
            st.dataframe(display_df, use_container_width=True)
        else:
            st.info("아직 수동 레이블링된 이벤트가 없습니다.")
        
        # Statistics
        st.subheader("📊 통계")
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            total_events = len(df_range)
            st.metric("전체 이벤트", total_events)
        
        with col2:
            manual_events = len(manual_labels)
            st.metric("수동 레이블링", manual_events)
        
        with col3:
            ml_events = len(df_range[df_range['source'] != 'manual_labeling'])
            st.metric("ML 예측", ml_events)
        
        with col4:
            valid_events = len(df_range[df_range['is_valid_peak_dip'] == True])
            st.metric("유효 이벤트", valid_events)

else:
    st.info("데이터베이스에 이벤트가 없습니다.")

# Footer
st.markdown("---")
st.markdown("💡 **사용법:** 차트에서 점을 클릭하고 해당 지점을 Peak/Dip으로 레이블링하세요. 추출된 특징과 함께 ML 학습용 데이터로 저장됩니다.")