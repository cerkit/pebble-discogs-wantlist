/**
 * Discogs album want list browser
 */

var UI = require('ui');
var USER_AGENT = 'Want List browser for Pebble Smartwatch/ +http://cerkit.com/pebble-want-list-app/;1.1';
var options = {username : 'wants' };
var OPTIONS_SETTING_KEY = 0;

function showConfiguration(){
  console.log("showing configuration");
  Pebble.openURL('http://wantlist.azurewebsites.net/pebbleconfig?options='+encodeURIComponent(JSON.stringify(options)));
  //Pebble.openURL('http://wantlist.azurewebsites.net/config/?options='+encodeURIComponent(JSON.stringify(options)));
}

Pebble.addEventListener("showConfiguration", function() {
  showConfiguration();
});

Pebble.addEventListener("webviewclosed", function(e) {
  console.log("configuration closed");
  // webview closed
  //Using primitive JSON validity and non-empty check
  console.log('response: ' + e.response);
  if (e.response.charAt(0) == "{" && e.response.slice(-1) == "}" && e.response.length > 5) {
    options = JSON.parse(decodeURIComponent(e.response));
    // Write a key with associated value
    localStorage.setItem(OPTIONS_SETTING_KEY, JSON.stringify(options));
    
    console.log("Options = " + JSON.stringify(options));
  } else {
    console.log("Cancelled");
  }
});

var optionString = localStorage.getItem(OPTIONS_SETTING_KEY);
if(optionString === null || optionString === ''){
  console.log('Using default username');
}
else
{
  options = JSON.parse(optionString);
  console.log('Set username: ' + options.username);
}

var main = new UI.Card({
  title: 'Music Wantlist',
  icon: 'images/menu_icon.png',
  subtitle: '',
  body: 'Press any button.'
});

var showAlbumInfo = function(title, artist, body){
  var c = new UI.Card({
    title: title,
    icon: '',
    subtitle: '',
    body: artist + '\r\n' + body,
    style : 'small',
    scrollable: true
  });
  
  c.show();
};

function showReleaseInfo(data){
  console.log('showReleaseInfo');
  var artistsString = 'By: ';
  for (var i = 0; i < data.artists.length; i++) {
    artistsString += data.artists[i].name + data.artists[i].join;
  }
  
  console.log('artistsString: ' + artistsString);
  
  var trackList = 'Tracks: ';
  
  for(var j = 0; j < data.tracklist.length; j++){
    var track = data.tracklist[j];
    if(track.type_ == 'track'){
      trackList += track.position + '-' + track.title;
      if(track.duration){ 
        trackList += ' (' + track.duration + ')';
      }
      trackList += '\r\n';
    }
  }
  
  console.log('trackList: ' + trackList);
  
  var genres = 'Genres: ';
  for(var k = 0; k < data.genres.length; k++){
    genres += data.genres[k] + ', ';
  }
  
  // remove the trailing comma
  genres = genres.substring(0,genres.length - 2);
  
  console.log('Genres: ' + genres);
  
  var bodyText = genres + '\r\nLabel: ' + data.labels[0].name + '\r\nCat#:' + data.labels[0].catno +
  '\r\nYear: ' + data.released + '\r\nCountry: ' + data.country + 
  '\r\n' + trackList;
  
  console.log('bodyText: ' + bodyText);
       
  showAlbumInfo(data.title, artistsString, bodyText);
        
}

function createWantListMenu(data){
  if(data.wants.length > 0){
  
    var menuItems = [];
    
    for(var i = 0; i < data.wants.length; i++){
      menuItems[i] = {
        title: data.wants[i].basic_information.title,
        subtitle: data.wants[i].basic_information.artists[0].name
      };    
    }
    
    var menu = new UI.Menu({
      sections: [{
        items:  menuItems
      }]
    });
    menu.on('select', function(e) {
      var basicInfo = data.wants[e.itemIndex].basic_information;
      var albumInfoUrl = basicInfo.resource_url;
      console.log('albumInfoUrl: ' + albumInfoUrl);
      var req = new XMLHttpRequest();
       
      req.open('GET', albumInfoUrl, true);
      req.setRequestHeader('User-Agent', USER_AGENT);
      req.onload = function(e) {
        console.log('request onload');
        if (req.readyState == 4) {
          if(req.status == 200) {
            console.log('Album info response' + req.responseText);
    
            var releaseData = JSON.parse(req.responseText);
            showReleaseInfo(releaseData);
            
          } else {
            console.log('Error getting data');
          }
        }
      };
      
      req.send(null);
      
      console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
      console.log('The item is titled "' + e.item.title + '"');
    });
    menu.show();
  } else {
    var noItemsCard = new UI.Card({
      title: "No items",
      subtitle: '',
      icon: '',
      body: 'There are no items in this want list.'
    });
    
    noItemsCard.show();
  }
}

function getList(){
  var req = new XMLHttpRequest();
   
  req.open('GET', 'https://api.discogs.com/users/' + options.username + '/wants', true);
  req.setRequestHeader('User-Agent', USER_AGENT);
  req.onload = function(e) {
    if (req.readyState == 4) {
      if(req.status == 200) {
        console.log(req.responseText);

        var data = JSON.parse(req.responseText);
        createWantListMenu(data);
        
      } else {
        console.log('Error getting data');
      }
    }
  };
  
  req.send(null);
}

main.show();

main.on('click', 'up', function(e) {
  getList();
});

main.on('click', 'select', function(e) {
  getList();
});

main.on('click', 'down', function(e) {
  getList();
});
