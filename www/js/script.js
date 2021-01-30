
/**
 * Only calls a stated function after a set time has passed of not being called
 * again.
 * 
 * @param {string} func The name of the function to call.
 * @param {int} wait The time to wait in ms.
 * @param {type} immediate If passed, trigger the function on the leading edge,
 * instead of the trailing.
 * @returns {Function} Debounced function call.
 */
function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            func.apply(context, args);
        }
    };
};

function processSongs(songs) {
    var addedByUser = [],
        songCount = [],
        previousUser,
        userSongList = [];

    //sort but not the unicode default because that does upper case before lower case
    //this sorts all songs by who added them
    songs.sort(function (first, second) {
        return first.toLowerCase().localeCompare(second.toLowerCase());
    });

    for (var i = 0; i < songs.length; i++) {
        //input is like "Added by Name:Song Name", will break if names have :s but, really,
        var addedBy = songs[i].split(/:(.+)/)[0]; //before the first :
        var songName = songs[i].split(/:(.+)/)[1]; //after the first :
        if (addedBy !== previousUser) //new added by person
        {
            addedByUser.push(addedBy); //push the added by string to a
            songCount.push(1); //push 1 to b as the number of songs added by that person, 1 as of now
        }
        else //same added by person as before
        {
            songCount[songCount.length - 1]++; //increment their song count
        }
        userSongList.push([(addedByUser.length - 1), songName]); //add song to user's song list, first var being the index that matches with their addedByUser value
        previousUser = addedBy; //update previous added by
    }
    return [addedByUser, songCount, userSongList]; //BLESS THIS MESS
}

function getPlaylistSongsNonLive() {
    //STATIC, non live nodelist because I'm just using it to read playlist song names basically
    var songs = document.querySelectorAll("#queue > .queue_entry:not(.ui-sortable-placeholder)"); //nonlive nodelist, can edit if needed
    return songs;
}

function getPlaylistSongsLive() {
    //LIVE, live nodelist
    var playlist = document.getElementById("queue");
    var songs = playlist.childNodes;
    return songs;
}

function getViewableLibrarySongs() {
    //LIVE, live nodelist because I'm using it for changing BG colours in highlightNonPlaylistSongs()
    var library = document.getElementById("library");
    var songs = library.childNodes;
    return songs;
}

//makes all songs in the library get a shiny new background colour if their video name string doesn't appear in the playlist
function highlightNonPlaylistSongs() {
    var playlist = getPlaylistSongsNonLive();
    var library = getViewableLibrarySongs();
    var playlistSongs = [];

    //populate the array with all playlist video name strings
    for (var i = 0; i < playlist.length; i++) {
        playlistSongs.push(playlist[i].querySelectorAll("a")[0].innerHTML);
    }

    //iterate over each library video and if the name matches a playlist video name, change its background
    for (var i = 0; i < library.length; i++) {
        var isInPlaylist = false;

        for (var j = 0; j < playlistSongs.length; j++) {
            if (playlistSongs[j] === library[i].querySelectorAll("a")[0].innerHTML) {
                isInPlaylist = true;
                break;
            }
        }

        if (!isInPlaylist) {
            library[i].style.backgroundColor = "#616"; //hail secret satan
        }
        else {
            //removes the backgroundColor if it is in the playlist
            library[i].style = null;
        }
    }
}

//metric owns
function powerHour(searchString) {
    var songs = getPlaylistSongsLive();
    var matchingSongs = [];

    for (var i = 0; i < songs.length; i++) {
        if (songs[i].getElementsByTagName("a")[0].innerHTML.toLowerCase().includes(searchString.toLowerCase())) {
            matchingSongs.push(songs[i].className);
        }
    }

    //SHUFFLE THEM, new order every time~
    var j = 0;
    var temp = null;
    for (var i = matchingSongs.length - 1; i > 0; i -= 1) {
        j = Math.floor(Math.random() * (i + 1));
        temp = matchingSongs[i];
        matchingSongs[i] = matchingSongs[j];
        matchingSongs[j] = temp;
    }

    //simulate a click on the queue next button for all matching songs
    for (var i = 0; i < matchingSongs.length; i++) {
        document.getElementsByClassName(matchingSongs[i])[0].getElementsByTagName("div")[1].childNodes[1].click();
    }
}

