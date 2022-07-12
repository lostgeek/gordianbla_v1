<!doctype html>
<html ng-app="gordianbla">
    <head>
        <title>Gordian Blade</title>
        <meta charset="utf-8"/>
        <meta http-equiv="Cache-Control" content="max-age=300" />
        <script src="angular.min.js"></script>
        <link rel="stylesheet" href="style.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Patua+One&family=Roboto&family=Medula+One&display=swap" rel="stylesheet">
        <script src="angular-filter.min.js"></script>
        <script src="gordianblade.js?v=<?php echo filemtime('gordianblade.js'); ?>"></script>
    </head>
    <body ng-controller="PuzzleController">
        <div class='header'>
            Gordian Blade
            <div class='buttons right'>
                <img class='button' src="img/outline/outline-question-circle.svg" ng-click="infoButton()" />
                <img class='button' src="img/outline/outline-share-1.svg" ng-click="showCongrats=true" />
                <img class='button' src="img/outline/outline-settings.svg" ng-click="settingsButton()" />
            </div>
        </div>
        <div class="content">
            <div class="view puzzleContainer" ng-show="currentView=='puzzle'">
                <div class="image">
                    <div class='imageContainer' ng-show="allCards.length>0 && (!finishedPuzzle || showPuzzle)" ng-bind-html="svgImage"></div>
                    <div class='imageContainer' ng-show="finishedPuzzle && !showPuzzle">
                        <img src="{{getCardURL()}}" />
                    </div>
                    <div class="buttons" ng-show="finishedPuzzle">
                        <input type="button" value="Show puzzle" ng-show="!showPuzzle" ng-click="showPuzzle = true" />
                        <input type="button" value="Show solution" ng-show="showPuzzle" ng-click="showPuzzle = false" />
                        <div class="slider" ng-show="showPuzzle"><input type="range" min="0" max="{{maxElements}}" ng-model="elements" ng-change="updateSVG()" />{{elements}}</div>
                    </div>
                </div>
                <div ng-hide="allCards.length>0">Loading cards from NRDB...</div>
                <div class='guessesOuter'>
                    <div class="guessesDisplay">
                        <div class="guessColumn faction" ng-hide="hardMode">
                            <div class="guessHeader">
                                Faction
                            </div>
                            <div class="guess faction" ng-repeat="n in [0,1,2,3,4,5]" ng-class="{incorrect: !guesses[n].factionCorrect, correct: guesses[n].factionCorrect, notguessed: guesses[n].state=='not-guessed'}">
                                <div class="face front"></div>
                                <div class="face back"></div>
                            </div>
                        </div>
                        <div class="guessColumn type" ng-hide="hardMode">
                            <div class="guessHeader">
                                Type
                            </div>
                            <div class="guess type" ng-repeat="n in [0,1,2,3,4,5]" ng-class="{incorrect: !guesses[n].typeCorrect, correct: guesses[n].typeCorrect, notguessed: guesses[n].state=='not-guessed'}">
                                <div class="face front"></div>
                                <div class="face back"></div>
                            </div>
                        </div>
                        <div class="guessColumn subtype" ng-hide="hardMode">
                            <div class="guessHeader">
                                Subtypes
                            </div>
                            <div class="guess {{guesses[n].partialClass}}" ng-repeat="n in [0,1,2,3,4,5]" ng-class="{notguessed: guesses[n].state=='not-guessed'}">
                                <div class="face front"></div>
                                <div class="face back"></div>
                            </div>
                        </div>
                        <div class="guessColumn cost" ng-hide="hardMode">
                            <div class="guessHeader">
                                (Adv.) Cost
                            </div>
                            <div class="guess cost" ng-repeat="n in [0,1,2,3,4,5]" ng-class="{incorrect: !guesses[n].costCorrect, correct: guesses[n].costCorrect, notguessed: guesses[n].state=='not-guessed'}">
                                <div class="face front"></div>
                                <div class="face back"></div>
                            </div>
                        </div>
                        <div class="guessColumn title">
                            <div class="guessHeader">
                                Card Title
                            </div>
                            <div class="guess title" ng-repeat="n in [0,1,2,3,4,5]" ng-class="{incorrect: guesses[n].state=='incorrect', correct: guesses[n].state=='correct', notguessed: guesses[n].state=='not-guessed'}">
                                <div class="face front"></div>
                                <div class="face back">{{guesses[n].guessedTitle}}</div>
                            </div>
                        </div>
                    </div>
                    <div class='guessContainer' ng-show="currentView=='puzzle' && !finishedPuzzle">
                        <div class="suggestions" id="suggestions">
                            <div class="suggestion" ng-show="guessInput" ng-repeat="card in possibleCards" ng-class="{selected: $index==selectionFuzzy}" ng-click="selectFuzzy($index)">{{card.title}}</div>
                        </div>
                        <input type='text' size='40' placeholder="Enter card name here!" ng-model='guessInput' ng-change="updateFuzzy()" ng-keydown="keydownFuzzy($event)" autofocus />
                    </div>
                </div>
            </div>
            <div class="view stats" ng-show="currentView=='stats'">
                STATS
            </div>
            <div class="view congrats" ng-show="showCongrats">
                <div class="innerView">
                    <div class="close">
                        <img class='button' src="img/outline/outline-cross.svg" ng-click="showCongrats=false" />
                    </div>
                    <h1>Statistics</h1>
                    <div class="statistics">
                        <div class="stat">
                            <div class="number">{{stats.played}}</div>
                            <div class="label">Played</div>
                        </div>
                        <div class="stat">
                            <div class="number">{{stats.wins/stats.played*100 | number:0}}</div>
                            <div class="label">Win %</div>
                        </div>
                        <div class="stat">
                            <div class="number">{{stats.streak}}</div>
                            <div class="label">Current streak</div>
                        </div>
                        <div class="stat">
                            <div class="number">{{stats.maxStreak}}</div>
                            <div class="label">Max streak</div>
                        </div>
                    </div>
                    <div class="distribution">
                        <div class="bar" ng-repeat="occurance in stats.distribution track by $index" style="width: {{occurance/max(stats.distribution)*100 | number: 2}}%" ng-class="{empty: occurance == 0}">
                            <span class="index">
                                {{$index+1}}
                            </span>
                            <span class="occurance">
                                {{occurance}}
                            </span>
                        </div>
                    </div>
                    <div class="bottom" ng-show="finishedPuzzle">
                        <div class="next">
                            Next puzzle
                            <div class="time">{{nextPuzzle}}</div>
                        </div>
                        <div class="buttons">
                            <div class="practice" ng-click="showCongrats = false; practiceMode = true; finishedPuzzle = false; elements = 0; showPuzzle = true; getNewPuzzle();">Continue practicing</div>
                            <div class="share" ng-click="copyShare()" ng-hide="practiceMode">
                                Share <img class="inline-icon" src="img/outline/outline-share-1.svg" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="view settings" ng-show="currentView=='settings'">
                <ul>
                    <li><input id="hardMode" type="checkbox" ng-model="hardMode" ng-change="updateHardMode()"/><label for="hardMode">Hard mode<div class="explanation">Hides all information besides the card image</div></label></li>
                    <li><input id="lightMode" type="checkbox" ng-model="lightMode" ng-change="updateLightMode()"/><label for="lightMode">Light mode<div class="explanation">For when you need a flashlight shining on your face</div></label></li>
                </ul>
            </div>
            <div class="view infoview" ng-show="currentView=='info'" ng-click="infoButton()">
                <h1>Rules</h1>
                <p>Guess the correct card in six guesses or fewer!</p>
                <p>Each guess must be a valid card title out of the entire card pool of cards printed by both FFG and NISEI. This includes the Terminal Directive campaign cards!</p>
                <p>The picture on the right approximates the actual card art using a number of shapes. That number will be increased with each guess, making it more and more resemble the original card.</p>
                <h1>About</h1>
                <p>This site was created by lostgeek.</p>
                <p>Find the code over on <a href="https://github.com/lostgeek/gordianbla" target="_blank">github</a>.</p>
                <p>Image creation done using the <a href="https://github.com/fogleman/primitive" target="_blank">primitive</a> library by fogleman.</p>
                <p>Icons by <a href="https://dribbble.com/shots/15126704-Freebie-SWM-Icon-Pack" target="_blank">Daniel Wodziczka</a>.</p>
                <p>The information presented on this site about Android: Netrunner, both literal and graphical, is copyrighted by Fantasy Flight Games and/or Wizards of the Coast or Project NISEI.
                This website is not produced, endorsed, supported, or affiliated with Fantasy Flight Games and/or Wizards of the Coast.</p>
            </div>
            <div class="toast {{toastType}}" ng-show="toast">
                <img ng-show="toastType=='error'" class="inline-icon" src="img/outline/outline-warning-round.svg" />
                <img ng-show="toastType=='info'" class="inline-icon" src="img/outline/outline-info-round.svg" />
                <img ng-show="toastType=='message'" class="inline-icon" src="img/outline/outline-message-square-dots.svg" />
                <div class="message">{{toast}}</div>
            </div>
            <div class="dialog {{dialogType}}" ng-show="dialog">
                <img ng-show="dialogType=='error'" class="inline-icon" src="img/outline/outline-warning-round.svg" />
                <img ng-show="dialogType=='info'" class="inline-icon" src="img/outline/outline-info-round.svg" />
                <img ng-show="dialogType=='message'" class="inline-icon" src="img/outline/outline-message-square-dots.svg" />
                <div class="message">{{dialog}}</div>
                <div class="buttons">
                    <div class="button" ng-repeat="button in dialogButtons" ng-click="clearDialog();dialogCallBack(button)">{{button}}</div>
                </div>
            </div>
        </div>
    </body>
</html>

