# Personal Hot 100: System Design

## 1. Executive Summary

This document outlines the architecture and algorithmic logic for the **Personal Hot 100**, a web-based visualization application. The system aims to transform raw, unidimensional listening history (user "scrobbles") provided by Last.fm into a weighted, multi-dimensional chart that simulates the methodology of the *Billboard Hot 100*.

## 2. Background & Context

### 2.1 The Billboard Standard

The *Billboard Hot 100* is the preeminent standard for tracking song popularity in the United States. Published weekly by *Billboard* magazine, its ranking methodology aggregates three distinct metrics of consumption:

* **Sales:** Physical and digital purchase intent.
* **Streaming:** On-demand consumption frequency.
* **Radio Airplay:** Passive audience reach and saturation.

### 2.2 The Last.fm Data Model

Last.fm is a music database and recommender system established in 2002. It utilizes "Audioscrobbler" technology to build granular user profiles by recording individual track plays, known as "scrobbles." Fundamentally, Last.fm data is **linear and temporal**, a continuous log of tracks listened to over time, lacking the distinct categories of "sales" or "airplay" found in industry charts.

## 3. Problem Statement

How can a singular, linear stream of listening history be decomposed into the three distinct dimensions (Sales, Streams, Airplay) required to generate a *Billboard*-style chart?

The objective is to derive distinct signals of **Frequency** (Streams), **Intent** (Sales), and **Saturation** (Airplay) from a single dataset of timestamps.

## 4. Methodology & Metric Definitions

To bridge the gap between the Last.fm data model and the Billboard methodology, we define the following mapping logic.

