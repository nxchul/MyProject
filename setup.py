#!/usr/bin/env python3
"""
Setup script for Manual Labeling Tool
Installs all dependencies including TA-Lib
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔧 {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} - Success")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Failed")
        print(f"Error: {e.stderr}")
        return False

def install_talib():
    """Install TA-Lib with different methods based on platform"""
    print("\n📦 Installing TA-Lib...")
    
    # Check if TA-Lib is already installed
    try:
        import talib
        print("✅ TA-Lib is already installed")
        return True
    except ImportError:
        pass
    
    # Try different installation methods
    platform = sys.platform
    
    if platform.startswith('linux'):
        # Linux installation
        commands = [
            "sudo apt-get update",
            "sudo apt-get install -y build-essential wget",
            "wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz",
            "tar -xzf ta-lib-0.4.0-src.tar.gz",
            "cd ta-lib && ./configure --prefix=/usr && make && sudo make install",
            "pip install TA-Lib"
        ]
        
        for cmd in commands:
            if not run_command(cmd, f"Running: {cmd}"):
                print("❌ Failed to install TA-Lib on Linux")
                return False
                
    elif platform.startswith('darwin'):
        # macOS installation
        commands = [
            "brew install ta-lib",
            "pip install TA-Lib"
        ]
        
        for cmd in commands:
            if not run_command(cmd, f"Running: {cmd}"):
                print("❌ Failed to install TA-Lib on macOS")
                return False
                
    elif platform.startswith('win'):
        # Windows installation
        print("📝 For Windows, please install TA-Lib manually:")
        print("1. Download TA-Lib from: https://www.lfd.uci.edu/~gohlke/pythonlibs/#ta-lib")
        print("2. Install with: pip install TA_Lib-0.4.XX-cpXX-cpXX-win_amd64.whl")
        print("3. Or use conda: conda install -c conda-forge ta-lib")
        return False
    
    return True

def install_requirements():
    """Install all requirements from requirements.txt"""
    print("\n📦 Installing Python requirements...")
    
    if not Path("requirements.txt").exists():
        print("❌ requirements.txt not found")
        return False
    
    return run_command("pip install -r requirements.txt", "Installing requirements")

def check_installation():
    """Check if all packages are installed correctly"""
    print("\n🔍 Checking installation...")
    
    required_packages = [
        'streamlit', 'pandas', 'plotly', 'ccxt', 'numpy', 'talib'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} - OK")
        except ImportError:
            print(f"❌ {package} - Missing")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n❌ Missing packages: {', '.join(missing_packages)}")
        return False
    
    print("\n✅ All packages installed successfully!")
    return True

def main():
    """Main setup function"""
    print("🚀 Setting up Manual Labeling Tool for Peak/Dip Events")
    print("=" * 50)
    
    # Install TA-Lib first (most complex dependency)
    if not install_talib():
        print("⚠️  TA-Lib installation failed. Please install manually.")
        print("   You can still use the tool without some technical indicators.")
    
    # Install other requirements
    if not install_requirements():
        print("❌ Failed to install requirements")
        return False
    
    # Check installation
    if not check_installation():
        print("❌ Installation incomplete")
        return False
    
    print("\n🎉 Setup complete!")
    print("\nTo run the manual labeling tool:")
    print("streamlit run manual_labeling_tool.py")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)