#!/usr/bin/env bash
export DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

echo "Starting DeepRacer custom console packaging..."

VERSION_TAG=$(git describe --tags --abbrev=0 --match "v[2-9].[0-9].[0-9]")
VERSION_COMMITS=$(git rev-list --count $VERSION_TAG..HEAD)
VERSION_HASH=$(git rev-parse --short HEAD)

echo "Base version tag: $VERSION_TAG"
echo "Commits since tag: $VERSION_COMMITS"
echo "Current commit hash: $VERSION_HASH"

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
echo "Full version: $VERSION"

rm -rf $DIR/dist/*

mkdir -p $DIR/dist/opt/aws/deepracer/lib/device_console $DIR/dist/opt/aws/deepracer/lib/device_console/templates $DIR/dist/DEBIAN

cp $DIR/package/control dist/DEBIAN/
sed -i "s/Version: 0.0.0.0/Version: $VERSION/" $DIR/dist/DEBIAN/control
cp $DIR/package/postinst dist/DEBIAN/
cp $DIR/package/prerm dist/DEBIAN/

cp -r $DIR/new/dist/* $DIR/dist/opt/aws/deepracer/lib/device_console
mv $DIR/dist/opt/aws/deepracer/lib/device_console/*.html $DIR/dist/opt/aws/deepracer/lib/device_console/templates
mv $DIR/dist/opt/aws/deepracer/lib/device_console/*.json $DIR/dist/opt/aws/deepracer/lib/device_console/static

echo ""
echo "Building Debian package..."
dpkg-deb --root-owner-group --build $DIR/dist $DIR/dist/aws-deepracer-community-device-console.deb
dpkg-name -o $DIR/dist/aws-deepracer-community-device-console.deb

# deb-s3 does not handle filenames with +, so we need to rename the file
FILE=$(compgen -G $DIR/dist/aws-deepracer-community-device-console*.deb)
if [[ $FILE == *"+"* ]]; then
    NEW_FILE=$(echo $FILE | sed -e 's/\+/\-/')
    mv $FILE $NEW_FILE
    FILE=$NEW_FILE
fi
echo ""
echo "Package successfully built: $FILE"
echo "Package size: $(du -h $FILE | cut -f1)"