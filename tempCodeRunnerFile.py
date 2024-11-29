# Retrieve points from previous weeks if they charted
        if week_index > 0:  # Check for the previous week
            previous_week_songs = {entry[0]: entry[1] for entry in ranked_weeks[week_index - 1][1]}
            if (song, artist) in previous_week_songs:
                previous_points = previous_week_songs[(song, artist)]
                if song == "American Idiot":
                    print(previous_week_songs[(song, artist)])

        if week_index > 1:  # Check for two weeks ago
            two_weeks_ago_songs = {entry[0]: entry[1] for entry in ranked_weeks[week_index - 2][1]}
            if (song, artist) in two_weeks_ago_songs:
                two_weeks_ago_points = two_weeks_ago_songs[(song, artist)]
                if song == "American Idiot":
                    print(two_weeks_ago_songs[(song, artist)])