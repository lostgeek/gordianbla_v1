#!/bin/bash

puzzle_folder="$HOME/devel/gordianbla/daily-puzzles"

current=$(curl -s https://gordianbla.de/current_daily_puzzle.php | sed 's/^0*//')
current=${current%%.*}

existing=$(find "$puzzle_folder"/*.svg.gz | tail -n 1 | xargs -n 1 basename | sed 's/^0*//')
existing=${existing%%.*}

days_left=$((existing - current))

if (( days_left < 14 )); then
    echo $days_left "days of puzzles left!"
fi
