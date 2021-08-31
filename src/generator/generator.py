#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import random
import urllib
import tempfile
import os.path
import uuid

import subprocess
from datetime import datetime
import sys

PARAMETERS = {
        'combo': [0, 100],
        'triangle': [1, 150],
        'rect': [2, 200],
        'rectangle': [2, 200],
        'ellipse': [3, 200],
        'circle': [4, 400],
        'rotatedrect': [5, 200],
        'beziers': [6, 1500],
        'rotatedellipse': [7, 200],
        'polygon': [8, 200],}

def get_card_image(folder, card):
    if 'image_url' in card.keys():
        url = card['image_url']
    else:
        url = "https://netrunnerdb.com/card_image/{0}.png".format(card['code'])

    try:
        urllib.request.urlretrieve(url, os.path.join(folder.name, 'solution.png'))
    except:
        try:
            url = "https://netrunnerdb.com/card_image/large/{0}.png".format(card['code'])
            urllib.request.urlretrieve(url, os.path.join(folder.name, 'solution.png'))
        except:
            url = "https://netrunnerdb.com/card_image/large/{0}.jpg".format(card['code'])
            urllib.request.urlretrieve(url, os.path.join(folder.name, 'solution.png'))

    return os.path.join(folder.name, 'solution.png')

def main():
    if len(sys.argv) == 1:
        N = 1
    else:
        N = int(sys.argv[1])

    for i in range(N):
        response = requests.get('http://netrunnerdb.com/api/2.0/public/cards')
        cards = response.json()['data']
        card = random.choice(cards)
        folder = tempfile.TemporaryDirectory()

        try:
            path = get_card_image(folder, card)
        except:
            print(f"Did not find image for {card['title']}")
            continue

        mode = random.choice(list(PARAMETERS.keys()))
        params = PARAMETERS[mode]
        mode_nr = params[0]
        n = params[1]
        solution_id = uuid.uuid1()

        print(f"Creating {card['title']} in {mode}: puzzles/{solution_id}.svg...")
        started = datetime.now()

        process = subprocess.Popen(f'go run ./lib/primitive/main.go -i {path} -o ./puzzles/{solution_id}.svg -m {mode_nr} -n {n} -v', stdout=subprocess.PIPE, shell=True)
        process.communicate()

        with open(f'./puzzles/{solution_id}.svg', 'r+') as f:
            lines = f.readlines()
            lines.insert(0, f'<!--\nTitle: {card["title"]}\nMode: {mode_nr} {mode}\nn: {n}\n-->\n')
            f.seek(0)
            f.writelines(lines)

        print("Finished in " + str(datetime.now()-started) + "\n")


if __name__ == "__main__":
    main()

