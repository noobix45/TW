#!/bin/bash

# Definește un array cu perechi "vechi" => "noi"
declare -A replacements=(
  ["--culoare1-inchis"]="--culoare1-inchis"
  ["--culoare1"]="--culoare1"
  ["--culoare1-deschis"]="--culoare1-deschis"
  ["--culoare2-inchis"]="--culoare2-inchis"
  ["--culoare2"]="--culoare2"
  ["--culoare2-deschis"]="--culoare2-deschis"
  ["--culoare3-inchis"]="--culoare3-inchis"
  ["--culoare3"]="--culoare3"
  ["--culoare3-deschis"]="--culoare3-deschis"
  ["--culoare4-inchis"]="--culoare4-inchis"
  ["--culoare4"]="--culoare4"
  ["--culoare4-deschis"]="--culoare4-deschis"
)

# Parcurge toate fișierele (excludem node_modules, git etc.)
find . -type f ! -path "*/node_modules/*" ! -path "*/.git/*" | while read -r file; do
  # Fiecare înlocuire în fișierul curent
  for old in "${!replacements[@]}"; do
    new=${replacements[$old]}
    sed -i "s/$old/$new/g" "$file"
  done
done

echo "Înlocuiri terminate!"