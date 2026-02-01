import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { existsSync } from 'fs';

dotenv.config(); // Load environment variables (API Key)

// --- CONFIGURATION ---
const YEAR = 2026;
const CHART_LIMIT = 100;
const SPECIFIC_WEEK: string | null = null; // Set to null to process ALL weeks
// const SPECIFIC_WEEK: string | null = null; 

// Paths
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
// We assume raw points are in scripts/points/2026/*.csv
const POINTS_DIR = path.join(process.cwd(), 'scripts', 'points', YEAR.toString());
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data', 'weeks');
const CACHE_PATH = path.join(process.cwd(), 'scripts', 'album_cache.json');
const INDEX_PATH = path.join(process.cwd(), 'public', 'data', 'index.json');

// --- TYPES ---
interface SongEntry {
  rank: number;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  lastWeek: number | null;
  status: 'rise' | 'fall' | 'stable' | 'new' | 're';
  change: number;
  points: number;
  pointsPct: string;
  peak: string;
  peakStreak: string;
  woc: string;
  sales: number;
  salesPct: string;
  streams: number;
  streamsPct: string;
  airplay: number;
  airplayPct: string;
  units: number;
}

interface AlbumCache {
  [key: string]: string; // "Artist|Album" -> "URL"
}

// --- HELPERS ---
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Format numbers (e.g. "12%" -> 0.12)
const parseNum = (val: string | undefined) => {
    if (!val || val === '-') return 0;
    return parseFloat(val.replace('%', ''));
};

async function fetchCoverFromLastFM(artist: string, album: string, apiKey: string): Promise<string> {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    
    // Get the largest image available
    const images = data?.album?.image;
    if (Array.isArray(images) && images.length > 0) {
        return images[images.length - 1]['#text'] || '';
    }
  } catch (error) {
    // Fail silently, return empty string
  }
  return '';
}

// --- MAIN PROCESSOR ---
async function processWeek(filename: string, cache: AlbumCache, apiKey: string) {
    const week = filename.replace('.csv', '');
    const inputPath = path.join(POINTS_DIR, filename);
    
    console.log(`\nProcessing Week: ${week}...`);

    // 1. Read CSV
    const fileContent = await fs.readFile(inputPath, 'utf-8');
    const records = parse(fileContent, { 
        columns: true, 
        skip_empty_lines: true 
    });

    // 2. Identify Missing Covers (Top N only)
    const topRecords = records.slice(0, CHART_LIMIT);
    const missing: { artist: string, album: string }[] = [];

    for (const row of topRecords) {
        const key = `${row.Artist}|${row.Album}`;
        if (!cache[key]) {
            // Dedup check
            if (!missing.find(m => m.artist === row.Artist && m.album === row.Album)) {
                missing.push({ artist: row.Artist, album: row.Album });
            }
        }
    }

    // 3. Fetch Missing Covers (Parallel Batches)
    if (missing.length > 0) {
        console.log(`  - Fetching ${missing.length} new covers...`);
        const BATCH_SIZE = 5;
        for (let i = 0; i < missing.length; i += BATCH_SIZE) {
            const batch = missing.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (item) => {
                const url = await fetchCoverFromLastFM(item.artist, item.album, apiKey);
                const key = `${item.artist}|${item.album}`;
                cache[key] = url; // Save even if empty to prevent re-fetching
                process.stdout.write('.'); // Progress dot
            }));
            await sleep(200); // Rate limit kindness
        }
        console.log(" Done.");
    }

    // 4. Transform Data to JSON format
    const songs: SongEntry[] = topRecords.map((row: any) => {
        const rank = parseInt(row.Position);
        const woc = parseInt(row.WOC);
        const lastWeekRaw = row['Previous Rank'];
        const lastWeek = (lastWeekRaw && lastWeekRaw !== '--') ? parseInt(lastWeekRaw) : null;
        
        // Logic for Rise/Fall
        let status: SongEntry['status'] = 'stable';
        let change = 0;
        
        if (lastWeek === null) {
            if (woc === 1) {
                status = 'new';
            } else {
                status = 're';
            }
        } else if (rank < lastWeek) {
            status = 'rise';
            change = lastWeek - rank;
        } else if (rank > lastWeek) {
            status = 'fall';
            change = rank - lastWeek;
        }

        return {
            rank,
            title: row.Song,
            artist: row.Artist,
            album: row.Album,
            coverUrl: cache[`${row.Artist}|${row.Album}`] || '',
            lastWeek,
            status,
            change,
            // Metrics
            points: parseNum(row['Total Weighted Points']),
            pointsPct: row['%'] || '-',
            peak: row.Peak || '-',
            peakStreak: row['Peak Streak'] || '',
            woc: row.WOC || '-',
            sales: parseNum(row['Sales Units']),
            salesPct: row['Sales %'] || '-',
            streams: parseNum(row['Streams Units']),
            streamsPct: row['Streams %'] || '-',
            airplay: parseNum(row['Airplay Units']),
            airplayPct: row['Airplay %'] || '-',
            units: parseNum(row['Total Units'])
        };
    });

    // 5. Save JSON
    const outputData = {
        meta: { 
            year: YEAR, 
            week: week, 
            generated_at: new Date().toISOString().split('T')[0] 
        },
        songs: songs
    };

    const outputPath = path.join(OUTPUT_DIR, `${YEAR}-${week}.json`);
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 0)); // Minified
    console.log(`  -> Saved ${YEAR}-${week}.json`);
    
    return `${YEAR}-${week}`; // Return ID for index
}

async function main() {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) {
        console.error("ERROR: LASTFM_API_KEY is missing in .env file");
        return;
    }

    // Load Cache
    let cache: AlbumCache = {};
    if (existsSync(CACHE_PATH)) {
        cache = JSON.parse(await fs.readFile(CACHE_PATH, 'utf-8'));
    }

    // Create Output Dir
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Get Files
    let files = (await fs.readdir(POINTS_DIR)).filter(f => f.endsWith('.csv'));
    files.sort(); // Process in order

    // Filter if specific week requested
    if (SPECIFIC_WEEK) {
        files = files.filter(f => f.includes(SPECIFIC_WEEK));
        if (files.length === 0) {
            console.error(`Week ${SPECIFIC_WEEK} not found in ${POINTS_DIR}`);
            return;
        }
    }

    const processedWeeks: string[] = [];

    // Process Loop
    for (const file of files) {
        const weekId = await processWeek(file, cache, apiKey);
        processedWeeks.push(weekId);
    }

    // Save Cache
    await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
    console.log(`\nCache saved to ${CACHE_PATH}`);

    // Update Index (Master List for Dropdown)
    // We only update the index if we processed ALL weeks, or we merge with existing
    if (!SPECIFIC_WEEK) {
        // If we ran a full batch, rewrite the index
        processedWeeks.sort().reverse(); // Newest first
        await fs.writeFile(INDEX_PATH, JSON.stringify(processedWeeks, null, 2));
        console.log(`Master Index updated at ${INDEX_PATH}`);
        
        // Also update latest_chart.json for the homepage default
        if (processedWeeks.length > 0) {
            const latestSrc = path.join(OUTPUT_DIR, `${processedWeeks[0]}.json`);
            const latestDest = path.join(process.cwd(), 'public', 'data', 'latest_chart.json');
            await fs.copyFile(latestSrc, latestDest);
            console.log("Updated public/data/latest_chart.json");
        }
    }
}

main();