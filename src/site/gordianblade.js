angular.module('gordianbla', ['angular.filter'])
    .controller('PuzzleController', ['$scope', '$http', '$sce', 'fuzzyByFilter', function($scope, $http, $sce, fuzzyByFilter) {
        var allCards = [];
        $scope.selectionFuzzy = -1;

        $scope.showTitle = false;
        $scope.showButton = true;

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

        $scope.revealTitle = function() {
            $scope.showTitle = true;
            $scope.showButton = false;
        };

        $scope.guesses = [{'state': 'not-guessed'},
            {'state': 'not-guessed'},
            {'state': 'not-guessed'},
            {'state': 'not-guessed'},
            {'state': 'not-guessed'},
            {'state': 'not-guessed'}];

        $scope.currGuess = 0;
        $scope.guess = function(card) {
            if(card.title == $scope.title) {
                $scope.guesses[$scope.currGuess] = {'state': 'correct'};
            } else {
                $scope.guesses[$scope.currGuess] = {'state': 'incorrect'};
                $scope.elements *= 2;
                $scope.updateImage();
            }
            $scope.currGuess++;
        }

        $sce.trustAsResourceUrl('https://netrunnerdb.com/api/**');
        $http({
            method: 'GET',
            cache: true,
            url: 'https://netrunnerdb.com/api/2.0/public/cards'
        }).then(function successCallback(response) {
            allCards = response.data.data;
            //ToDo: Filter to be unique
        }, function errorCallback(response) {
            console.log("Error: Fetching NRDB cards failed.");
        });

        $scope.updateFuzzy = function() {
            $scope.possibleCards = fuzzyByFilter(allCards, "title", $scope.guessInput);
        };

        $scope.keydownFuzzy = function(e) {
            // console.log(e.keyCode);
            if(e.keyCode == 13) { // ENTER
                $scope.guess($scope.possibleCards[0]);
                $scope.guessInput = "";
                $scope.updateFuzzy();
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
        }

    }]);
