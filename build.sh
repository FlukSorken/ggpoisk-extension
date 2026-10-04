#!/usr/bin/env bash
set -e

rm -f ggpoisk-extension.zip

zip -r ggpoisk-extension.zip \
  manifest.json \
  background.js \
  content.js \
  style.css \
  options.html \
  options.css \
  options.js \
  icons/

echo "Собрано: ggpoisk-extension.zip"