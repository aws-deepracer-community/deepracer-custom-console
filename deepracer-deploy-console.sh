#!/bin/bash

unzip deepracer-console-new.zip -d temp_website
sudo cp -a temp_website/static/. /opt/aws/deepracer/lib/device_console/static/ -r
sudo cp temp_website/index.html /opt/aws/deepracer/lib/device_console/templates -f
sudo cp temp_website/manifest.json /opt/aws/deepracer/lib/device_console/templates -f