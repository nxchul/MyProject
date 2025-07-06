#!/usr/bin/env python3
"""
Example script showing how to use manually labeled data for ML training

This script demonstrates how to:
1. Load labeled data from the database
2. Prepare features and labels for ML training
3. Train a simple classification model
4. Evaluate the model performance
"""

import sqlite3
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler, LabelEncoder
import matplotlib.pyplot as plt
import seaborn as sns

def load_labeled_data(db_path="./peak_dip_events.db"):
    """Load labeled data with features from database"""
    conn = sqlite3.connect(db_path)
    
    # Query to get labeled events with features
    query = """
    SELECT 
        pde.symbol,
        pde.detect_time,
        pde.type,
        pde.price,
        pde.source,
        e.is_valid_peak_dip,
        e.trend_label,
        lf.rsi_14,
        lf.macd_line,
        lf.macd_signal,
        lf.macd_histogram,
        lf.bb_upper,
        lf.bb_middle,
        lf.bb_lower,
        lf.volume_sma_20,
        lf.price_sma_20,
        lf.price_ema_12,
        lf.price_ema_26,
        lf.stoch_k,
        lf.stoch_d,
        lf.atr_14,
        lf.williams_r
    FROM peak_dip_events pde
    JOIN events e ON pde.symbol = e.symbol AND pde.detect_time = e.detect_time
    JOIN labeling_features lf ON pde.symbol = lf.symbol AND pde.detect_time = lf.timestamp
    WHERE pde.source = 'manual_labeling'
    """
    
    df = pd.read_sql(query, conn)
    conn.close()
    
    print(f"📊 Loaded {len(df)} manually labeled events")
    return df

def prepare_features_and_labels(df):
    """Prepare features and labels for ML training"""
    
    # Feature columns (technical indicators)
    feature_columns = [
        'rsi_14', 'macd_line', 'macd_signal', 'macd_histogram',
        'bb_upper', 'bb_middle', 'bb_lower', 'volume_sma_20',
        'price_sma_20', 'price_ema_12', 'price_ema_26',
        'stoch_k', 'stoch_d', 'atr_14', 'williams_r'
    ]
    
    # Create feature matrix
    X = df[feature_columns].copy()
    
    # Handle missing values
    X = X.fillna(X.median())
    
    # Create labels
    # Multi-class classification: combine type and validity
    df['combined_label'] = df['type'] + '_' + df['is_valid_peak_dip'].astype(str)
    
    # Label encoding
    le = LabelEncoder()
    y = le.fit_transform(df['combined_label'])
    
    print(f"📋 Feature matrix shape: {X.shape}")
    print(f"📋 Unique labels: {le.classes_}")
    print(f"📋 Label distribution:\n{pd.Series(y).value_counts()}")
    
    return X, y, le, feature_columns

def train_model(X, y):
    """Train a Random Forest classifier"""
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        max_depth=10,
        min_samples_split=5
    )
    
    model.fit(X_train_scaled, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test_scaled)
    
    return model, scaler, X_test_scaled, y_test, y_pred

def evaluate_model(model, y_test, y_pred, le, feature_columns):
    """Evaluate model performance"""
    
    print("\n🎯 Model Evaluation Results")
    print("=" * 40)
    
    # Classification report
    report = classification_report(y_test, y_pred, target_names=le.classes_)
    print("\n📊 Classification Report:")
    print(report)
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=le.classes_, yticklabels=le.classes_)
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n🔍 Top 10 Most Important Features:")
    print(feature_importance.head(10))
    
    # Plot feature importance
    plt.figure(figsize=(10, 6))
    sns.barplot(data=feature_importance.head(10), x='importance', y='feature')
    plt.title('Top 10 Feature Importance')
    plt.xlabel('Importance Score')
    plt.tight_layout()
    plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    return feature_importance

def predict_new_events(model, scaler, le, feature_columns, db_path="./peak_dip_events.db"):
    """Predict labels for new ML-generated events"""
    
    conn = sqlite3.connect(db_path)
    
    # Query ML-generated events without manual validation
    query = """
    SELECT 
        pde.symbol,
        pde.detect_time,
        pde.type,
        pde.price,
        lf.rsi_14,
        lf.macd_line,
        lf.macd_signal,
        lf.macd_histogram,
        lf.bb_upper,
        lf.bb_middle,
        lf.bb_lower,
        lf.volume_sma_20,
        lf.price_sma_20,
        lf.price_ema_12,
        lf.price_ema_26,
        lf.stoch_k,
        lf.stoch_d,
        lf.atr_14,
        lf.williams_r
    FROM peak_dip_events pde
    JOIN labeling_features lf ON pde.symbol = lf.symbol AND pde.detect_time = lf.timestamp
    WHERE pde.source = 'ml_prediction'
    LIMIT 100
    """
    
    df_pred = pd.read_sql(query, conn)
    conn.close()
    
    if df_pred.empty:
        print("⚠️  No ML-generated events found for prediction")
        return None
    
    # Prepare features
    X_pred = df_pred[feature_columns].fillna(df_pred[feature_columns].median())
    X_pred_scaled = scaler.transform(X_pred)
    
    # Make predictions
    predictions = model.predict(X_pred_scaled)
    prediction_proba = model.predict_proba(X_pred_scaled)
    
    # Add predictions to dataframe
    df_pred['predicted_label'] = le.inverse_transform(predictions)
    df_pred['confidence'] = prediction_proba.max(axis=1)
    
    print(f"\n🔮 Predictions for {len(df_pred)} ML-generated events:")
    print(df_pred[['symbol', 'detect_time', 'type', 'predicted_label', 'confidence']].head(10))
    
    return df_pred

def main():
    """Main function to demonstrate the ML training pipeline"""
    
    print("🚀 ML Training Pipeline for Manual Labeling Data")
    print("=" * 50)
    
    # Load labeled data
    try:
        df = load_labeled_data()
        
        if df.empty:
            print("❌ No manually labeled data found!")
            print("   Please use the manual labeling tool first to create training data.")
            return
        
        # Prepare features and labels
        X, y, le, feature_columns = prepare_features_and_labels(df)
        
        if len(np.unique(y)) < 2:
            print("❌ Need at least 2 different label classes for training!")
            return
        
        # Train model
        print("\n🔧 Training Random Forest model...")
        model, scaler, X_test, y_test, y_pred = train_model(X, y)
        
        # Evaluate model
        feature_importance = evaluate_model(model, y_test, y_pred, le, feature_columns)
        
        # Predict on new events
        print("\n🔮 Making predictions on ML-generated events...")
        predictions = predict_new_events(model, scaler, le, feature_columns)
        
        print("\n✅ ML training pipeline completed successfully!")
        print("📊 Results saved as confusion_matrix.png and feature_importance.png")
        
    except Exception as e:
        print(f"❌ Error in ML training pipeline: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()