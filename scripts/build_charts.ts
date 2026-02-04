import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { existsSync } from 'fs';

dotenv.config();

// --- CONFIGURATION ---
const YEARS = [2025, 2026]; 
const CHART_LIMIT = 100;
const SPECIFIC_WEEK: string | null = null; 

const POINTS_BASE_DIR = path.join(process.cwd(), 'scripts', 'points');
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
  isTopSales: boolean;
  isTopStreams: boolean;
  isTopAirplay: boolean;
  isTopUnits: boolean;
  feed?: string[];
}

interface RawCsvRow {
  Position: string;
  Song: string;
  Artist: string;
  Album: string;
  WOC: string;
  'Previous Rank': string;
  'Total Weighted Points': string;
  '%': string;
  Peak: string;
  'Peak Streak': string;
  'New Peak?': string;
  'Re-peak?': string;
  'Sales Units': string;
  'Sales %': string;
  'Streams Units': string;
  'Streams %': string;
  'Airplay Units': string;
  'Airplay %': string;
  'Total Units': string;
}

interface AlbumCache {
  [key: string]: string;
}

// --- CONSTANTS ---
const CHART_NAME = "Personal";
const MILESTONE_WEEKS = new Set([20, 30, 40, 50, 60, 70, 80, 90, 100]);
const SPECIAL_MILESTONES: { [key: number]: string } = { 52: "one year", 104: "two years" };

// --- HELPERS ---
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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

const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function generateFeed(songs: SongEntry[]) {
    const getPct = (s: SongEntry) => s.pointsPct === '--' ? -Infinity : parseFloat(s.pointsPct.replace('%',''));
    const getRise = (s: SongEntry) => s.status === 'rise' ? s.change : -Infinity;
    const getFall = (s: SongEntry) => s.status === 'fall' ? s.change : -Infinity; 
    const getFallPct = (s: SongEntry) => s.pointsPct === '--' ? Infinity : parseFloat(s.pointsPct.replace('%',''));
    
    songs.forEach(s => s.feed = []);

    songs.forEach(song => {
        // Debut
        if (song.status === 'new') {
            song.feed!.push(`“${song.title}” by ${song.artist} debuts at #${song.rank} in ${CHART_NAME} Hot 100.`);
        }
        
        // Re-entry
        else if (song.status === 're') {
            if (song.isNewPeak) {
                song.feed!.push(`“${song.title}” by ${song.artist} reaches a new peak in ${CHART_NAME} Hot 100, reentering at #${song.rank}.`);
            } else {
                song.feed!.push(`“${song.title}” by ${song.artist} reenters ${CHART_NAME} Hot 100 at #${song.rank}.`);
            }
        }

        // #1 Updates
        if (song.rank === 1 && song.lastWeek) {
            const streak = parseInt(song.peakStreak) || 1;
            if (song.peakStreak === '1' || streak === 1) { 
                 if(song.peak === '1') song.feed!.push(`“${song.title}” by ${song.artist} reaches #1 in the ${CHART_NAME} Hot 100 for the first time.`);
            } else if (song.lastWeek === 1) {
                song.feed!.push(`“${song.title}” by ${song.artist} spends a ${ordinal(streak)} week at #1 in the ${CHART_NAME} Hot 100.`);
            } else {
                song.feed!.push(`“${song.title}” by ${song.artist} returns to #1 in the ${CHART_NAME} Hot 100 for a ${ordinal(streak)} nonconsecutive week at the top.`);
            }
        }

        // Milestones
        const woc = typeof song.woc === 'number' ? song.woc : parseInt(song.woc) || 0;
        if (SPECIAL_MILESTONES[woc]) {
            song.feed!.push(`“${song.title}” by ${song.artist} has now completed ${SPECIAL_MILESTONES[woc]} (${woc} weeks of charting) in ${CHART_NAME} Hot 100.`);
        } else if (MILESTONE_WEEKS.has(woc)) {
            song.feed!.push(`“${song.title}” by ${song.artist} spends its ${ordinal(woc)} week in ${CHART_NAME} Hot 100 this week.`);
        }

        // Climbers (New Peak) - Excluding Debuts/Re-entries
        if (song.status === 'rise' && song.isNewPeak) {
            song.feed!.push(`“${song.title}” by ${song.artist} reaches a new peak in ${CHART_NAME} Hot 100, rising ${song.change} spot${song.change !== 1 ? 's' : ''} to #${song.rank}.`);
        }

        // Top 10/5 Climbers
        if (song.status === 'rise' && song.lastWeek) {
            if (song.rank <= 5 && song.lastWeek > 5) {
                song.feed!.push(`“${song.title}” by ${song.artist} climbs inside the top 5 of ${CHART_NAME} Hot 100, rising ${song.change} spot${song.change !== 1 ? 's' : ''} to #${song.rank}.`);
            } else if (song.rank <= 10 && song.lastWeek > 10) {
                 song.feed!.push(`“${song.title}” by ${song.artist} climbs inside the top 10 of ${CHART_NAME} Hot 100, rising ${song.change} spot${song.change !== 1 ? 's' : ''} to #${song.rank}.`);
            }
        }
    });

    // 4. Superlatives (Find the winner, then attach the feed to THEM)
    
    // Biggest % Gainer
    const bigPctGainer = songs.reduce((prev, curr) => getPct(curr) > getPct(prev) ? curr : prev, songs[0]);
    if (getPct(bigPctGainer) > 0) { 
        const pct = Math.round(getPct(bigPctGainer) * 100);
        bigPctGainer.feed!.push(`“${bigPctGainer.title}” by ${bigPctGainer.artist} is the biggest percentage gainer in ${CHART_NAME} Hot 100 this week, rising ${pct}% to ${Math.round(bigPctGainer.points)} points.`);
    }

    // Biggest Position Gainer
    const bigPosGainer = songs.reduce((prev, curr) => getRise(curr) > getRise(prev) ? curr : prev, songs[0]);
    if (bigPosGainer.status === 'rise') {
        bigPosGainer.feed!.push(`“${bigPosGainer.title}” by ${bigPosGainer.artist} is the biggest position gainer in ${CHART_NAME} Hot 100 this week, rising ${bigPosGainer.change} spot${bigPosGainer.change !== 1 ? 's' : ''} to #${bigPosGainer.rank}.`);
    }

    // Biggest % Faller
    const bigPctFaller = songs.reduce((prev, curr) => getFallPct(curr) < getFallPct(prev) ? curr : prev, songs[0]);
    if (getFallPct(bigPctFaller) < 0 && getFallPct(bigPctFaller) !== Infinity) {
         const pct = Math.abs(Math.round(getFallPct(bigPctFaller) * 100));
         bigPctFaller.feed!.push(`“${bigPctFaller.title}” by ${bigPctFaller.artist} is the biggest percentage faller in ${CHART_NAME} Hot 100 this week, dropping ${pct}% to ${Math.round(bigPctFaller.points)} points.`);
    }

    // Biggest Position Faller
    const bigPosFaller = songs.reduce((prev, curr) => getFall(curr) > getFall(prev) ? curr : prev, songs[0]);
    if (bigPosFaller.status === 'fall') {
         bigPosFaller.feed!.push(`“${bigPosFaller.title}” by ${bigPosFaller.artist} drops ${bigPosFaller.change} spot${bigPosFaller.change !== 1 ? 's' : ''} to #${bigPosFaller.rank} — the biggest drop this week in ${CHART_NAME} Hot 100.`);
    }
}

