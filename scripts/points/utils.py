from math import ceil

STREAMS_WEIGHT = 5000
SALES_WEIGHT = 3000
AIRPLAY_WEIGHT = 2000
RETENTION_WEIGHTS = [1, 0.3, 0.2]

def calculate_points(streams, sales, airplay):
    return ceil((STREAMS_WEIGHT * streams + SALES_WEIGHT * sales + AIRPLAY_WEIGHT * airplay) / 1000)

def calculate_weighted_points(current, previous, two_weeks_ago):
    return ceil(
        RETENTION_WEIGHTS[0] * current +
        RETENTION_WEIGHTS[1] * previous +
        RETENTION_WEIGHTS[2] * two_weeks_ago
    )
