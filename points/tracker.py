def get_past_points(week_idx, song, artist, ranked_weeks):
    previous, two_ago = 0, 0
    if week_idx > 0:
        prev = {entry[0]: entry[2] for entry in ranked_weeks[week_idx - 1][1]}
        previous = prev.get((song, artist), 0)
    if week_idx > 1:
        two = {entry[0]: entry[2] for entry in ranked_weeks[week_idx - 2][1]}
        two_ago = two.get((song, artist), 0)
    return previous, two_ago

def update_peak_and_woc(song_data, rank):
    if song_data["peak"] > rank:
        song_data["peak"] = rank
        song_data["woc"] += 1
        song_data["peak_streak"] = 1
        return True, False
    if song_data["peak"] == rank:
        song_data["peak"] = rank
        song_data["woc"] += 1
        song_data["peak_streak"] += 1
        return True, True
    song_data["woc"] += 1
    return False, False
    
def get_status(current_pos, prev_pos, key, charted_cache, prev_week_positions, current_week):
    # print(key) if key == ("All Too Well (Taylor's Version)", "Taylor Swift") else None
    if prev_pos is None:
        # print(charted_cache[key], current_week, charted_cache[key] == current_week) if key == ("All Too Well (Taylor's Version)", "Taylor Swift") else None
        if key not in charted_cache:
            return "NEW"
        elif charted_cache[key] == current_week:
            return "NEW"
        else:
            return "RE"
    elif prev_pos > current_pos:
        return f"+{prev_pos - current_pos}"
    elif prev_pos < current_pos:
        return f"-{current_pos - prev_pos}"
    else:
        return "="