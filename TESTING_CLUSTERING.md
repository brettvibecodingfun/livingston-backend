# 🧪 Testing the Clustering Feature Locally

This guide walks you through testing the K-means clustering feature step-by-step.

## 📋 Prerequisites

1. **Database is running:**
   ```bash
   npm run docker:up
   ```

2. **Migrations are applied:**
   ```bash
   npm run db:migrate
   ```

3. **You have data in the database:**
   - Historical season averages (from `historical_season_averages` table)
   - Current season averages (from `season_averages` table)

## 🚀 Quick Test Workflow

### Step 1: Verify Data Availability

Check if you have enough data to run clustering:

```bash
node test-clustering.js
```

This will show:
- Total records in historical and current season tables
- Data availability by age (19-40)
- Whether you have enough players for clustering

**Expected output:**
```
📈 Historical Season Averages:
   Total records: 5000+
   Unique ages: 22
   Age range: 19 - 40
   Unique players: 1000+

📈 Current Season Averages (2025):
   Total records: 400+
   Unique ages: 15
   Age range: 19 - 40
   Unique players: 400+
```

**If you don't have data:**
```bash
# Run historical ETL for a few years
npm run etl:historical -- --season 2024
npm run etl:historical -- --season 2023
npm run etl:historical -- --season 2022

# Run nightly job to get current season data
npm run etl:nightly
```

### Step 2: Run Clustering Job

Once you have data, run the clustering:

```bash
npm run etl:clustering
```

**What to watch for:**
- ✅ Each age (19-40) should process successfully
- ✅ Cluster counts should be reasonable (10 for ages 19-35, 5 for ages 36-40, or more if splitting occurred)
- ✅ No errors during processing

**Example output:**
```
📊 Processing age 22...
📥 Found 450 historical + 25 current = 475 player-seasons
✅ Extracted features for 475 players
🔄 Running K-means with k=10...
✅ Created 14 clusters (initial: 10)
💾 Inserted 475 cluster assignments
```

### Step 3: Verify Clustering Results

Check that clusters were created correctly:

```bash
node test-clustering.js
```

Or check a specific age:

```bash
node test-clustering.js --age 22
```

**What to verify:**
- ✅ Clusters exist for each age
- ✅ No clusters exceed 50 players (splitting worked)
- ✅ Cluster counts are reasonable

### Step 4: Test Player Comparison

Test the actual use case - finding similar players:

```bash
node test-clustering.js --player "Anthony Edwards" --age 22
```

**Expected output:**
```
🔍 Step 3: Testing Player Comparison
   Player: Anthony Edwards, Age: 22
✅ Found: Anthony Edwards (ID: 123)
📊 Cluster Info:
   Age: 22
   Cluster Number: 3
   Season: 2025

👥 Top 10 Similar Players in Cluster 3:
   [List of similar players with stats]
```

## 🔍 Manual SQL Testing

You can also test directly with SQL queries:

### Check Data Availability

```bash
npm run docker:db < test-clustering.sql
```

Or interactively:

```bash
npm run docker:db
```

Then run queries from `test-clustering.sql`:

```sql
-- Check data by age
SELECT age, COUNT(*) as count
FROM historical_season_averages
WHERE games_played >= 20 AND minutes >= 15
GROUP BY age
ORDER BY age;
```

### Check Clustering Results

```sql
-- See cluster distribution
SELECT age, cluster_number, COUNT(*) as size
FROM player_clusters
GROUP BY age, cluster_number
ORDER BY age, cluster_number;
```

### Find Player Comparisons

```sql
-- Find a player's cluster
SELECT * FROM player_clusters
WHERE player_id = (SELECT id FROM players WHERE full_name LIKE '%Anthony Edwards%')
  AND age = 22;

-- Find similar players
SELECT pc.player_name, pc.season, hsa.points, hsa.assists, hsa.rebounds
FROM player_clusters pc
LEFT JOIN historical_season_averages hsa ON pc.historical_season_average_id = hsa.id
WHERE pc.age = 22 AND pc.cluster_number = 3
ORDER BY hsa.points DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Issue: "No players found for age X"

**Cause:** Not enough data for that age, or filters are too strict.

**Solution:**
- Lower the minimum games/minutes requirements:
  ```bash
  npm run etl:clustering -- --min-games 10 --min-minutes 10
  ```
- Check if you have data for that age:
  ```sql
  SELECT COUNT(*) FROM historical_season_averages WHERE age = 22;
  ```

### Issue: "No clusters found"

**Cause:** Clustering job hasn't been run yet.

**Solution:**
```bash
npm run etl:clustering
```

### Issue: Clusters have >50 players

**Cause:** Dynamic splitting didn't work properly.

**Solution:**
- Check the clustering logic in `src/etl/clustering.ts`
- Verify the `maxClusterSize` parameter (default: 50)
- Re-run clustering with a smaller max size:
  ```bash
  npm run etl:clustering -- --max-cluster-size 30
  ```

### Issue: Player not found in clusters

**Cause:** Player doesn't meet the criteria (min games/minutes).

**Solution:**
- Check their stats:
  ```sql
  SELECT * FROM season_averages 
  WHERE player_id = (SELECT id FROM players WHERE full_name LIKE '%Player Name%')
    AND season = 2025;
  ```
- Lower the filters if needed

## 📊 Testing Different Scenarios

### Test with Different Filters

```bash
# More strict filters (fewer players, higher quality)
npm run etl:clustering -- --min-games 30 --min-minutes 20

# Less strict filters (more players, lower quality)
npm run etl:clustering -- --min-games 10 --min-minutes 10
```

### Test Specific Age Range

Modify `src/etl/jobs/clustering.ts` to test only certain ages:

```typescript
// In runClusteringJob function, change:
for (let age = 19; age <= 40; age++) {
// To:
for (let age = 22; age <= 25; age++) {  // Test only ages 22-25
```

### Test Cluster Splitting

Create a test with a known large cluster:

```sql
-- Find an age with many players
SELECT age, COUNT(*) 
FROM historical_season_averages 
WHERE games_played >= 20 
GROUP BY age 
ORDER BY COUNT(*) DESC 
LIMIT 1;

-- Run clustering and check if it splits
npm run etl:clustering

-- Verify no clusters > 50
SELECT age, cluster_number, COUNT(*) 
FROM player_clusters 
GROUP BY age, cluster_number 
HAVING COUNT(*) > 50;
```

## ✅ Success Criteria

Your clustering feature is working correctly if:

1. ✅ **Data is available:** At least 100+ player-seasons for most ages (19-35)
2. ✅ **Clusters are created:** Each age has clusters (10 for 19-35, 5 for 36-40, or more if split)
3. ✅ **No oversized clusters:** All clusters have ≤50 players
4. ✅ **Player comparisons work:** Can find similar players for a given player/age
5. ✅ **Results make sense:** Similar players have similar stat profiles

## 🎯 Next Steps

Once testing is complete:

1. **Schedule daily runs:** Add clustering to your cron/scheduler
2. **Create API endpoints:** Expose cluster data via REST API
3. **Build comparison UI:** Create frontend to visualize player comparisons
4. **Monitor performance:** Track clustering job duration and cluster quality

## 📝 Test Checklist

- [ ] Database has historical season averages data
- [ ] Database has current season averages data
- [ ] Clustering job runs without errors
- [ ] Clusters are created for all ages (19-40)
- [ ] No clusters exceed max size (50)
- [ ] Can find a player's cluster
- [ ] Can find similar players in the same cluster
- [ ] Similar players have similar stat profiles
- [ ] Results are consistent across runs (for same data)
