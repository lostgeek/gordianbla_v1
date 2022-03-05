angular.module('gordianbla', ['angular.filter'])
    .controller('PuzzleController', ['$scope', '$http', '$sce', 'fuzzyByFilter', '$interval', function($scope, $http, $sce, fuzzyByFilter, $interval) {
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
                $scope.selection_int = $interval( function() {$scope.showCongrats = true;}, 1200);
            } else {
                newGuess.state = 'incorrect';
                newGuess.title = 'incorrect';

                $scope.elements *= 2;
                $scope.updateImage();
            }

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
            if(card.cost)
                correctCost = correctCard.cost;
            else if(card.advancement_cost)
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
            console.log(tmp.map(function(c){return c.title;}).join(", "));
        };

        $scope.enterGuess = function() {
            if($scope.guessInput) {
                $scope.updateFuzzy();
                if($scope.guessInput == $scope.possibleCards[0].title) {
                    $scope.guess($scope.possibleCards[0]);
                    $scope.guessInput = "";
                    $scope.updateFuzzy();
                } else {
                    $scope.guessInput = $scope.possibleCards[0].title;
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



