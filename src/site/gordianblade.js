angular.module('gordianbla', ['angular.filter'])
    .controller('PuzzleController', ['$scope', '$http', '$sce', 'fuzzyByFilter', '$interval', function($scope, $http, $sce, fuzzyByFilter, $interval) {
        $scope.max = function(a) {return Math.max(...a);};
        $scope.hardMode = false;
        $scope.finishedPuzzle = true;

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
        // }}}
        // SVG Puzzle {{{
        $scope.elements = 10;
        $scope.minElements = 0;
        $scope.maxElements = 200;

        $scope.svgDOM = null;

        $scope.updateImage = function() {
            var elements = $scope.svgDOM.children[1].children;
            for(var i = 0; i < elements.length; i++){
                if(i >= $scope.elements) {
                    elements[i].style.display = "none";
                } else {
                    elements[i].style.display = "unset";
                }
            }
            $scope.svgImage = $sce.trustAsHtml($scope.svgDOM.outerHTML);
        }

        $http({
            method: 'GET',
            url: '/fetch_puzzle.php'
        }).then(function successCallback(response) {

            var lines = response.data.split('\n');
            var parts = lines[1].split(': ');
            $scope.title = parts.slice(1).join(": ");
            $scope.mode = lines[2].split(': ', 2)[1].split(' ')[1];
            $scope.maxElements = lines[3].split(': ', 2)[1];

            parser=new DOMParser();
            svg = parser.parseFromString(response.data,"text/xml"); 
            $scope.svgDOM = svg.children[0];

            var width = $scope.svgDOM.getAttribute('width');
            var height = $scope.svgDOM.getAttribute('height');
            if(height) {
                $scope.svgDOM.removeAttribute('width');
                $scope.svgDOM.removeAttribute('height');
                $scope.svgDOM.setAttribute('width', '100%');
                $scope.svgDOM.setAttribute('viewBox', '0 0 '+width+' '+height);
            }

            $scope.svgImage = $sce.trustAsHtml($scope.svgDOM.outerHTML);

            $scope.updateImage();

        }, function errorCallback(response) {
            console.log("Error: Fetching failed.");
        });
        //}}}
        // Guesses Display {{{
        $scope.guesses = [{'state': 'not-guessed'},
            {'state': 'not-guessed'},
            {'state': 'not-guessed'},
            {'state': 'not-guessed'},
            {'state': 'not-guessed'},
            {'state': 'not-guessed'}];

        $scope.currGuess = 0;
        $scope.guess = function(card) {
            correctCard = $scope.allCards.filter(function(c){return c.title == $scope.title;})[0];
            newGuess = {'guessedTitle': card.title};
            if(card.title == correctCard.title) {
                newGuess.state = 'correct';
                newGuess.title = 'correct';
                $scope.congrats_int = $interval( function() {$scope.showCongrats = true;}, 1200);
                $scope.addStat(true)
                $scope.finishedPuzzle = true;
            } else {
                newGuess.state = 'incorrect';
                newGuess.title = 'incorrect';

                if($scope.currGuess == 5) {
                    $scope.congrats_int = $interval( function() {$scope.showCongrats = true;}, 1200);
                    $scope.addStat(false);
                    $scope.finishedPuzzle = true;
                } else {
                    $scope.elements *= 2;
                    $scope.updateImage();
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

            console.log(card, correctCard);

            $scope.guesses[$scope.currGuess] = newGuess;
            $scope.currGuess++;
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
            console.log("Error: Fetching NRDB cards failed.");
        });
        // }}}
        // Fuzzy guesses {{{
        $scope.selectionFuzzy = -1;

        $scope.updateFuzzy = function() {
            tmp = fuzzyByFilter($scope.allCards, "title", $scope.guessInput).concat(fuzzyByFilter($scope.allCards, "stripped_title", $scope.guessInput));
            tmp = makeUniqueByKey(tmp, 'title');
            fullHits = $scope.allCards.filter(function(c){ return c.title.toLowerCase().startsWith($scope.guessInput.toLowerCase()) || c.stripped_title.toLowerCase().startsWith($scope.guessInput.toLowerCase()); });
            tmp = tmp.filter(c => !fullHits.includes(c));
            tmp = fullHits.concat(tmp);
            $scope.possibleCards = tmp;
            $scope.selectionFuzzy = 0;
        };

        $scope.enterGuess = function() {
            if($scope.guessInput && $scope.currGuess < 6) {
                $scope.updateFuzzy();
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
            $scope.selectionFuzzy = i;
            $scope.updateFuzzy();
            $scope.enterGuess();
        }
        // }}}
        // Stats {{{
        $scope.updateStats = function() {
            localStorage.setItem('played', $scope.stats.played);
            localStorage.setItem('wins', $scope.stats.wins);
            if($scope.stats.lastPlayed)
                localStorage.setItem('lastPlayed', $scope.stats.lastPlayed.toISOString());
            else
                localStorage.setItem('lastPlayed', null);
            localStorage.setItem('streak', $scope.stats.streak);
            localStorage.setItem('maxStreak', $scope.stats.maxStreak);
            localStorage.setItem('distribution', $scope.stats.distribution.join('-'));
        };

        $scope.addStat = function(win) {
            $scope.stats.played++;
            today = new Date();
            if(win) {
                $scope.stats.wins++;
                if($scope.stats.lastPlayed == null || Math.floor((today-$scope.stats.lastPlayed) / (1000*60*60*24)) < 2)
                    $scope.stats.streak++;
            } else {
                $scope.stats.streak = 0;
            }
            $scope.stats.lastPlayed = today;
            if($scope.stats.streak > $scope.stats.maxStreak)
                $scope.stats.maxStreak = $scope.stats.streak;
            if(win)
                $scope.stats.distribution[$scope.currGuess]++;
            $scope.updateStats();
        }

        if(localStorage.getItem('played')) {
            $scope.stats = {'played': localStorage.getItem('played'),
                            'wins': localStorage.getItem('wins'),
                            'lastPlayed': localStorage.getItem != null ? new Date(localStorage.getItem('lastPlayed')) : null,
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
            today = new Date();
            text = "gordianbla.de "+today.toDateString()+"\nGuesses: "+$scope.currGuess+"/6";
            for(g of $scope.guesses) {
                if(g.state != 'not-guessed') {
                    text += "\n";
                    if(g.factionCorrect)
                        text += "🟩"
                    else
                        text += "⬜"
                }
            }
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