Let $T$ represent a specific track (e.g., *All Too Well (Taylor's Version)*).
Let $W$ represent the set of all scrobbles within a specific chart week.

### 4.1 Streams ($\Sigma$)

**Definition:** The *Stream* component represents raw consumption frequency. It is defined as the total cardinality of scrobbles for track $T$ within the week $W$.

$$\Sigma_T = \text{count}(T \in W)$$

Consider the following listening sequence for the week:

1. **Taylor Swift, All Too Well (Taylor's Version)**
2. **Taylor Swift, All Too Well (Taylor's Version)**
3. Green Day, Nice Guys Finish Last
4. blink-182, Down
5. **Taylor Swift, All Too Well (Taylor's Version)**
6. Taylor Swift, happiness
7. TWICE, Keeper
8. **Taylor Swift, All Too Well (Taylor's Version)**
9. **Taylor Swift, All Too Well (Taylor's Version)**
10. **Taylor Swift, All Too Well (Taylor's Version)**
11. dodie, Human

The track appears 6 times.
* $\Sigma_{ATW} = 6$

### 4.2 Sales ($\Phi$)

**Definition:** The *Sales* component represents "sessions" or conscious intent. A "session" is defined as a contiguous block of plays of track , interrupted only by a different track. This simulates a "purchase" event where the user actively chose to engage with the artist for a period of time.

Let $S$ be the set of all contiguous sessions of track $T$.


**Example Calculation:**
Using the sequence above, we can group *All Too Well (Taylor's Version)* into sessions:

* **Session 1:** [Play 1, Play 2] (Interrupted by Green Day)
* **Session 2:** [Play 5] (Interrupted by happiness)
* **Session 3:** [Play 8, Play 9, Play 10] (Interrupted by dodie)

There are 3 distinct sessions.
* $\Phi_{ATW} = 3$

### 4.3 Airplay ($\alpha$)

**Definition:** The *Airplay* component represents saturation or "power rotation." It is defined as the magnitude of the longest single session (streak) within the week. This rewards tracks that are played on repeat for extended periods, simulating high rotation on radio.

$$\alpha_T = \max_{s \in S} (\text{length}(s))$$

**Example Calculation:**
Analyzing the sessions identified in Section 4.2:

* Session 1 length: 2
* Session 2 length: 1
* Session 3 length: 3

The maximum streak length is 3.

* $\alpha_{ATW} = 3$

## 5. Scoring Algorithm & Weighting

To synthesize the three derived components into a unified ranking metric, we apply a weighted linear combination. This ensures that while all three dimensions contribute to the final score, their influence is proportional to their perceived value in the hierarchy of listening intent.

### 5.1 Component Weights

We define the following weight constants ($W$) for each component:

* **Stream Weight ($W_\Sigma$): 5**
* *Rationale:* High frequency remains the primary driver of popularity.


* **Sale Weight ($W_\Phi$): 3**
* *Rationale:* Distinct sessions indicate active re-engagement with the track.


* **Airplay Weight ($W_\alpha$): 2**
* *Rationale:* Long duration sessions serve as a supplemental "saturation" bonus.



### 5.2 Raw Point Calculation ($P_{raw}$)

The Raw Points for a track $T$ in a given week are calculated by the summation of the weighted components.
$$P_{raw}(T) = (\Sigma_T \times W_\Sigma) + (\Phi_T \times W_\Phi) + (\alpha_T \times W_\alpha)$$

Substituting the defined weights:
$$P_{raw}(T) = 5\Sigma_T + 3\Phi_T + 2\alpha_T$$

**Example Calculation:**
Continuing with *All Too Well (Taylor's Version)* from Section 4:

* $\Sigma = 6$
* $\Phi = 3$
* $\alpha = 3$

$$P_{raw} = (6 \times 5) + (3 \times 3) + (3 \times 2)$$
$$P_{raw} = 30 + 9 + 6$$
$$P_{raw} = 45$$

*Note: Under this weighting system, a single playback of a track (1 Stream, 1 Sale, 1 Airplay) yields a minimum base score of 10 points.*

## 6. Stability & Decay Logic

Raw listening data is inherently volatile; a track may be heavily consumed one week and scarcely the next. To prevent erratic chart movements and simulate the "momentum" observed in industry charts, the system employs a **Cumulative Decay Model**. This introduces historical dependency, where a track's current rank is influenced by its performance in previous weeks.

### 6.1 Cumulative Point Calculation ($P_{cum}$)

The Cumulative Points for a track in the current week  are derived from the current Raw Points plus a decayed fraction of the Cumulative Points from the previous two weeks ($t-1$ and $t-2$).

The formula is defined recursively as:
$$P_{cum}(t) = \lceil P_{raw}(t) + (P_{cum}(t-1) \times 0.3) + (P_{cum}(t-2) \times 0.2) \rceil$$

Where:

*  $\lceil x \rceil$ denotes the ceiling function (rounding up to the nearest integer).
*  $0.3$ is the decay factor for the 1-week lag.
*  $0.2$ is the decay factor for the 2-week lag.

### 6.2 Example Scenario: Stabilization Effect

Consider the historical performance of *All Too Well (Taylor's Version)* over three weeks to demonstrate how the decay factors mitigate volatility.

**Historical Data:**

* Week 1: $P_{cum} = 300$ (High activity)
* Week 2: $P_{cum} = 100$ (Significant drop)
* Week 3 (Current): $P_{raw} = 100$ (Moderate activity)

**Calculation for Week 3:**
$$P_{cum}(W3) = \lceil 100 + (100 \times 0.3) + (300 \times 0.2) \rceil$$
$$P_{cum}(W3) = \lceil 100 + 30 + 60 \rceil$$
$$P_{cum}(W3) = 190$$

Without the decay model, the track would have scored only 100 points in Week 3. However, the strong performance in Week 1 (contributing 60 points) and Week 2 (contributing 30 points) boosted the final score to 190. This effectively "smooths" the decline.

## 7. Deterministic Tie-Breaking Resolution

Given the discrete nature of the scoring components, distinct tracks (particularly those played sequentially within the same album) may converge on identical $P_{cum}$ values. To maintain a strict, reproducible ordering without resorting to random arbitration, the system employs a **Deterministic Hashing Algorithm**.

### 7.1 Stable Seed Generation
Every track entity is assigned a unique numerical seed derived from its immutable metadata (Song Title, Album Name, Artist Name). This ensures that if the chart is regenerated at a later date, the ranking order remains constant.

The seed function $S(T)$ is defined as the weighted sum of the character codes of the concatenated metadata string:

$$S(T) = \sum_{i=0}^{n} (i+1) \times \text{ASCII}(C_i)$$

Where:
* $C$ is the character sequence formed by `Title|Album|Artist`.
* $n$ is the length of the string.
* $i$ is the zero-based index of the character.

In the event that $P_{cum}(T_A) = P_{cum}(T_B)$, the system compares $S(T_A)$ and $S(T_B)$ to determine precedence.

## 8. Chart Compilation Standards

### 8.1 Temporal Definition (The "Chart Week")
To ensure consistency with external aggregation services (specifically synchronizing with *ZeroCharts* infrastructure), the standard "Chart Week" is offset from the standard calendar day.

* **Start:** Friday at 06:00 (Local System Time)
* **End:** The following Friday at 05:59 (Local System Time)

This 6-hour offset aligns the local data collection window with the midnight reset cycles of the reference external servers.

### 8.2 Ranking and Cutoff
Upon the conclusion of a Chart Week, all active tracks are sorted by $P_{cum}$ in descending order (applying the logic in Section 7 for ties).
* **The Hot 100:** Only the top $N=100$ tracks are serialized into the final chart release.
* **Bubbling Under:** Tracks falling outside the $N=100$ threshold are retained in the database for historical calculation purposes but are excluded from the public visualization.

## 9. Chart Indicators & Metadata

To provide context on a song's trajectory, the following derivative metrics are calculated during the chart generation phase.

### 9.1 Rank Status ($\Delta$)
The visual indicator of a song's movement relative to the previous week ($t-1$).

| Status | Symbol | Condition |
| :--- | :---: | :--- |
| **Rise** | $\uparrow$ | $\text{Rank}_t < \text{Rank}_{t-1}$ |
| **Fall** | $\downarrow$ | $\text{Rank}_t > \text{Rank}_{t-1}$ |
| **Stable** | $=$ | $\text{Rank}_t = \text{Rank}_{t-1}$ |
| **Debut** | **NEW** | The song appears in the top 100 for the first time ($\text{WOC} = 1$). |
| **Re-Entry** | **RE** | The song appears in the top 100, was absent in $t-1$, and has $\text{WOC} > 1$. |

### 9.2 Weeks on Chart (WOC)
A cumulative counter representing the total number of weeks a track has successfully ranked within the top 100.
$$\text{WOC}_t = \begin{cases} \text{WOC}_{prev} + 1 & \text{if Rank}_t \leq 100 \\ \text{WOC}_{prev} & \text{if Rank}_t > 100 \end{cases}$$

### 9.3 Peak Performance
* **Peak Rank:** The highest (numerically lowest) rank achieved by the song throughout its lifetime history.
    $$\text{Peak}_t = \min(\text{Rank}_t, \text{Peak}_{t-1})$$
* **Peak Streak:** A counter tracking consecutive weeks spent at the Peak Rank. This metric increments if $\text{Rank}_t = \text{Peak}_t$, and resets to 1 otherwise.

### 9.4 Point Delta ($\%$)
The percentage change in Total Cumulative Points compared to the previous week, indicating momentum regardless of rank changes.

$$\Delta\% = \left( \frac{P_{cum}(t) - P_{cum}(t-1)}{P_{cum}(t-1)} \right) \times 100$$