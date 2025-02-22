#!/usr/bin/env bash
export DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
rm -rf $DIR/dist/*
mkdir -p $DIR/dist/opt/aws/deepracer/lib/device_console $DIR/dist/opt/aws/deepracer/lib/device_console/templates $DIR/dist/DEBIAN

cp $DIR/package/control dist/DEBIAN/
cp $DIR/package/postinst dist/DEBIAN/
cp $DIR/package/prerm dist/DEBIAN/

cp -r $DIR/new/dist/* $DIR/dist/opt/aws/deepracer/lib/device_console
mv $DIR/dist/opt/aws/deepracer/lib/device_console/*.html $DIR/dist/opt/aws/deepracer/lib/device_console/templates
mv $DIR/dist/opt/aws/deepracer/lib/device_console/*.json $DIR/dist/opt/aws/deepracer/lib/device_console/static

dpkg-deb --root-owner-group --build $DIR/dist $DIR/dist/aws-deepracer-device-console.deb
dpkg-name -o $DIR/dist/aws-deepracer-device-console.deb
FILE=$(compgen -G $DIR/dist/aws-deepracer-device-console*.deb)
mv $FILE $(echo $FILE | sed -e 's/\+/\-/')