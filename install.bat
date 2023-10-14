#!/bin/bash

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if TypeScript is installed
if ! command -v tsc &> /dev/null; then
    echo "TypeScript (tsc) is not installed. Attempting to install TypeScript."

    # Install TypeScript globally using npm
    npm install -g typescript

    # Check if the installation was successful
    if [ $? -eq 0 ]; then
        echo "TypeScript (tsc) installed successfully."
    else
        echo "TypeScript (tsc) installation failed. Please install TypeScript manually."
        exit 1
    fi
else
    echo "TypeScript (tsc) is already installed."
fi

# Execute the npm install command
echo "Executing the npm install command..."
npm install

# Check if npm install was successful
if [ $? -eq 0 ]; then
    echo "npm install command executed successfully."
else
    echo "npm install command failed."
    exit 1
fi

# Execute other initialization steps
# You can add any other necessary initialization steps here