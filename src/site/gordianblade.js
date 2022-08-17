angular.module('gordianbla', ['angular.filter'])
    .controller('PuzzleController', ['$scope', '$http', '$sce', 'fuzzyByFilter', '$interval', function($scope, $http, $sce, fuzzyByFilter, $interval) {
        const FIRST_PUZZLE_DATE = new Date("2022-03-05");
        const MS_DAY = 60*60*24*1000;
        $scope.max = function(a) {return Math.max(...a);};
        $scope.hardMode = false;
        $scope.practiceMode = false;
        $scope.showPuzzle = true; // used after finishedPuzzle is set

        $scope.nextPuzzle_int = $interval( function() {
            now = new Date();
            nextPuzzle = new Date();
            nextPuzzle.setUTCDate(nextPuzzle.getUTCDate()+1);
            nextPuzzle.setUTCHours(0);
            nextPuzzle.setUTCMinutes(0);
            nextPuzzle.setUTCSeconds(0);
            nextPuzzle.setUTCMilliseconds(0);
            diff = nextPuzzle-now;
            tmp = Math.floor(diff/(1000*60*60));
            tmp += ":"+String(Math.floor(diff/(1000*60)%60)).padStart(2, '0');
            tmp += ":"+String(Math.floor(diff/1000%60)).padStart(2, '0');
            $scope.nextPuzzle = tmp;
        }, 1000);

        // Light mode {{{
        $scope.lightMode = localStorage.getItem('lightMode') ? localStorage.getItem('lightMode') : false;
        document.documentElement.setAttribute('data-theme', $scope.lightMode ? 'dark' : 'light');
        $scope.updateLightMode = function() {
            if ($scope.lightMode) {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
        }

        $scope.updateLightMode();
        // }}}
        // Views {{{
        $scope.showCongrats = false;

        $scope.currentView = 'puzzle';
        $scope.settingsButton = function() {
            if($scope.currentView == 'settings') {
                $scope.currentView = 'puzzle';
            } else {
                $scope.currentView = 'settings';
            }
        }

        $scope.infoButton = function() {
            if($scope.currentView == 'info') {
                $scope.currentView = 'puzzle';
            } else {
                $scope.currentView = 'info';
            }
        }

        $scope.showToast = function(text, type, delay=4000) {
            $scope.toast = text;
            $scope.toastType = type;
            if($scope.toastInt)
                $interval.cancel($scope.toastInt);
            $scope.toastInt = $interval(function() {$scope.toast = null; $interval.cancel($scope.toastInt)}, delay);
        }

        $scope.clearDialog = function() {
            $scope.dialog = null;
        }

        $scope.showDialog = function(text, type, callback, buttons) {
            $scope.dialog = text;
            $scope.dialogType = type;
            $scope.dialogCallBack = callback;
            $scope.dialogButtons = buttons;
        }
        // }}}
        // SVG Puzzle {{{
        numOfElements = {
            'combo':            [10, 20, 40, 80, 160, 320, 320],
            'triangle':         [10, 20, 40, 80, 160, 320, 320],
            'rect':             [10, 20, 40, 80, 160, 320, 320],
            'rectangle':        [10, 20, 40, 80, 160, 320, 320],
            'ellipse':          [10, 20, 40, 80, 160, 320, 320],
            'circle':           [20, 40, 80, 160, 320, 640, 640],
            'rotatedrect':      [10, 20, 40, 80, 160, 320, 320],
            'beziers':          [100, 200, 400, 800, 1600, 3200, 3200], // slight lie... there only are 1500
            'rotatedellipse':   [10, 20, 40, 80, 160, 320, 320],
            'polygon':          [10, 20, 40, 80, 160, 320, 320],
        };

        $scope.elements = 0;
        $scope.imageProcessed = false;
        $scope.svgDOM = null;
        $scope.initiateImage = function() {
            if($scope.svgDOM) {
                var elements = $scope.svgDOM.children[1].children;
                for(var i = 0; i < elements.length; i++){
                    elements[i].className.baseVal = "hidden";
                }

                $scope.svgImage = $sce.trustAsHtml($scope.svgDOM.outerHTML);
                $scope.imageProcessed = true;
                $scope.initiateImageInt = $interval(function() {$interval.cancel($scope.initiateImageInt); $scope.updateImage();}, 200);
            } else {
                $scope.initiateImageInt = $interval(function() {$interval.cancel($scope.initiateImageInt); $scope.initiateImage();}, 1000);
            }
        }

        $scope.updateImage = function() {
            if($scope.finishedPuzzle)
                $scope.elements = $scope.maxElements;
            else
                $scope.elements = numOfElements[$scope.mode][$scope.currGuess];

            $scope.updateSVG();
        };

        $scope.updateSVG = function() {
            if(!$scope.imageProcessed)
                return;
            var elements = document.getElementsByClassName('imageContainer')[0].children[0].children[1].children;
            var firstHidden = Array.from(elements).findIndex(function(e) { return e.className.baseVal == "hidden"; });
            var newElements = Math.min($scope.elements, elements.length) - firstHidden;

            const MAX_ANIMS = 99;

            for(var i = 0; i < elements.length; i++){
                if (i <= $scope.elements) {
                    if (i < firstHidden) {
                        elements[i].className.baseVal = "shown";
                    } else {
                        partial_anim = Math.min(Math.floor((i-firstHidden)/newElements*(MAX_ANIMS+1)), MAX_ANIMS);
                        elements[i].className.baseVal = "shown shown-anim-"+partial_anim;
                    }
                } else {
                    elements[i].className.baseVal = "hidden";
                }
            }
        }

        $scope.getNewPuzzle = function() {
            $http({
                method: 'GET',
                url: $scope.practiceMode ? '/fetch_puzzle.php' : '/fetch_daily_puzzle.php'
            }).then(function successCallback(response) {
                parser=new DOMParser();
                svg = parser.parseFromString(response.data,"text/xml");
                $scope.svgDOM = svg.children[0];

                var metaData = [];
                Array.from(svg.childNodes).forEach(function(el) {
                    if (el.nodeType === svg.COMMENT_NODE) {
                        el.nodeValue.split('\n').forEach(function(line) {
                            parts = line.split(': ');
                            if(parts.length >= 2) {
                                key = parts.shift();
                                value = parts.join(": ");
                                metaData[key] = value;
                            }
                        });}});

                if(metaData['Title']) {
                    $scope.title = metaData['Title'];
                } else {
                    $scope.title = "";
                }

                if(metaData['NRDB ID']) {
                    $scope.nrdbID = metaData['NRDB ID'];
                } else {
                    $scope.nrdbID = "";
                }

                if(metaData['Mode']) {
                    $scope.mode = metaData['Mode'].split(' ')[1];
                } else {
                    $scope.mode = "";
                }

                if(metaData['n']) {
                    $scope.maxElements = metaData['n'];
                } else {
                    $scope.maxElements = 100;
                }

                if(metaData['additional']) {
                    $scope.additional = metaData['additional'].split(',');
                } else {
                    $scope.additional = [];
                }

                if(metaData['daily']) {
                    $scope.dailyNumber = parseInt(metaData['daily']);
                } else {
                    $scope.dailyNumber = -1;
                }

                var width = $scope.svgDOM.getAttribute('width');
                var height = $scope.svgDOM.getAttribute('height');
                if(height) {
                    $scope.svgDOM.removeAttribute('width');
                    $scope.svgDOM.removeAttribute('height');
                    $scope.svgDOM.setAttribute('width', '100%');
                    $scope.svgDOM.setAttribute('viewBox', '0 0 '+width+' '+height);
                }

                $scope.svgImage = $sce.trustAsHtml($scope.svgDOM.outerHTML);

                $scope.initiateImage();
                $scope.loadGuesses();

            }, function errorCallback(response) {
                $scope.showToast("Fetching puzzle failed.", "error");
                console.log("Error: Fetching puzzle failed.");
            });
        };
        $scope.getNewPuzzle();
        //}}}
        // Guesses Display {{{
        $scope.clearGuesses = function() {
            $scope.guesses = [{'state': 'not-guessed'},
                {'state': 'not-guessed'},
                {'state': 'not-guessed'},
                {'state': 'not-guessed'},
                {'state': 'not-guessed'},
                {'state': 'not-guessed'}];
            $scope.currGuess = 0;
        };
        $scope.clearGuesses();

        $scope.loadGuesses = function() {
            if(!$scope.practiceMode) {
                if ($scope.stats.lastPlayed === null) {
                    $scope.clearGuesses();
                } else {
                    if ($scope.stats.lastPlayed < $scope.dailyNumber) { // next puzzle ready
                        $scope.clearGuesses();
                        if($scope.dailyNumber != $scope.stats.lastPlayed + 1 && $scope.stats.lastPlayed != 130 && $scope.stats.lastPlayed != 129) {
                            $scope.stats.streak = 0;
                            $scope.updateStats();
                        }
                    } else {
                        if(localStorage.getItem('guesses'))
                            $scope.guesses = JSON.parse(localStorage.getItem('guesses'));
                        else
                            $scope.clearGuesses();
                    }

                    alreadyGuessed = $scope.guesses.filter(function(g){return g.state != 'not-guessed'});
                    $scope.currGuess = alreadyGuessed.length;

                    $scope.finishedPuzzle = ($scope.guesses.filter(function(g){return g.state == 'correct'}).length > 0) || ($scope.currGuess == 6);
                    if($scope.finishedPuzzle)
                        $scope.endOfPuzzleAnimation();
                }
            } else {
                $scope.clearGuesses();
            }
        };

        $scope.saveGuesses = function() {
            if(!$scope.practiceMode)
                localStorage.setItem('guesses', JSON.stringify($scope.guesses))
        };

        $scope.endOfPuzzleAnimation = function() {
            $scope.congratsInt = $interval(function() {
                $interval.cancel($scope.congratsInt);
                $scope.showPuzzle = false;
                $scope.congratsInt = $interval(function() {
                    $interval.cancel($scope.congratsInt);
                    $scope.showCongrats = true;
                }, 800);
            }, 3000);
        }

        $scope.guess = function(card) {
            correctCard = $scope.allCards.filter(function(c){return c.title == $scope.title;})[0];
            newGuess = {'guessedTitle': card.title};
            if(card.title == correctCard.title) {
                newGuess.state = 'correct';
                newGuess.title = 'correct';
                $scope.addStat(true)
                $scope.finishedPuzzle = true;
                $scope.endOfPuzzleAnimation();
            } else {
                newGuess.state = 'incorrect';
                newGuess.title = 'incorrect';

                if($scope.currGuess == 5) {
                    $scope.addStat(false);
                    $scope.finishedPuzzle = true;
                    $scope.endOfPuzzleAnimation();
                }
            }

            newGuess.typeCorrect = (card.type_code == correctCard.type_code);

            if(correctCard.keywords)
                correctTypes = correctCard.keywords.split(' - ');
            else
                correctTypes = [];

            if(card.keywords)
                cardTypes = card.keywords.split(' - ');
            else
                cardTypes = [];

            hits = cardTypes.filter(value => correctTypes.includes(value));

            newGuess.subtypeHits = hits.length;
            newGuess.subtypeTotal = correctTypes.length;

            newGuess.partialClass = 'partial-'+newGuess.subtypeHits+'-'+newGuess.subtypeTotal;
            if(correctTypes.filter(v => !cardTypes.includes(v)).length == 0 && cardTypes.filter(v => !correctTypes.includes(v)).length > 0) {
                newGuess.partialClass = 'incorrect';
            }

            if(card.cost)
                newGuess.guessedCost = card.cost;
            else if(card.advancement_cost)
                newGuess.guessedCost = card.advancement_cost;
            else
                newGuess.guessedCost = null;

            correctCost = -1;
            if(correctCard.cost)
                correctCost = correctCard.cost;
            else if(correctCard.advancement_cost)
                correctCost = correctCard.advancement_cost;
            else
                correctCost = null;

            newGuess.costCorrect = (newGuess.guessedCost == correctCost);

            newGuess.factionCorrect = (card.faction_code == correctCard.faction_code);

            // console.log(card, correctCard);

            $scope.guesses[$scope.currGuess] = newGuess;
            $scope.currGuess++;
            $scope.stats.lastPlayed = $scope.dailyNumber;
            $scope.updateStats();
            $scope.saveGuesses();
            $scope.updateImage();
        }
        // }}}
        // NRDB get cards {{{
        $scope.allCards = [];

        $sce.trustAsResourceUrl('https://netrunnerdb.com/api/**');
        $http({
            method: 'GET',
            cache: true,
            url: 'https://netrunnerdb.com/api/2.0/public/cards'
        }).then(function successCallback(response) {
            $scope.allCards = response.data.data;
            $scope.allCards = makeUniqueByKey($scope.allCards, 'title');
        }, function errorCallback(response) {
            $scope.showToast("Error: Fetching NRDB cards failed.", "error");
            console.log("Error: Fetching NRDB cards failed.");
        });
        $scope.getCardURL = function() {
            correctCard = $scope.allCards.filter(function(c){return c.title == $scope.title;})[0];
            if(!correctCard)
                return "";

            if(correctCard['special_url'])
                return correctCard['special_url'];
            else
                return "https://netrunnerdb.com/card_image/large/" + $scope.nrdbID + ".jpg";
        };

        // }}}
        // Fuzzy guesses {{{
        $scope.selectionFuzzy = -1;

        $scope.updateFuzzy = function() {
            tmp = fuzzyByFilter($scope.allCards, "stripped_title", $scope.guessInput);
            tmp = makeUniqueByKey(tmp, 'title');
            fullHits = $scope.allCards.filter(function(c){ return c.title.toLowerCase().startsWith($scope.guessInput.toLowerCase()) || c.stripped_title.toLowerCase().startsWith($scope.guessInput.toLowerCase()); });
            tmp = tmp.filter(c => !fullHits.includes(c));
            tmp = fullHits.concat(tmp);
            $scope.possibleCards = tmp;
            $scope.selectionFuzzy = 0;
        };

        $scope.enterGuess = function() {
            if($scope.guessInput && $scope.currGuess < 6) {
                if($scope.guessInput == $scope.possibleCards[$scope.selectionFuzzy].title) {
                    $scope.guess($scope.possibleCards[$scope.selectionFuzzy]);
                    $scope.guessInput = "";
                    $scope.updateFuzzy();
                } else {
                    $scope.guessInput = $scope.possibleCards[$scope.selectionFuzzy].title;
                }
            }
        };

        $scope.keydownFuzzy = function(e) {
            // console.log(e.keyCode);
            if($scope.possibleCards && $scope.possibleCards.length > 0 && $scope.guessInput) {
                if(e.keyCode == 13) { // ENTER
                    $scope.enterGuess();
                } else if(e.keyCode == 40) { // DOWN
                    if($scope.selectionFuzzy < $scope.possibleCards.length-1) {
                        $scope.selectionFuzzy++;
                    }
                    $scope.guessInput = $scope.possibleCards[$scope.selectionFuzzy].title;
                } else if(e.keyCode == 38) { // UP
                    if($scope.selectionFuzzy > 0) {
                        $scope.selectionFuzzy--;
                    } else if ($scope.selectionFuzzy < 0) {
                        $scope.selectionFuzzy = 0;
                    }
                    $scope.guessInput = $scope.possibleCards[$scope.selectionFuzzy].title;
                } else {
                    $scope.selectionFuzzy = -1;
                }
                sug = document.getElementById("suggestions");
                sug.scrollTop = $scope.selectionFuzzy * sug.scrollHeight/$scope.possibleCards.length;

            }
        }

        $scope.selectFuzzy = function(i) {
            if($scope.selectionFuzzy == i) {
                $scope.guessInput = $scope.possibleCards[i].title;
                $scope.enterGuess();
            } else {
                $scope.selectionFuzzy = i;
                $scope.guessInput = $scope.possibleCards[$scope.selectionFuzzy].title;
            }
        }
        // }}}
        // Stats {{{
        $scope.updateStats = function() {
            localStorage.setItem('played', $scope.stats.played);
            localStorage.setItem('wins', $scope.stats.wins);
            if($scope.stats.lastPlayed)
                localStorage.setItem('lastPlayed', $scope.stats.lastPlayed);
            else
                localStorage.setItem('lastPlayed', null);
            localStorage.setItem('streak', $scope.stats.streak);
            localStorage.setItem('maxStreak', $scope.stats.maxStreak);
            localStorage.setItem('distribution', $scope.stats.distribution.join('-'));
        };

        $scope.addStat = function(win) {
            if(!$scope.practiceMode) {
                $scope.stats.played++;
                if(win) {
                    $scope.stats.wins++;
                    $scope.stats.streak++;
                } else {
                    $scope.stats.streak = 0;
                }
                if($scope.stats.streak > $scope.stats.maxStreak)
                    $scope.stats.maxStreak = $scope.stats.streak;
                if(win)
                    $scope.stats.distribution[$scope.currGuess]++;
                $scope.updateStats();
            }
        }

        parseLastPlayed = function() {
            // Old format of lastPlayed was a datetimestamp of solving the last puzzle
            // New format is simply the puzzle number

            if (localStorage.getItem('lastPlayed') === null)
                return null;

            date = new Date(localStorage.getItem('lastPlayed'));

            if (!isNaN(date) && date.getUTCFullYear > 2020) { // old format detected
                return Math.floor((date.getTime() - FIRST_PUZZLE_DATE.getTime())/MS_DAY);
            } else { // new format (number of daily puzzle, parsed as ms after 1/1/1970)
                n = parseInt(localStorage.getItem('lastPlayed'));
                if(isNaN(n))
                    return null;
                else
                    return n;
            }
        };

        if(localStorage.getItem('played')) {
            $scope.stats = {'played': localStorage.getItem('played'),
                            'wins': localStorage.getItem('wins'),
                            'lastPlayed': parseLastPlayed(),
                            'streak': localStorage.getItem('streak'),
                            'maxStreak': localStorage.getItem('maxStreak'),
                            'distribution': localStorage.getItem('distribution').split('-')};
        } else {
            $scope.stats = {'played': 0,
                            'wins': 0,
                            'lastPlayed': null,
                            'streak': 0,
                            'maxStreak': 0,
                            'distribution': [0, 0, 0, 0, 0, 0]};
            $scope.updateStats();
        }

        $scope.copyShare = function() {
            text = "gordianbla.de - "+$scope.dailyNumber+"\n";
            text += "Guesses: "+$scope.currGuess+"/6";
            if($scope.hardMode)
                text += "*";
            text += "\n";

            for(g of $scope.guesses) {
                if(g.state != 'not-guessed') {
                    if(g.factionCorrect) {
                        text += "🟩";
                    } else {
                        if($scope.lightMode)
                            text += "⬜";
                        else
                            text += "⬛";
                    }

                    if(g.typeCorrect) {
                        text += "🟩";
                    } else {
                        if($scope.lightMode)
                            text += "⬜";
                        else
                            text += "⬛";
                    }

                    if(g.subtypeTotal == 0) {
                        if(g.state == 'correct') {
                            text += "🟩";
                        } else {
                            if($scope.lightMode)
                                text += "⬜";
                            else
                                text += "⬛";
                        }
                    } else {
                        if(g.subtypeHits == g.subtypeTotal) {
                            text += "🟩";
                        } else {
                            if($scope.lightMode)
                                text += "⬜";
                            else
                                text += "⬛";
                        }
                    }
                    if(g.costCorrect) {
                        text += "🟩";
                    } else {
                        if($scope.lightMode)
                            text += "⬜";
                        else
                            text += "⬛";
                    }

                    if(g.state == 'correct') {
                        text += "🟩";
                    } else {
                        if($scope.lightMode)
                            text += "⬜";
                        else
                            text += "⬛";
                    }
                    text += "\n";
                }
            }
            navigator.clipboard.writeText(text.trim());
            $scope.showToast("Text copied to clipboard.", "info");
        }
        // }}}
    }]);

function makeUniqueByKey(list, key) {
    keys = {};
    for(e of list) {
        if(!(e[key] in keys)) {
            keys[e[key]] = e;
        }
    }
    return Object.values(keys);
}
