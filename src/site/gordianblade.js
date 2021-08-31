var cards = [];
$.getJSON("https://netrunnerdb.com/api/2.0/public/cards", function(data) {
    cards = data.data;
});
