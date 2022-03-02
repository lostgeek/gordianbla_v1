angular.module('gordianbla', [])
    .controller('PuzzleController', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
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
        $scope.revealGuess = function() {
            $scope.guesses[$scope.currGuess] = {'state': 'incorrect'};
            $scope.currGuess++;
        }



    }]);
