#!/bin/bash
# Script to run historical ETL for all years from 2000 to 2024
# This will fetch and store historical season averages for each year

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Historical Season Averages ETL - All Years"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Running for years 2000-2024..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Loop through years from 2000 to 2024
for year in {1996..2024}; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📅 Processing year: $year (will be stored as $((year + 1)))"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Run the historical ETL script for this year
  npm run etl:historical -- --season "$year"
  
  # Check if the command succeeded
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully completed year $year"
  else
    echo ""
    echo "❌ Error processing year $year - continuing with next year..."
  fi
  
  # Add a small delay between years to avoid rate limiting
  echo "⏳ Waiting 2 seconds before next year..."
  sleep 2
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All years processed (2000-2024)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
