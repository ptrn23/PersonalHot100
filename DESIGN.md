# Design Document: Personal Hot 100

## Project Overview
A web application to visualize personal music listening habits as a "Billboard Hot 100" style chart. The system transforms raw Last.fm listening history (scrobbles) into weighted charts with historical tracking.

## Background
The Billboard Hot 100, also known as simply the Hot 100, is the music industry standard record chart in the United States for songs, published weekly by Billboard magazine. Chart rankings are based on sales (physical and digital), online streaming, and radio airplay in the U.S.

Last.fm is a music website founded in the United Kingdom in 2002. Utilizing a music recommender system known as "Audioscrobbler", Last.fm creates a detailed profile of each user's musical preferences by recording the details of the tracks they listen to.

## Problem
Could a singular user's listening history be transformed into a "Billboard Hot 100" style chart?

## Understanding Components
In Billboard Hot 100:
- Sales: ???
- Streams: ???
- Airplay: ???

But last.fm is only a continuous stream of listened tracks. Thus, we will define each component as the following:
- Streams: number of times a song has been scrobbled in a given week
For example:
Taylor Swift, All Too Well (Taylor's Version)
Taylor Swift, All Too Well (Taylor's Version)
Green Day, Nice Guys Finish Last
blink-182, Down
Taylor Swift, All Too Well (Taylor's Version)
Taylor Swift, happiness
TWICE, Keeper
Taylor Swift, All Too Well (Taylor's Version)
Taylor Swift, All Too Well (Taylor's Version)
Taylor Swift, All Too Well (Taylor's Version)
dodie, Human

"All Too Well (Taylor's Version)" was scrobbled 6 times this week. Thus, the stream score for this week would be 6.

- Sales: number of "sessions" a song has been scrobbled in a given week. A session is defined as a continuous streak of scrobbles until interrupted by a different in which it fully counts as one session. Once the song is played again, a new session starts and the session score increases.

"All Too Well (Taylor's Version)" had 3 sessions this week. Thus, the sale score for this week would be 6.

- Airplay: number of scrobbles a song has in its longest session.

"All Too Well (Taylor's Version)" had 3 sessions with 2, 1, and 3 plays each. Thus, the airplay score for this week would be 3.