//do the added counter thing
function doTheThings() {
    var fullDrawNeeded = true;

    var songs = getPlaylistSongsNonLive();
    var addeds = [];
    //get all added by strings
    for (var i = 0; i < songs.length; i++) {
        addeds[i] = songs[i].title;
        //change "Added by: Name" to "Added by Name:"
        addeds[i] = (addeds[i].replace(":", "")) + ":";
        //append song title to this, will look like "Added by Name:Song Name", : delimiter
        addeds[i] += songs[i].querySelectorAll("a")[0].innerHTML;
    }

    var counts = processSongs(addeds);

    if ($(".toggles").size()
        && counts[0].length === $(".toggles").size()) {
        fullDrawNeeded = false;
    }

    if (fullDrawNeeded) {
        //print title and all song count
        document.getElementById("playlistmanagerwrap").innerHTML = "<h3>Meow-list 2.2 🎵</h3><span>Songs: <span id=\"totalSongs\"></span></span>";
    }
    document.getElementById("totalSongs").innerHTML = songs.length;

    //add new line with added by, the value and % to 2dp
    for (var i = 0; i < counts[0].length; i++) {
        var usersongs = [];
        for (var j = 0; j < counts[2].length; j++) {
            if (i == counts[2][j][0]) {
                usersongs.push(counts[2][j][1]);
            }
        }
        if (fullDrawNeeded) {
            document.getElementById("playlistmanagerwrap").innerHTML += "<span class=\"toggles\"><a id=\"toggleUser" + i + "\"></a></span>";
        }
        document.getElementById(("toggleUser" + i)).innerHTML = counts[0][i] + ": " + counts[1][i] + " (" + (Math.round((counts[1][i] / songs.length) * 10000) / 100) + "%)";

        var songspans = "<p>";
        for (var j = 0; j < usersongs.length; j++) {
            songspans += "<span>" + usersongs[j] + "<br></span>";
        }
        songspans += "</p>";
        if (fullDrawNeeded) {
            document.getElementById("playlistmanagerwrap").innerHTML += "<div class=\"usersongs\" id=\"songsUser" + i + "\"></div>";
        }
        document.getElementById(("songsUser" + i)).innerHTML = songspans;
    }

    if (fullDrawNeeded) {
        var songusercount = document.getElementsByClassName("usersongs");
        for (var i = 0; i < songusercount.length; i++) {
            var clickname = "#toggleUser" + i;
            $(clickname).click(function () {
                var thisid = ($(this).attr('id'));
                var j = thisid.slice(10); //grab numbers after toggleUser
                var containername = "#songsUser" + j;
                var container = $(containername);
                container.toggleClass("active");
            });
        }
    }
}

//call big func once now, then once every so many seconds
function run() {
    var secondsBeforeSecondRun = 1;
    doTheThings();
    setTimeout(doTheThings, secondsBeforeSecondRun * 1000);

    var debounceIntervalSecondsForSongCounters = 2;
    var playlist = document.getElementById("queue");

    //create an observer instance
    var observer = new MutationObserver(debounce(function () {
        doTheThings();
    }, debounceIntervalSecondsForSongCounters * 1000));

    //configuration of the observer
    var config = { attributes: true, childList: true, characterData: true };

    //pass in the target node, as well as the observer options
    observer.observe(playlist, config);
}

//after 1s on page, do the above, DOMContentLoaded doesn't work here for some reason
setTimeout(run, 1000);
//document.addEventListener("DOMContentLoaded", run);

