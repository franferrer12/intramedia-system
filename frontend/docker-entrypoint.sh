#!/bin/sh
set -e

# Use Railway's PORT or default to 80
PORT=${PORT:-80}

# Update nginx config with the correct port
sed -i "s/listen 80;/listen ${PORT};/g" /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'
