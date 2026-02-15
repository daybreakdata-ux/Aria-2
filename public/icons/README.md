# PWA Icons

This directory contains the icons for the Aria Chat Progressive Web App.

## Required Icons

You need to create the following icon sizes:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## How to Generate Icons

You can generate these icons from a single source image (ideally 512x512 or larger) using:

1. **Online Tools:**
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/

2. **Command Line (ImageMagick):**
   ```bash
   convert icon.png -resize 72x72 icon-72x72.png
   convert icon.png -resize 96x96 icon-96x96.png
   convert icon.png -resize 128x128 icon-128x128.png
   convert icon.png -resize 144x144 icon-144x144.png
   convert icon.png -resize 152x152 icon-152x152.png
   convert icon.png -resize 192x192 icon-192x192.png
   convert icon.png -resize 384x384 icon-384x384.png
   convert icon.png -resize 512x512 icon-512x512.png
   ```

## Icon Requirements

- **Format:** PNG with transparency
- **Content:** Should be recognizable at all sizes
- **Style:** Simple, clear design that works well as an app icon
- **Safe Area:** Keep important content within 80% of the icon area (maskable icons)

## Temporary Placeholder

Until you add your custom icons, the app will display default/missing icon indicators on iOS and Android devices.
