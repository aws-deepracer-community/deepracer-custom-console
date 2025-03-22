#!/usr/bin/env bash
export DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

VERSION_TAG=$(git describe --tags --abbrev=0 --match "v[2-9].[0-9].[0-9]")
VERSION_COMMITS=$(git rev-list --count $VERSION_TAG..HEAD)
VERSION_HASH=$(git rev-parse --short HEAD)

# Check for uncommitted changes

if [ -n "$(git status --porcelain)" ]; then
    VERSION_HASH_SUFFIX="+$VERSION_HASH-dirty"
else
    if [ "$VERSION_COMMITS" -gt 0 ]; then
        VERSION_HASH_SUFFIX="+$VERSION_HASH"
    else
        VERSION_HASH_SUFFIX=""
    fi
fi

# Remove leading 'v' from version tag if present
if [[ $VERSION_TAG == v* ]]; then
    VERSION_TAG=${VERSION_TAG:1}
fi

VERSION=$VERSION_TAG.$VERSION_COMMITS$VERSION_HASH_SUFFIX

rm -rf $DIR/dist/*
mkdir -p $DIR/dist/opt/aws/deepracer/lib/device_console $DIR/dist/opt/aws/deepracer/lib/device_console/templates $DIR/dist/DEBIAN

cp $DIR/package/control dist/DEBIAN/
sed -i "s/Version: 0.0.0.0/Version: $VERSION/" $DIR/dist/DEBIAN/control
cp $DIR/package/postinst dist/DEBIAN/
cp $DIR/package/prerm dist/DEBIAN/

cp -r $DIR/new/dist/* $DIR/dist/opt/aws/deepracer/lib/device_console
mv $DIR/dist/opt/aws/deepracer/lib/device_console/*.html $DIR/dist/opt/aws/deepracer/lib/device_console/templates
mv $DIR/dist/opt/aws/deepracer/lib/device_console/*.json $DIR/dist/opt/aws/deepracer/lib/device_console/static

dpkg-deb --root-owner-group --build $DIR/dist $DIR/dist/aws-deepracer-community-device-console.deb
dpkg-name -o $DIR/dist/aws-deepracer-community-device-console.deb

# deb-s3 does not handle filenames with +, so we need to rename the file
FILE=$(compgen -G $DIR/dist/aws-deepracer-community-device-console*.deb)
if [[ $FILE == *"+"* ]]; then
    mv $FILE $(echo $FILE | sed -e 's/\+/\-/')
fi