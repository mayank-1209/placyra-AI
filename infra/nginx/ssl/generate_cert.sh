#!/bin/bash
# ==============================================================================
# Generate Self-Signed TLS Certificates for Local HTTPS Testing
# ==============================================================================
set -e

SSL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$SSL_DIR"

if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
    echo "SSL certificates already exist in $SSL_DIR"
    exit 0
fi

echo "Generating self-signed certificate for Placyra (localhost)..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/key.pem" \
    -out "$SSL_DIR/cert.pem" \
    -subj "/C=US/ST=State/L=City/O=Placyra/OU=CampusAI/CN=localhost"

echo "TLS certificates successfully generated at:"
echo " - Certificate: $SSL_DIR/cert.pem"
echo " - Key:         $SSL_DIR/key.pem"