// --- MAIN PROCESSOR ---
async function processWeek(filename: string, year: number, cache: AlbumCache, apiKey: string) {
    const week = filename.replace('.csv', '');
    // Construct the path dynamically based on the year passed in
    const inputPath = path.join(POINTS_BASE_DIR, year.toString(), filename);
    
    console.log(`\nProcessing Week: ${year}-${week}...`);

    const fileContent = await fs.readFile(inputPath, 'utf-8');
    const records = parse(fileContent, { 
        columns: true, 
        skip_empty_lines: true 
    }) as RawCsvRow[];

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
            pointsPct: row['%'] || '--',
            peak: row.Peak || '-',
            peakStreak: row['Peak Streak'] || '',
            isNewPeak: row['New Peak?'] === 'True',
            isRePeak: row['Re-peak?'] === 'True',
            woc: row.WOC || '-',
            sales: parseNum(row['Sales Units']),
            salesPct: row['Sales %'] || '-',
            streams: parseNum(row['Streams Units']),
            streamsPct: row['Streams %'] || '-',
            airplay: parseNum(row['Airplay Units']),
            airplayPct: row['Airplay %'] || '-',
            units: parseNum(row['Total Units']),
            isTopSales: false,
            isTopStreams: false,
            isTopAirplay: false,
            isTopUnits: false,
        };
    });

    const maxSales = Math.max(...songs.map(s => s.sales));
    const maxStreams = Math.max(...songs.map(s => s.streams));
    const maxAirplay = Math.max(...songs.map(s => s.airplay));
    const maxUnits = Math.max(...songs.map(s => s.units));

    songs.forEach(song => {
        song.isTopSales = song.sales > 0 && song.sales === maxSales;
        song.isTopStreams = song.streams > 0 && song.streams === maxStreams;
        song.isTopAirplay = song.airplay > 0 && song.airplay === maxAirplay;
        song.isTopUnits = song.units > 0 && song.units === maxUnits;
    });

    generateFeed(songs);

    const outputData = {
        meta: { 
            year: year, 
            week: week, 
            generated_at: new Date().toISOString().split('T')[0] 
        },
        songs: songs
    };

    const outputId = `${year}-${week}`;
    const outputPath = path.join(OUTPUT_DIR, `${outputId}.json`);
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 0));
    console.log(`  -> Saved ${outputId}.json`);
    
    return outputId;
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

    const allProcessedWeeks: string[] = [];

    // 5. UPDATED: Loop through each year in the array
    for (const year of YEARS) {
        const pointsDir = path.join(POINTS_BASE_DIR, year.toString());
        
        if (!existsSync(pointsDir)) {
            console.log(`Skipping ${year}: Directory not found at ${pointsDir}`);
            continue;
        }

        let files = (await fs.readdir(pointsDir)).filter(f => f.endsWith('.csv'));
        files.sort();

        if (SPECIFIC_WEEK) {
            files = files.filter(f => f.includes(SPECIFIC_WEEK));
        }

        for (const file of files) {
            // Pass the current year to the processor
            const weekId = await processWeek(file, year, cache, apiKey);
            allProcessedWeeks.push(weekId);
        }
    }

    await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));

    if (!SPECIFIC_WEEK) {
        allProcessedWeeks.sort().reverse();
        await fs.writeFile(INDEX_PATH, JSON.stringify(allProcessedWeeks, null, 2));
        
        if (allProcessedWeeks.length > 0) {
            const latestSrc = path.join(OUTPUT_DIR, `${allProcessedWeeks[0]}.json`);
            const latestDest = path.join(process.cwd(), 'public', 'data', 'latest_chart.json');
            await fs.copyFile(latestSrc, latestDest);
            console.log(`Updated latest_chart.json to ${allProcessedWeeks[0]}`);
        }
    }
}

main();