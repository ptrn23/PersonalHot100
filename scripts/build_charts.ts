import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { existsSync } from 'fs';

dotenv.config();

// --- CONFIGURATION ---
const YEAR = 2026;
const CHART_LIMIT = 100;
const SPECIFIC_WEEK: string | null = null; 

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
  pointsPct: string; // Keep as string to handle "--"
  peak: string;
  peakStreak: string;
  isNewPeak: boolean;
  isRePeak: boolean;
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
  [key: string]: string;
}

// --- HELPERS ---
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Fix: Handle '--' explicitly so it returns 0 instead of NaN
const parseNum = (val: string | undefined) => {
    if (!val || val === '-' || val === '--') return 0;
    return parseFloat(val.replace('%', ''));
};

async function fetchCoverFromLastFM(artist: string, album: string, apiKey: string): Promise<string> {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    const images = data?.album?.image;
    if (Array.isArray(images) && images.length > 0) {
        return images[images.length - 1]['#text'] || '';
    }
  } catch (error) { }
  return '';
}

// --- MAIN PROCESSOR ---
async function processWeek(filename: string, cache: AlbumCache, apiKey: string) {
    const week = filename.replace('.csv', '');
    const inputPath = path.join(POINTS_DIR, filename);
    
    console.log(`\nProcessing Week: ${week}...`);

    const fileContent = await fs.readFile(inputPath, 'utf-8');
    const records = parse(fileContent, { 
        columns: true, 
        skip_empty_lines: true 
    });

    // Identify Missing Covers
    const topRecords = records.slice(0, CHART_LIMIT);
    const missing: { artist: string, album: string }[] = [];

    for (const row of topRecords) {
        const key = `${row.Artist}|${row.Album}`;
        if (!cache[key]) {
            if (!missing.find(m => m.artist === row.Artist && m.album === row.Album)) {
                missing.push({ artist: row.Artist, album: row.Album });
            }
        }
    }

    // Fetch Missing Covers
    if (missing.length > 0) {
        console.log(`  - Fetching ${missing.length} new covers...`);
        const BATCH_SIZE = 5;
        for (let i = 0; i < missing.length; i += BATCH_SIZE) {
            const batch = missing.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (item) => {
                const url = await fetchCoverFromLastFM(item.artist, item.album, apiKey);
                const key = `${item.artist}|${item.album}`;
                cache[key] = url;
                process.stdout.write('.');
            }));
            await sleep(200);
        }
        console.log(" Done.");
    }

    // Transform Data
    const songs: SongEntry[] = topRecords.map((row: any) => {
        const rank = parseInt(row.Position);
        const woc = parseInt(row.WOC);
        const lastWeekRaw = row['Previous Rank'];
        const lastWeek = (lastWeekRaw && lastWeekRaw !== '--') ? parseInt(lastWeekRaw) : null;
        
        // Status Logic
        let status: SongEntry['status'] = 'stable';
        let change = 0;
        
        if (lastWeek === null) {
            status = woc === 1 ? 'new' : 're';
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
            pointsPct: row['%'] || '--', // Default to '--' string if missing
            peak: row.Peak || '-',
            peakStreak: row['Peak Streak'] || '',
            // Boolean Flags for Peak Styling
            isNewPeak: row['New Peak?'] === 'True',
            isRePeak: row['Re-peak?'] === 'True',
            
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

    const outputData = {
        meta: { 
            year: YEAR, 
            week: week, 
            generated_at: new Date().toISOString().split('T')[0] 
        },
        songs: songs
    };

    const outputPath = path.join(OUTPUT_DIR, `${YEAR}-${week}.json`);
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 0));
    console.log(`  -> Saved ${YEAR}-${week}.json`);
    
    return `${YEAR}-${week}`;
}

async function main() {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) {
        console.error("ERROR: LASTFM_API_KEY is missing");
        return;
    }

    let cache: AlbumCache = {};
    if (existsSync(CACHE_PATH)) {
        cache = JSON.parse(await fs.readFile(CACHE_PATH, 'utf-8'));
    }

    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    let files = (await fs.readdir(POINTS_DIR)).filter(f => f.endsWith('.csv'));
    files.sort();

    if (SPECIFIC_WEEK) {
        files = files.filter(f => f.includes(SPECIFIC_WEEK));
    }

    const processedWeeks: string[] = [];

    for (const file of files) {
        const weekId = await processWeek(file, cache, apiKey);
        processedWeeks.push(weekId);
    }

    await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));

    if (!SPECIFIC_WEEK) {
        processedWeeks.sort().reverse();
        await fs.writeFile(INDEX_PATH, JSON.stringify(processedWeeks, null, 2));
        
        if (processedWeeks.length > 0) {
            const latestSrc = path.join(OUTPUT_DIR, `${processedWeeks[0]}.json`);
            const latestDest = path.join(process.cwd(), 'public', 'data', 'latest_chart.json');
            await fs.copyFile(latestSrc, latestDest);
        }
    }
}

main();