//who is it??
var itsme = false;
var welcome = document.getElementById("welcome");
if (welcome) {
    if (welcome.innerHTML.endsWith(" w0rk") || welcome.innerHTML.endsWith(" Zero")) {
        var itsme = true;
    }
}

//THIS IS THE SECTION THAT ADDS BUTTONS
//add custom Zero/w0rk position window button
if (!$("#g0g0g0").length && itsme) {
    $("#videocontrols").prepend("<button class=\"btn btn-sm btn-default\" id=\"g0g0g0\" title=\"Go To The Place 👀\"><span class=\"glyphicon glyphicon-home\"></span></button>");
}

//add button that queues all the Good music
if (!$("#powerhour").length) {
    $("#videocontrols").prepend("<button class=\"btn btn-sm btn-default\" id=\"powerhour\" title=\"BEGIN THE POWER HOUR (OR MORE) 👀\"><span class=\"glyphicon glyphicon-time\"></span></button>");
}
//I'm not fixing the eye button duplicating loads because it's excellent actually
$("#videocontrols").prepend("<button class=\"btn btn-sm btn-default\" id=\"scrolltocurrent\" title=\"Jump to Now Playing 👀\"><span class=\"glyphicon glyphicon-eye-open\"></span></button>");
if (!$("#highlightlibrary").length) {
    $("#searchcontrol div:nth-child(2)").append("<span class=\"input-group-btn\"><button class=\"btn btn-default\" id=\"highlightlibrary\" title=\"Highlight songs not in the playlist 👀\"><span class=\"glyphicon glyphicons-drop\"></span></button></span>");
}

// add video tags
if (!$("#videotitletags").length) {
    $("#addfromurl").append("<input class=\"form-control\" id=\"videotitletags\" type=\"text\" placeholder=\"Add search tags here (space separated)\">");
}

//when clicked, jumps to top of video section, able to see vid and 1-2 queued songs
$("#g0g0g0").click(function () {
    $("body, html").animate({ scrollTop: $("#videowrap").position().top - $($(".navbar-header")[0]).height() - 2 });
    $("#scrolltocurrent").click()
});

//when button is clicked, jump to Now Playing in playlist
$("#scrolltocurrent").click(function () {
    var container = $('#queue'),
        scrollTo = $('.queue_active');

    container.animate({ scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop() });
});

//when clicked, highlight non playlist songs in library
$("#highlightlibrary").click(function () {
    highlightNonPlaylistSongs();
});

//when clicked, prompt for text input for songs to find
$("#powerhour").click(function () {
    var iwannahear = prompt("Queue the musics that have a.....", "");
    if (iwannahear != null && iwannahear != "") {
        powerHour(iwannahear);
    }
});

//destroy the clear playlist button to stop meeks blowing everything up again
//ATTN @ YOU: COMMENT OUT THE FOLLOWING TWO LINES IF YOU WANT THE CLEAR PLAYLIST BUTTON BACK
var clearbtn = document.getElementById("clearplaylist");
clearbtn.parentNode.removeChild(clearbtn);
//I know it could have just been hidden in CSS but if meeks is going to delete the playlist, I'm going to delete the delete playlist button,

function queueFromId(idString) {
    var songs = getPlaylistSongsLive();
    var matchingSongs = [];

    for (var i = 0; i < songs.length; i++) {
        if (songs[i].getElementsByTagName("a")[0].getAttribute("href").includes(idString)) {
            matchingSongs.push(songs[i].className);
        }
    }

    //simulate a click on the queue next button for all matching songs
    for (var i = 0; i < matchingSongs.length; i++) {
        document.getElementsByClassName(matchingSongs[i])[0].getElementsByTagName("div")[1].childNodes[1].click();
    }
}

var searchParams = new URLSearchParams(window.location.search.substr(1));
var nowQueueing = searchParams.get("queue");

if (nowQueueing !== null) {
    setTimeout(queueFromId, 10000, nowQueueing);
}