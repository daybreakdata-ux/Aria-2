#!/bin/bash

# Simple script to create placeholder icons for PWA testing
# These are basic colored squares with text - replace with proper icons later

echo "Creating placeholder PWA icons..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Installing..."
    echo "You can also generate icons manually at: https://www.pwabuilder.com/imageGenerator"
    exit 1
fi

# Icon sizes needed
sizes=(72 96 128 144 152 192 384 512)

# Create a temporary SVG as base
cat > /tmp/aria-icon.svg << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#grad)"/>
  <text x="256" y="330" font-family="Arial, sans-serif" font-size="280" font-weight="bold" 
        fill="white" text-anchor="middle">A</text>
</svg>
EOF

# Generate icons in all required sizes
for size in "${sizes[@]}"; do
    echo "Generating ${size}x${size} icon..."
    convert -background none /tmp/aria-icon.svg -resize ${size}x${size} \
            "/workspaces/Aria-2/public/icons/icon-${size}x${size}.png"
done

# Clean up
rm /tmp/aria-icon.svg

echo "✓ Placeholder icons created successfully!"
echo "  Replace these with your custom icons for production."
