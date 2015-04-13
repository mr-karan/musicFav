angular.module('MyApp')
  .controller('MainCtrl', function($scope, Show) {
    $scope.alphabet = ['0-9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
      'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
      'Y', 'Z'];
    $scope.genres = ['acoustic',
'ambient',
'blues',
'classical',
'country',
'electronic',
'emo',
'folk',
'hardcore',
'hip hop',
'indie',
'jazz',
'latin',
'metal',
'pop',
'pop punk',
'punk',
'reggae',
'rnb',
'rock',
'soul',
'world',
'60s',
'70s',
'80s',
'90s'];
    $scope.headingTitle = 'Top 12 Songs';
    $scope.shows = Show.query();
    $scope.filterByGenre = function(genre) {
      $scope.shows = Show.query({ genre: genre });
      $scope.headingTitle = genre;
    };
    $scope.filterByAlphabet = function(char) {
      $scope.shows = Show.query({ alphabet: char });
      $scope.headingTitle = char;
    };
  });