#!/bin/bash

sudo /opt/lampp/lampp stop
if [ $? -ne 0 ]; then
    echo "Failed to stop LAMPP."
    exit 1
fi

sudo lsof -ti:8000 | xargs sudo kill -9
# Start LAMPP
sudo /opt/lampp/lampp start
if [ $? -ne 0 ]; then
    echo "Failed to start LAMPP."
    exit 1
fi

# Wait for 5 seconds
sleep 3

# Set PHP version
sudo update-alternatives --set php /usr/bin/php8.2
if [ $? -ne 0 ]; then
    echo "Failed to set PHP version."
    exit 1
fi

# Start Laravel server
php artisan serve
if [ $? -ne 0 ]; then
    echo "Failed to start Laravel server."
    exit 1
fi

# sudo update-alternatives --set php /usr/bin/php8.2
