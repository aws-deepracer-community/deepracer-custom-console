#!/bin/bash

sudo rm /opt/aws/deepracer/lib/device_console -rf
unzip deepracer-console-new.zip -d temp_website
sudo mkdir -p /opt/aws/deepracer/lib/device_console/
sudo mkdir -p /opt/aws/deepracer/lib/device_console/static
sudo mkdir -p /opt/aws/deepracer/lib/device_console/templates
sudo cp -a temp_website/static/. /opt/aws/deepracer/lib/device_console/static/ -r
sudo cp temp_website/index.html /opt/aws/deepracer/lib/device_console/templates -f
sudo cp temp_website/login.html /opt/aws/deepracer/lib/device_console/templates -f
sudo cp temp_website/manifest.json /opt/aws/deepracer/lib/device_console/templates -f