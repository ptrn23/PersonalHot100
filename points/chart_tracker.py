def update_peak_woc(song_data, rank):
    if song_data["peak"] > rank:
        song_data["peak"] = rank
    song_data["woc"] += 1

def get_rank_change_status(current_pos, previous_pos, ever_charted):
    if previous_pos is None:
        return "RE" if ever_charted else "NEW"
    if previous_pos > current_pos:
        return f"+{previous_pos - current_pos}"
    if previous_pos < current_pos:
        return f"-{current_pos - previous_pos}"
    return "="

def get_past_points(week_idx, song, artist, ranked_weeks):
    previous = 0
    two_ago = 0

    if week_idx > 0:
        prev_week = {entry[0]: entry[2] for entry in ranked_weeks[week_idx - 1][1]}
        previous = prev_week.get((song, artist), 0)

    if week_idx > 1:
        two_weeks_ago = {entry[0]: entry[2] for entry in ranked_weeks[week_idx - 2][1]}
        two_ago = two_weeks_ago.get((song, artist), 0)

    return previous, two_ago