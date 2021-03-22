/* This page is currently being injected into *all* web pages */

/* comands you can run to test that the content script is running:
console.log("COMINGGGGGGGGGGGGGGGG");
// https://stackoverflow.com/questions/40874759/chrome-get-url-of-active-content-script-tab
alert(location.href);
*/


var lineQueue = new Array();
const QUEUE_LENGTH = 10;
const MIN_PERCENT_READ = 15;
let startTime = 0;
let focusedTimeInSeconds = 0;

// POST request to our api to extract content
// has to be done via background script (src/bg/background.js)
var targetSiteURL = location.href
let viewMode = 1;
var initialHighlightingDone = false;    

console.log("right before adding listeners");

// Sending an empty message to background.js so that background.js has the tab id
chrome.runtime.sendMessage(
    {contentScriptQuery: "sendTabId", data: null},
    result => {
        console.log("Making sure background.js has my tab Id!");
        console.log(result);
    });

// Listener for when user changes the view mode
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.switchMode) {
        console.log("received message! finally!");
        console.log("The response is: " + request.switchMode);
        if (viewMode != request.switchMode) {
            viewMode = request.switchMode;
            console.log("viewMode now is: " + viewMode);
            initialHighlightingDone = false;
        }
    }
    
});

chrome.runtime.sendMessage(
    {contentScriptQuery: "extractURLContent", data: targetSiteURL},
    result => {
        const titleHTML = `<h1 class="title">${result.title}</h1>`;
        const subHeadHTML = ``;

        /**************************************************************
         * 
         *                  REPLACE PAGE CONTENT
         * 
         **************************************************************/

        var contentHTML = "";               // the string we'll be filling with spans
        var rawContentStr = result.content; // string we're iterating through char by char
        var spanNum = 0;                    // line number
        var currLineSpans = [];             // quadrant spans for current line
        var numCharsInQuad = 0;             // number of characters in quadContent currently
        var QUAD_SIZE = 23;                 // max number of chars in a quadrant span
        var quadContent = "";               // contents of current quadrant span
        var quadNum = 0;                    // which quadrant we're on
        var MAX_QUAD_NUM = 4;               // max number of quadrants in a line

        var currentWord = "";               // the current word that we are looking at
        // iterate through every character in received content string
        for (var i = 0; i < rawContentStr.length; i++) {
            var ch = rawContentStr.charAt(i);

            // console.log(quadContent);
            // ALT CASE - seen a newline, hence new paragraph
            // double check since we get \n chars back to back
            if ((ch == "\n") && (quadContent != "")) {
                // add leftover content - generate quadrant and line spans
                // 1 - generate quadrant span from leftover chars, add this to the array of spans
                var quadSpan = `<span class="quad" id="${quadNum}${spanNum}">${quadContent}</span>`;
                currLineSpans.push(quadSpan);
                // 2 - generate container line span, add to overall contentHTML string
                contentHTML += `<span class="line" id="${spanNum}">${currLineSpans.join('')}</span>`;
                contentHTML += "<br>";
                // 3 = edge case where there is only one word on the next line that has not been accounted for yet
                if (currentWord != "") {
                    quadNum = 0;
                    spanNum++;
                    currLineSpans = [];
                    quadSpan = `<span class="quad" id="${quadNum}${spanNum}">${currentWord}</span>`;
                    currLineSpans.push(quadSpan);
                    contentHTML += `<span class="line" id="${spanNum}">${currLineSpans.join('')}</span>`;
                    // contentHTML += "<br><br>";
                    currentWord = "";
                } 

                // then insert line break
                contentHTML += "<br><br>";

                // now reinitialize everything
                numCharsInQuad = 0;
                quadNum = 0;
                spanNum++;
                quadContent = "";
                currLineSpans = [];
            } 

            // MAIN CASE - usual case, more common
            else if (ch != "\n") {                // usual case

                // GENERATE QUADRANT SPAN
                // Current quad reached max size, so generate
                // span for it and add to array of spans for curr line

                if (quadNum == MAX_QUAD_NUM - 1) {  // if this is the fourth quadrant in the line. we don't want to break up a word
                    if (ch != " ") {
                        currentWord += ch;          // add each character to the current word   
				    }

                    else if (currentWord.length + numCharsInQuad + 1 < QUAD_SIZE) {     // if the current quad size with the addition of the word is still less than the max quad size, add the word.
                        quadContent = quadContent.concat(currentWord);                  // add the word to the contents of the current quad
                        quadContent += ch;                                              // add the space
                        numCharsInQuad += currentWord.length + 1;
                        currentWord = "";                                               // reset the word
				    }
                    else {
                        var quadSpan = `<span class="quad" id="${quadNum}${spanNum}">${quadContent}</span>`;
                        currLineSpans.push(quadSpan);
                        // set back to initial vals
                        quadContent = currentWord + " ";
                        numCharsInQuad = currentWord.length + 1;
                        quadNum++;
                        currentWord = "";
					}
				}
                else {  // if this is the 1st to 3rd quadrants, we don't care about the breaking up of words
                    quadContent += ch;                  // add latest ch to content of curr quad
                    numCharsInQuad++;                   // reflect change in num chars var

                    if (numCharsInQuad >= QUAD_SIZE) {
                        var quadSpan = `<span class="quad" id="${quadNum}${spanNum}">${quadContent}</span>`;
                        currLineSpans.push(quadSpan);
                        // set back to initial vals
                        quadContent = "";
                        numCharsInQuad = 0;
                        quadNum++;
                    }
                }

                // GENERATE CONTAINER LINE SPAN
                // Required number of quads for curr line have been
                // generated. Put strings representing each individual
                // quadrant span into a container span representing
                // the current line. Add this span to contentHTML

           
                if (quadNum == MAX_QUAD_NUM) {         // reached end of line (ie add span)
                    contentHTML += `<span class="line" id="${spanNum}">${currLineSpans.join('')}</span>`;
                    contentHTML += "<br>";
                    // set back to initial vals
                    spanNum++;
                    quadNum = 0;
                    currLineSpans = []
                }
            }

        }
        // for any leftover content
        if (quadContent != "") {
            contentHTML += `<span class="line" id="${spanNum}">${currLineSpans.join('')}</span>`;
        }
        // surround spans with a container div
        contentHTML = `<div class="content">${contentHTML}</div>`

        var imgHTML = `<img src="${result.img_src}" alt="N/A">`;

        const articleHTML = `<div class="article">${titleHTML}${imgHTML}${subHeadHTML}${contentHTML}</div>`;      // wrap everything

        const newPage = `<head>
                            <title>Eye Tracking Research</title>
                            <link rel="stylesheet" type="text/css" href="./newPage.css">
                        </head>
                        <body>
                            ${articleHTML}
                        </body>`

        $("html").html(newPage);

        // GETTING CURRENT USER


        console.log(chrome.runtime);
        // chrome.runtime.getBackgroundPage((bgPage) => {
        //     console.log(bgPage);
        //     user = bgPage.getUser();
        // });

        // test user data
        // userData = {
        //     user: 'user2',
        //     url: targetSiteURL
        // };

        chrome.runtime.sendMessage(
            {contentScriptQuery: "getUser", data: null},
            result => {
                console.log(result);
                var userData = {
                    user: result,
                    url: targetSiteURL
                };
        
                console.log("before getData");
                getData(userData, spanNum);   
            }); 
        // getData(userData, spanNum);

        /**************************************************************
         * 
         *              MOUSE-BASED HIGHLIGHTING
         * 
         **************************************************************/
        /*
        document.onmousemove = function(e){
            // mouse coordinates
            var x = e.pageX;
            var y = e.pageY;

            // correct y coordinate for scrolling
            y -= $(window).scrollTop();

            // highlight the relevant line (unhighlighting everything else)
            var elems = $("span");
            Array.from(elems).forEach(function (el) {
                $(el).css("background-color", "white");
            });
            el = document.elementFromPoint(x, y)
            if (el.nodeName.toLowerCase() == "span") {
                $(el).css("background-color", "yellow");
            }
        }
        */
    });

/**
 * 
 * @param {*} quadFreqsList 
 */
function getData(userData, spanNum) {

    var preloadData;

    // Testing getting data
    chrome.runtime.sendMessage(
        {contentScriptQuery: "getFromDatabase", data: userData},
        result => {
            console.log("sent ajax getFromDatabase call");
            console.log(result);
            preloadData = result;

            var quadFreqs = []; // the current sessions' quadFreqs that we will be updating as the user reads
            var tempQuadFreqs = [];
            var dbQuadFreqs = []; // the db's quadFreqs that we will initialize our session with
            // console.log("Current spanNum: ");
            // console.log(spanNum);
            for(var i = 0; i <= spanNum; i++) {
                quadFreqs.push([0, 0, 0, 0]);
                dbQuadFreqs.push([0, 0, 0, 0]);
                tempQuadFreqs[i] = [];
            }

            // Preloading in user's quadfreqs data
            if (preloadData != null) {
                console.log("inside preloadData");
                console.log(preloadData);
                preloadData.forEach(function (item, index) {
                    for (var i = 0; i < item.quadFreqs.length; i++) {
                        tempQuadFreqs[i].push(item.quadFreqs[i]);     
                    } 
                });

                tempQuadFreqs.forEach(function (quadFreqsList, index) {
                    dbQuadFreqs[index] = getAverageArray(quadFreqsList);
                });
            }

            // Initialize the pageSession object
            console.log("creating pageSessionData");
            console.log(userData);
            var pageSessionData = {
                url: targetSiteURL,
                title: document.getElementsByClassName("title")[0].innerHTML,
                user: userData.user,
                timestampStart: Date.now(),
                timestampEnd: null,
                sessionClosed: false,
                quadFreqs: null
            };

            //////////////////////////////////

            runWebSocket(quadFreqs, dbQuadFreqs);

        // BEFORE UNLOAD NOT WORKING
        // window.addEventListener("beforeunload", function(event) {

        //     console.log("before unload");
        //     pageSessionData.timestampEnd = Date.now();
        //     pageSessionData.quadFreqs = quadFreqs;
        //     pageSessionData.sessionClosed = true;
        //     console.log(pageSessionData);

        //     // event.preventDefault();
        //     event.returnValue = "Are you sure?";
        //     // return null;
        // });

        window.addEventListener("unload", function(event) {
            // Send message to background.js to save the pageSessionData to the database

            // Provide distraction metric
            const millis = Date.now() - startTime;
            const totalTime =  Math.floor(millis / 1000);

            pageSessionData.timestampEnd = Date.now();
            pageSessionData.quadFreqs = quadFreqs;
            pageSessionData.sessionClosed = true;
            console.log(pageSessionData);
            chrome.runtime.sendMessage(
                {contentScriptQuery: "showDistractionMetric", data: {totalTime, focusedTimeInSeconds}},
                result => {
                    console.log("showed distraction metric");
                });
            chrome.runtime.sendMessage(
                {contentScriptQuery: "saveToDatabase", data: pageSessionData},
                result => {
                    console.log("sent ajax call");
                    console.log(result);
            });
        });
    });
}

/**************************************************************
* 
*                      WEBSOCKET
* 
**************************************************************/

function runWebSocket(quadFreqs, dbQuadFreqs) {
    // for raw coordinates:
    var data = [];    // array of [line_num, timestamp] objects
    startTime = Date.now();

    if ("WebSocket" in window) {
        //alert("WebSocket is supported by your Browser!");
        
        // Let us open a web socket
        var ws = new WebSocket("ws://localhost:8765/hello");

        ws.onopen = function() {
            // Web Socket is connected, send data using send()
            ws.send("Socket Opened");
            //alert("Message is sent...");
        };

        ws.onmessage = function (evt) { 
            var received_msg = evt.data;
            // console.log(received_msg);          // uncomment to log all coordinates // HERE
            var tokens = received_msg.split('|');
            if (tokens[0] === 'during') {

                ///////////////////////////////////////////////////////////
                // GET AND TRANSFER GAZE COORDINATES
                ///////////////////////////////////////////////////////////

                // get normalized gaze position
                // NOTE: devicePixelRatio
                var tobii_x = parseInt(tokens[1]);
                var tobii_y = parseInt(tokens[2]);
                var x = tobii_x + window.screenLeft + (window.devicePixelRatio * (window.outerWidth - window.innerWidth));
                var y = tobii_y + window.screenTop - (window.devicePixelRatio * (window.outerHeight - window.innerHeight));



                ///////////////////////////////////////////////////////////
                // HIGHLIGHTING MECHANISM: line + quadrant based
                ///////////////////////////////////////////////////////////

                // https://www.w3schools.com/cssref/css_colors.asp
                // https://www.w3schools.com/colors/colors_picker.asp?colorhex=F0F8FF
                // var colorLvls = ['DarkRed', 'Red', 'DarkGreen', 'GreenYellow'];
                // [White, Light Blue, Light Orange, Light Violet]
                
                // console.log("inside websocket");
                
                switch(viewMode) {
                    case 1:
                        highlightMode1(ws, quadFreqs, dbQuadFreqs, x, y);
                        break;
                    case 2:
                        highlightMode2(ws, quadFreqs, dbQuadFreqs, x, y);
                        break;
                    case 3:
                        highlightMode3(ws, quadFreqs, dbQuadFreqs, x, y);
                        break;
                    case 4:
                        highlightMode4(ws, quadFreqs, dbQuadFreqs, x, y);
                        break;
                    case 5:
                        highlightMode5(ws, quadFreqs, dbQuadFreqs, x, y);
                        break;
                    case 6:
                        highlightMode6(ws, quadFreqs, dbQuadFreqs, x, y);
                        break;
                    case 7:
                        highlightMode7(ws, quadFreqs, dbQuadFreqs, x, y);
                        break;
                    case 8:
                        highlightMode8(ws, quadFreqs, dbQuadFreqs, x, y);
                        break;
                    case 9:
                        highlightMode9(ws, quadFreqs, dbQuadFreqs, x, y);
                        break;
                    case 10:
                        highlightMode10(ws, quadFreqs, dbQuadFreqs, x, y);
                        break;
                    default:
                        highlightMode1(ws, quadFreqs, dbQuadFreqs, x, y);
                }
            // Getting the duration of each fixation
            } else if (tokens[0] == "duration") {
                temp = tokens[1].split(":");
                result = temp[2];
                focusedTimeInSeconds += parseFloat(result);
                // console.log("focusedTime is now: " + focusedTimeInSeconds);
            }
        };

        ws.onclose = function() { 
            // websocket is closed.
            alert("Connection is closed..."); 
        };
        
        window.onbeforeunload = function(event) {
            
            // Close the connection, if open.
            if (ws.readyState === WebSocket.OPEN) {
                // TODO: conceptual thing - why was doc.getElembyid not giving
                // correct result unless you toggled?

                // var infoToSend = {
                // article: '1',
                // user: '1',
                // hlight: $("#hlighterCenter").css("visibility"),
                // data: data
                // };
                // ws.send(JSON.stringify(infoToSend));
                
                //const fs = require('fs');
                //fs.writeFile('Output.txt', data, (err) => {
                //    if (err) throw err;           
                //});

                // Close the connection
                ws.close();
            };
        }
    }
    else {
        // The browser doesn't support WebSocket
        alert("WebSocket NOT supported by your Browser!");
    }
}

function highlightMode1(ws, quadFreqs, dbQuadFreqs, x, y) {
    // INITIALISATION - DONE ONLY ONCE
    // at first you have to color everything the most basic color
    // this is only done once, afterwards you'll continue updating
    // each quadrant individually

    // White, 
    var colorLvls = ['#ffffff', '#a4a4a4'];


    if (!initialHighlightingDone) {
        for(var i = 0; i < quadFreqs.length; i++) {
            // for(var j = 0; j < quadFreqs[i].length; j++) {
                var baseColor = colorLvls[0];   // use lowest level
                var currSpanNum = i;
                // var currQuadNum = j;
                var spanHandle = $(`#${currSpanNum}.line`);   // note `#x.y` instead of `#x .y`
                spanHandle.css("background-color", baseColor); // set the background to white for every line

                // Highlight lines that have already been read
                var freqs = dbQuadFreqs[i];
                var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
                var MAX = 450;
                percentRead = (normalisedFreq / MAX) * 100;

                // use linear gradient with given percent to highlight 
                // the selected span
                // ONLY if we've read >= 10% of line
                if (percentRead >= MIN_PERCENT_READ) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                    dbQuadFreqs[i].push(percentRead);
                }
                else {
                    dbQuadFreqs[i].push(0);
                }
            // } 
        }
        initialHighlightingDone = true;
    }

    // console.log(dbQuadFreqs);
    // console.log(quadFreqs);

    var currQuadId = '';
    var currLineId = '';

    // -----------------
    // STEP 1 
    // -----------------
    // check if gaze is on a quadrant, line, or neither
    el = document.elementFromPoint(x, y);
    // if element under pointer is one of our quads
    if (el != null){
        var isSpan = (el.nodeName.toLowerCase() == "span");
        var spanClassName = $(el).attr('class');
        if (isSpan) {
            if (spanClassName == "quad") {
                // extract and set id of our pointer
                currQuadId = $(el).attr('id');
            } else if (spanClassName == "line") {
                currLineId = $(el).attr('id');
            }
        }
    }
    

    // -----------------
    // STEP 2
    // -----------------
    // IF gaze was on a line
    var infoStr = '';               // will fill with info you send back to server

    // CASE 1 - gaze rested on specific quadrant (subset of line)
    // -----------------
    if (currQuadId != '') {
        // parse the quadrant span's ID for quad number and span number
        // quadNums range [0,3], whereas spans are [0,INF]
        // In a string XYYYY , X = quad number, Y = span number
        var quadNum = parseInt(currQuadId.charAt(0));
        var spanNum = parseInt(currQuadId.substr(1));

        // selector for span containing these quadrants
        var spanHandle = $(`#${spanNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${spanNum}|${quadNum}|${t}`;

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, spanNum)) {
            // add to queue
            lineQueue.push(spanNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for relevant quadrant 
            // of relevant line in freq matrix
            quadFreqs[spanNum][quadNum] += 1;

            // use custom formula to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[spanNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;
            
            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                spanHandle.css("background", backgroundCSS);
            }
        }
    
    // CASE 2 - gaze rested on a line, but no specific quadrant
    // -----------------
    } else if (currLineId != '') {        // Gaze not on a line
        // id of `line` span == line number of that span
        var lineNum = currLineId;
        // get a handle on the span corresponding to that line
        var spanHandle = $(`#${lineNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${lineNum}|NA|${t}`;

        lineNum = parseInt(lineNum);

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, lineNum)) {
            // add to queue
            lineQueue.push(lineNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for quadrants of relevant line in freq matrix
            // custom decision on how to distribute credit by quadrants
            // since we don't know of specific quadrant
            // right now: 4/8, 2/8, 1/8, 1/8 
            
            // console.log(quadFreqs);
            quadFreqs[lineNum][0] += 0.50;
            quadFreqs[lineNum][1] += 0.25;
            quadFreqs[lineNum][2] += 0.125;
            quadFreqs[lineNum][3] += 0.125;

            // use custom formulat to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[lineNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;

            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                spanHandle.css("background", backgroundCSS);
            }
        }
                
    // CASE 3 -- gaze did not rest on a line at all
    // -----------------
    } else {
        // record that you weren't looking at a line
        const t = (new Date()).getTime();
        infoStr = `-1|-1|${t}`;                        
    }

    // send info on line num, quad num, and timestamp, back to server
    // console.log(infoStr);
    ws.send(infoStr);

}

function highlightMode2(ws, quadFreqs, dbQuadFreqs, x, y) {
    // INITIALISATION - DONE ONLY ONCE
    // at first you have to color everything the most basic color
    // this is only done once, afterwards you'll continue updating
    // each quadrant individually
    var colorLvls = ['#F74040', '#BEBEBE', '#888585', '#BEBEBE'];


    if (!initialHighlightingDone) {
        for(var i = 0; i < quadFreqs.length; i++) {
            // for(var j = 0; j < quadFreqs[i].length; j++) {
                var baseColor = colorLvls[0];   // use lowest level
                var currSpanNum = i;
                // var currQuadNum = j;
                var spanHandle = $(`#${currSpanNum}.line`);   // note `#x.y` instead of `#x .y`
                spanHandle.css("background-color", baseColor); // set the background to white for every line

                // Highlight lines that have already been read
                var freqs = dbQuadFreqs[i];
                var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
                var MAX = 450;
                percentRead = (normalisedFreq / MAX) * 100;

                // use linear gradient with given percent to highlight 
                // the selected span
                // ONLY if we've read >= 10% of line
                if (percentRead >= MIN_PERCENT_READ) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[2]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                    dbQuadFreqs[i].push(percentRead);
                }
                else {
                    dbQuadFreqs[i].push(0);
                }
            // }
        }
        initialHighlightingDone = true;
    }

    // console.log(dbQuadFreqs);
    // console.log(quadFreqs);

    var currQuadId = '';
    var currLineId = '';

    // -----------------
    // STEP 1 
    // -----------------
    // check if gaze is on a quadrant, line, or neither
    el = document.elementFromPoint(x, y);
    // if element under pointer is one of our quads
    if (el != null){
        var isSpan = (el.nodeName.toLowerCase() == "span");
        var spanClassName = $(el).attr('class');
        if (isSpan) {
            if (spanClassName == "quad") {
                // extract and set id of our pointer
                currQuadId = $(el).attr('id');
            } else if (spanClassName == "line") {
                currLineId = $(el).attr('id');
            }
        }
    }
    

    // -----------------
    // STEP 2
    // -----------------
    // IF gaze was on a line
    var infoStr = '';               // will fill with info you send back to server

    // CASE 1 - gaze rested on specific quadrant (subset of line)
    // -----------------
    if (currQuadId != '') {
        // parse the quadrant span's ID for quad number and span number
        // quadNums range [0,3], whereas spans are [0,INF]
        // In a string XYYYY , X = quad number, Y = span number
        var quadNum = parseInt(currQuadId.charAt(0));
        var spanNum = parseInt(currQuadId.substr(1));

        // selector for span containing these quadrants
        var spanHandle = $(`#${spanNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${spanNum}|${quadNum}|${t}`;

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, spanNum)) {
            // add to queue
            lineQueue.push(spanNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for relevant quadrant 
            // of relevant line in freq matrix
            quadFreqs[spanNum][quadNum] += 1;

            // use custom formula to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[spanNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;
            
            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                var dbPercentRead = Math.min(dbQuadFreqs[spanNum][4], 100);
                if (percentRead > dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${dbPercentRead}%, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (percentRead <= dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]}, ${dbPercentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
    
    // CASE 2 - gaze rested on a line, but no specific quadrant
    // -----------------
    } else if (currLineId != '') {        // Gaze not on a line
        // id of `line` span == line number of that span
        var lineNum = currLineId;
        // get a handle on the span corresponding to that line
        var spanHandle = $(`#${lineNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${lineNum}|NA|${t}`;

        lineNum = parseInt(lineNum);

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, lineNum)) {
            // add to queue
            lineQueue.push(lineNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for quadrants of relevant line in freq matrix
            // custom decision on how to distribute credit by quadrants
            // since we don't know of specific quadrant
            // right now: 4/8, 2/8, 1/8, 1/8 
            
            // console.log(quadFreqs);
            quadFreqs[lineNum][0] += 0.50;
            quadFreqs[lineNum][1] += 0.25;
            quadFreqs[lineNum][2] += 0.125;
            quadFreqs[lineNum][3] += 0.125;

            // use custom formulat to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[lineNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;

            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                if (dbQuadFreqs[lineNum][4] == 0) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (dbQuadFreqs[lineNum][4] == 1) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
                
    // CASE 3 -- gaze did not rest on a line at all
    // -----------------
    } else {
        // record that you weren't looking at a line
        const t = (new Date()).getTime();
        infoStr = `-1|-1|${t}`;                        
    }

    // send info on line num, quad num, and timestamp, back to server
    // console.log(infoStr);
    ws.send(infoStr);


    ///////////////////////////////////////////////////////////



    ///////////////////////////////////////////////////////////
    // HIGHLIGHTING MECHANISM: only quadrant-based
    ///////////////////////////////////////////////////////////

    /*      // uncomment to activate

    // https://www.w3schools.com/cssref/css_colors.asp
    // https://www.w3schools.com/colors/colors_picker.asp?colorhex=F0F8FF
    var colorLvls = ['DarkRed', 'Red', 'DarkGreen', 'GreenYellow'];
    // var colorLvls = ['#ffffff', '#f0f8ff', '#cce7ff', '#99cfff'];
    var freqLvls = [5, 10, 15, 20];

    // INITIALISATION - DONE ONLY ONCE
    // at first you have to color everything the most basic color
    // this is only done once, afterwards you'll continue updating
    // each quadrant individually
    if (!initialHighlightingDone) {
        for(var i = 0; i < quadFreqs.length; i++) {
            for(var j = 0; j < quadFreqs[i].length; j++) {
                var currQuadFreq = quadFreqs[i][j];
                var lvl = 0;            // use lowest level
                var thisQuadColor = colorLvls[lvl];
                var currSpanNum = i;
                var currQuadNum = j;
                var thisQuadId = `${currQuadNum.toString()}${currSpanNum.toString()}`
                $(`#${thisQuadId}`).css("background-color", thisQuadColor);
            }
        }
        initialHighlightingDone = true;
    }

    var currQuadId = '';

    // STEP 1 
    // check if gaze is on a quadrant
    el = document.elementFromPoint(x, y);
    // if element under pointer is one of our quads
    if (el != null){
        var isSpan = (el.nodeName.toLowerCase() == "span");
        var isOurClass = ($(el).attr('class') == "quad");
        if (isSpan && isOurClass) {
            // extract and set id of our pointer
            currQuadId = $(el).attr('id');
        }
    } 
    
    // STEP 2
    // take action only if gaze was on a quadrant
    if (currQuadId != '') {
        // parse the quadrant span's ID for quad number and span number
        // quadNums range [0,3], whereas spans are [0,INF]
        // In a string XYYYY , X = quad number, Y = span number
        var quadNum = parseInt(currQuadId.charAt(0));
        var spanNum = parseInt(currQuadId.substr(1));

        // increment entry for relevant quadrant 
        // of relevant line in freq matrix
        quadFreqs[spanNum][quadNum] += 1;

        // find which level this new frequency corresponds to
        for(var k = 0; k < freqLvls.length; k++) {
            var currQuadFreq = quadFreqs[spanNum][quadNum];
            if (currQuadFreq < freqLvls[k]) {
                // found relevant level, color the quadrant using 
                // lvl as index for which color to use
                var thisLvlColor = colorLvls[k];
                $(`#${currQuadId}`).css("background-color", thisLvlColor);
                break;     // exit out once you've found & used correct level
            }
        }
    }

    */
}

function highlightMode3(ws, quadFreqs, dbQuadFreqs, x, y) {
    // INITIALISATION - DONE ONLY ONCE
    // at first you have to color everything the most basic color
    // this is only done once, afterwards you'll continue updating
    // each quadrant individually
    var colorLvls = ['#ffffff', '#99cfff', '#ffcc66', '#ffccff'];


    if (!initialHighlightingDone) {
        for(var i = 0; i < quadFreqs.length; i++) {
            // for(var j = 0; j < quadFreqs[i].length; j++) {
                var baseColor = colorLvls[0];   // use lowest level
                var currSpanNum = i;
                // var currQuadNum = j;
                var spanHandle = $(`#${currSpanNum}.line`);   // note `#x.y` instead of `#x .y`
                spanHandle.css("background-color", baseColor); // set the background to white for every line

                // Highlight lines that have already been read
                var freqs = dbQuadFreqs[i];
                var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
                var MAX = 450;
                percentRead = (normalisedFreq / MAX) * 100;

                // use linear gradient with given percent to highlight 
                // the selected span
                // ONLY if we've read >= 10% of line
                if (percentRead >= MIN_PERCENT_READ) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[2]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                    dbQuadFreqs[i].push(percentRead);
                }
                else {
                    dbQuadFreqs[i].push(0);
                }
            // } 
        }
        initialHighlightingDone = true;
    }

    // console.log(dbQuadFreqs);
    // console.log(quadFreqs);

    var currQuadId = '';
    var currLineId = '';

    // -----------------
    // STEP 1 
    // -----------------
    // check if gaze is on a quadrant, line, or neither
    el = document.elementFromPoint(x, y);
    // if element under pointer is one of our quads
    if (el != null){
        var isSpan = (el.nodeName.toLowerCase() == "span");
        var spanClassName = $(el).attr('class');
        if (isSpan) {
            if (spanClassName == "quad") {
                // extract and set id of our pointer
                currQuadId = $(el).attr('id');
            } else if (spanClassName == "line") {
                currLineId = $(el).attr('id');
            }
        }
    }
    

    // -----------------
    // STEP 2
    // -----------------
    // IF gaze was on a line
    var infoStr = '';               // will fill with info you send back to server

    // CASE 1 - gaze rested on specific quadrant (subset of line)
    // -----------------
    if (currQuadId != '') {
        // parse the quadrant span's ID for quad number and span number
        // quadNums range [0,3], whereas spans are [0,INF]
        // In a string XYYYY , X = quad number, Y = span number
        var quadNum = parseInt(currQuadId.charAt(0));
        var spanNum = parseInt(currQuadId.substr(1));

        // selector for span containing these quadrants
        var spanHandle = $(`#${spanNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${spanNum}|${quadNum}|${t}`;

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, spanNum)) {
            // add to queue
            lineQueue.push(spanNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for relevant quadrant 
            // of relevant line in freq matrix
            quadFreqs[spanNum][quadNum] += 1;

            // use custom formula to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[spanNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;
            
            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                var dbPercentRead = Math.min(dbQuadFreqs[spanNum][4], 100);
                if (percentRead > dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${dbPercentRead}%, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (percentRead <= dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]}, ${dbPercentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
    
    // CASE 2 - gaze rested on a line, but no specific quadrant
    // -----------------
    } else if (currLineId != '') {        // Gaze not on a line
        // id of `line` span == line number of that span
        var lineNum = currLineId;
        // get a handle on the span corresponding to that line
        var spanHandle = $(`#${lineNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${lineNum}|NA|${t}`;

        lineNum = parseInt(lineNum);

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, lineNum)) {
            // add to queue
            lineQueue.push(lineNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for quadrants of relevant line in freq matrix
            // custom decision on how to distribute credit by quadrants
            // since we don't know of specific quadrant
            // right now: 4/8, 2/8, 1/8, 1/8 
            
            // console.log(quadFreqs);
            quadFreqs[lineNum][0] += 0.50;
            quadFreqs[lineNum][1] += 0.25;
            quadFreqs[lineNum][2] += 0.125;
            quadFreqs[lineNum][3] += 0.125;

            // use custom formulat to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[lineNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;

            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                if (dbQuadFreqs[lineNum][4] == 0) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (dbQuadFreqs[lineNum][4] == 1) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
                
    // CASE 3 -- gaze did not rest on a line at all
    // -----------------
    } else {
        // record that you weren't looking at a line
        const t = (new Date()).getTime();
        infoStr = `-1|-1|${t}`;                        
    }

    // send info on line num, quad num, and timestamp, back to server
    // console.log(infoStr);
    ws.send(infoStr);

}

function highlightMode4(ws, quadFreqs, dbQuadFreqs, x, y) {
    // INITIALISATION - DONE ONLY ONCE
    // at first you have to color everything the most basic color
    // this is only done once, afterwards you'll continue updating
    // each quadrant individually
    var colorLvls = ['#ffffff', '#99cfff', '#ffcc66', '#ffccff'];


    if (!initialHighlightingDone) {
        for(var i = 0; i < quadFreqs.length; i++) {
            // for(var j = 0; j < quadFreqs[i].length; j++) {
                var baseColor = colorLvls[0];   // use lowest level
                var currSpanNum = i;
                // var currQuadNum = j;
                var spanHandle = $(`#${currSpanNum}.line`);   // note `#x.y` instead of `#x .y`
                spanHandle.css("background-color", baseColor); // set the background to white for every line

                // Highlight lines that have already been read
                var freqs = dbQuadFreqs[i];
                var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
                var MAX = 450;
                percentRead = (normalisedFreq / MAX) * 100;

                // use linear gradient with given percent to highlight 
                // the selected span
                // ONLY if we've read >= 10% of line
                if (percentRead >= MIN_PERCENT_READ) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[2]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                    dbQuadFreqs[i].push(percentRead);
                }
                else {
                    dbQuadFreqs[i].push(0);
                }
            // } 
        }
        initialHighlightingDone = true;
    }

    // console.log(dbQuadFreqs);
    // console.log(quadFreqs);

    var currQuadId = '';
    var currLineId = '';

    // -----------------
    // STEP 1 
    // -----------------
    // check if gaze is on a quadrant, line, or neither
    el = document.elementFromPoint(x, y);
    // if element under pointer is one of our quads
    if (el != null){
        var isSpan = (el.nodeName.toLowerCase() == "span");
        var spanClassName = $(el).attr('class');
        if (isSpan) {
            if (spanClassName == "quad") {
                // extract and set id of our pointer
                currQuadId = $(el).attr('id');
            } else if (spanClassName == "line") {
                currLineId = $(el).attr('id');
            }
        }
    }
    

    // -----------------
    // STEP 2
    // -----------------
    // IF gaze was on a line
    var infoStr = '';               // will fill with info you send back to server

    // CASE 1 - gaze rested on specific quadrant (subset of line)
    // -----------------
    if (currQuadId != '') {
        // parse the quadrant span's ID for quad number and span number
        // quadNums range [0,3], whereas spans are [0,INF]
        // In a string XYYYY , X = quad number, Y = span number
        var quadNum = parseInt(currQuadId.charAt(0));
        var spanNum = parseInt(currQuadId.substr(1));

        // selector for span containing these quadrants
        var spanHandle = $(`#${spanNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${spanNum}|${quadNum}|${t}`;

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, spanNum)) {
            // add to queue
            lineQueue.push(spanNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for relevant quadrant 
            // of relevant line in freq matrix
            quadFreqs[spanNum][quadNum] += 1;

            // use custom formula to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[spanNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;
            
            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                var dbPercentRead = Math.min(dbQuadFreqs[spanNum][4], 100);
                if (percentRead > dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${dbPercentRead}%, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (percentRead <= dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]}, ${dbPercentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
    
    // CASE 2 - gaze rested on a line, but no specific quadrant
    // -----------------
    } else if (currLineId != '') {        // Gaze not on a line
        // id of `line` span == line number of that span
        var lineNum = currLineId;
        // get a handle on the span corresponding to that line
        var spanHandle = $(`#${lineNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${lineNum}|NA|${t}`;

        lineNum = parseInt(lineNum);

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, lineNum)) {
            // add to queue
            lineQueue.push(lineNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for quadrants of relevant line in freq matrix
            // custom decision on how to distribute credit by quadrants
            // since we don't know of specific quadrant
            // right now: 4/8, 2/8, 1/8, 1/8 
            
            // console.log(quadFreqs);
            quadFreqs[lineNum][0] += 0.50;
            quadFreqs[lineNum][1] += 0.25;
            quadFreqs[lineNum][2] += 0.125;
            quadFreqs[lineNum][3] += 0.125;

            // use custom formulat to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[lineNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;

            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                if (dbQuadFreqs[lineNum][4] == 0) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (dbQuadFreqs[lineNum][4] == 1) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
                
    // CASE 3 -- gaze did not rest on a line at all
    // -----------------
    } else {
        // record that you weren't looking at a line
        const t = (new Date()).getTime();
        infoStr = `-1|-1|${t}`;                        
    }

    // send info on line num, quad num, and timestamp, back to server
    // console.log(infoStr);
    ws.send(infoStr);

}

function highlightMode5(ws, quadFreqs, dbQuadFreqs, x, y) {
    // INITIALISATION - DONE ONLY ONCE
    // at first you have to color everything the most basic color
    // this is only done once, afterwards you'll continue updating
    // each quadrant individually
    var colorLvls = ['#ffffff', '#99cfff', '#ffcc66', '#ffccff'];


    if (!initialHighlightingDone) {
        for(var i = 0; i < quadFreqs.length; i++) {
            // for(var j = 0; j < quadFreqs[i].length; j++) {
                var baseColor = colorLvls[0];   // use lowest level
                var currSpanNum = i;
                // var currQuadNum = j;
                var spanHandle = $(`#${currSpanNum}.line`);   // note `#x.y` instead of `#x .y`
                spanHandle.css("background-color", baseColor); // set the background to white for every line

                // Highlight lines that have already been read
                var freqs = dbQuadFreqs[i];
                var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
                var MAX = 450;
                percentRead = (normalisedFreq / MAX) * 100;

                // use linear gradient with given percent to highlight 
                // the selected span
                // ONLY if we've read >= 10% of line
                if (percentRead >= MIN_PERCENT_READ) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[2]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                    dbQuadFreqs[i].push(percentRead);
                }
                else {
                    dbQuadFreqs[i].push(0);
                }
            // } 
        }
        initialHighlightingDone = true;
    }

    // console.log(dbQuadFreqs);
    // console.log(quadFreqs);

    var currQuadId = '';
    var currLineId = '';

    // -----------------
    // STEP 1 
    // -----------------
    // check if gaze is on a quadrant, line, or neither
    el = document.elementFromPoint(x, y);
    // if element under pointer is one of our quads
    if (el != null){
        var isSpan = (el.nodeName.toLowerCase() == "span");
        var spanClassName = $(el).attr('class');
        if (isSpan) {
            if (spanClassName == "quad") {
                // extract and set id of our pointer
                currQuadId = $(el).attr('id');
            } else if (spanClassName == "line") {
                currLineId = $(el).attr('id');
            }
        }
    }
    

    // -----------------
    // STEP 2
    // -----------------
    // IF gaze was on a line
    var infoStr = '';               // will fill with info you send back to server

    // CASE 1 - gaze rested on specific quadrant (subset of line)
    // -----------------
    if (currQuadId != '') {
        // parse the quadrant span's ID for quad number and span number
        // quadNums range [0,3], whereas spans are [0,INF]
        // In a string XYYYY , X = quad number, Y = span number
        var quadNum = parseInt(currQuadId.charAt(0));
        var spanNum = parseInt(currQuadId.substr(1));

        // selector for span containing these quadrants
        var spanHandle = $(`#${spanNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${spanNum}|${quadNum}|${t}`;

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, spanNum)) {
            // add to queue
            lineQueue.push(spanNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for relevant quadrant 
            // of relevant line in freq matrix
            quadFreqs[spanNum][quadNum] += 1;

            // use custom formula to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[spanNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;
            
            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                var dbPercentRead = Math.min(dbQuadFreqs[spanNum][4], 100);
                if (percentRead > dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${dbPercentRead}%, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (percentRead <= dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]}, ${dbPercentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
    
    // CASE 2 - gaze rested on a line, but no specific quadrant
    // -----------------
    } else if (currLineId != '') {        // Gaze not on a line
        // id of `line` span == line number of that span
        var lineNum = currLineId;
        // get a handle on the span corresponding to that line
        var spanHandle = $(`#${lineNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${lineNum}|NA|${t}`;

        lineNum = parseInt(lineNum);

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, lineNum)) {
            // add to queue
            lineQueue.push(lineNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for quadrants of relevant line in freq matrix
            // custom decision on how to distribute credit by quadrants
            // since we don't know of specific quadrant
            // right now: 4/8, 2/8, 1/8, 1/8 
            
            // console.log(quadFreqs);
            quadFreqs[lineNum][0] += 0.50;
            quadFreqs[lineNum][1] += 0.25;
            quadFreqs[lineNum][2] += 0.125;
            quadFreqs[lineNum][3] += 0.125;

            // use custom formulat to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[lineNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;

            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                if (dbQuadFreqs[lineNum][4] == 0) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (dbQuadFreqs[lineNum][4] == 1) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
                
    // CASE 3 -- gaze did not rest on a line at all
    // -----------------
    } else {
        // record that you weren't looking at a line
        const t = (new Date()).getTime();
        infoStr = `-1|-1|${t}`;                        
    }

    // send info on line num, quad num, and timestamp, back to server
    // console.log(infoStr);
    ws.send(infoStr);

}

function highlightMode6(ws, quadFreqs, dbQuadFreqs, x, y) {
    // INITIALISATION - DONE ONLY ONCE
    // at first you have to color everything the most basic color
    // this is only done once, afterwards you'll continue updating
    // each quadrant individually
    var colorLvls = ['#ffffff', '#99cfff', '#ffcc66', '#ffccff'];


    if (!initialHighlightingDone) {
        for(var i = 0; i < quadFreqs.length; i++) {
            // for(var j = 0; j < quadFreqs[i].length; j++) {
                var baseColor = colorLvls[0];   // use lowest level
                var currSpanNum = i;
                // var currQuadNum = j;
                var spanHandle = $(`#${currSpanNum}.line`);   // note `#x.y` instead of `#x .y`
                spanHandle.css("background-color", baseColor); // set the background to white for every line

                // Highlight lines that have already been read
                var freqs = dbQuadFreqs[i];
                var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
                var MAX = 450;
                percentRead = (normalisedFreq / MAX) * 100;

                // use linear gradient with given percent to highlight 
                // the selected span
                // ONLY if we've read >= 10% of line
                if (percentRead >= MIN_PERCENT_READ) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[2]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                    dbQuadFreqs[i].push(percentRead);
                }
                else {
                    dbQuadFreqs[i].push(0);
                }
            // } 
        }
        initialHighlightingDone = true;
    }

    // console.log(dbQuadFreqs);
    // console.log(quadFreqs);

    var currQuadId = '';
    var currLineId = '';

    // -----------------
    // STEP 1 
    // -----------------
    // check if gaze is on a quadrant, line, or neither
    el = document.elementFromPoint(x, y);
    // if element under pointer is one of our quads
    if (el != null){
        var isSpan = (el.nodeName.toLowerCase() == "span");
        var spanClassName = $(el).attr('class');
        if (isSpan) {
            if (spanClassName == "quad") {
                // extract and set id of our pointer
                currQuadId = $(el).attr('id');
            } else if (spanClassName == "line") {
                currLineId = $(el).attr('id');
            }
        }
    }
    

    // -----------------
    // STEP 2
    // -----------------
    // IF gaze was on a line
    var infoStr = '';               // will fill with info you send back to server

    // CASE 1 - gaze rested on specific quadrant (subset of line)
    // -----------------
    if (currQuadId != '') {
        // parse the quadrant span's ID for quad number and span number
        // quadNums range [0,3], whereas spans are [0,INF]
        // In a string XYYYY , X = quad number, Y = span number
        var quadNum = parseInt(currQuadId.charAt(0));
        var spanNum = parseInt(currQuadId.substr(1));

        // selector for span containing these quadrants
        var spanHandle = $(`#${spanNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${spanNum}|${quadNum}|${t}`;

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, spanNum)) {
            // add to queue
            lineQueue.push(spanNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for relevant quadrant 
            // of relevant line in freq matrix
            quadFreqs[spanNum][quadNum] += 1;

            // use custom formula to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[spanNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;
            
            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                var dbPercentRead = Math.min(dbQuadFreqs[spanNum][4], 100);
                if (percentRead > dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${dbPercentRead}%, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (percentRead <= dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]}, ${dbPercentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
    
    // CASE 2 - gaze rested on a line, but no specific quadrant
    // -----------------
    } else if (currLineId != '') {        // Gaze not on a line
        // id of `line` span == line number of that span
        var lineNum = currLineId;
        // get a handle on the span corresponding to that line
        var spanHandle = $(`#${lineNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${lineNum}|NA|${t}`;

        lineNum = parseInt(lineNum);

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, lineNum)) {
            // add to queue
            lineQueue.push(lineNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for quadrants of relevant line in freq matrix
            // custom decision on how to distribute credit by quadrants
            // since we don't know of specific quadrant
            // right now: 4/8, 2/8, 1/8, 1/8 
            
            // console.log(quadFreqs);
            quadFreqs[lineNum][0] += 0.50;
            quadFreqs[lineNum][1] += 0.25;
            quadFreqs[lineNum][2] += 0.125;
            quadFreqs[lineNum][3] += 0.125;

            // use custom formulat to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[lineNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;

            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                if (dbQuadFreqs[lineNum][4] == 0) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (dbQuadFreqs[lineNum][4] == 1) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
                
    // CASE 3 -- gaze did not rest on a line at all
    // -----------------
    } else {
        // record that you weren't looking at a line
        const t = (new Date()).getTime();
        infoStr = `-1|-1|${t}`;                        
    }

    // send info on line num, quad num, and timestamp, back to server
    // console.log(infoStr);
    ws.send(infoStr);

}

function highlightMode7(ws, quadFreqs, dbQuadFreqs, x, y) {
    // INITIALISATION - DONE ONLY ONCE
    // at first you have to color everything the most basic color
    // this is only done once, afterwards you'll continue updating
    // each quadrant individually
    var colorLvls = ['#ffffff', '#99cfff', '#ffcc66', '#ffccff'];


    if (!initialHighlightingDone) {
        for(var i = 0; i < quadFreqs.length; i++) {
            // for(var j = 0; j < quadFreqs[i].length; j++) {
                var baseColor = colorLvls[0];   // use lowest level
                var currSpanNum = i;
                // var currQuadNum = j;
                var spanHandle = $(`#${currSpanNum}.line`);   // note `#x.y` instead of `#x .y`
                spanHandle.css("background-color", baseColor); // set the background to white for every line

                // Highlight lines that have already been read
                var freqs = dbQuadFreqs[i];
                var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
                var MAX = 450;
                percentRead = (normalisedFreq / MAX) * 100;

                // use linear gradient with given percent to highlight 
                // the selected span
                // ONLY if we've read >= 10% of line
                if (percentRead >= MIN_PERCENT_READ) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[2]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                    dbQuadFreqs[i].push(percentRead);
                }
                else {
                    dbQuadFreqs[i].push(0);
                }
            // } 
        }
        initialHighlightingDone = true;
    }

    // console.log(dbQuadFreqs);
    // console.log(quadFreqs);

    var currQuadId = '';
    var currLineId = '';

    // -----------------
    // STEP 1 
    // -----------------
    // check if gaze is on a quadrant, line, or neither
    el = document.elementFromPoint(x, y);
    // if element under pointer is one of our quads
    if (el != null){
        var isSpan = (el.nodeName.toLowerCase() == "span");
        var spanClassName = $(el).attr('class');
        if (isSpan) {
            if (spanClassName == "quad") {
                // extract and set id of our pointer
                currQuadId = $(el).attr('id');
            } else if (spanClassName == "line") {
                currLineId = $(el).attr('id');
            }
        }
    }
    

    // -----------------
    // STEP 2
    // -----------------
    // IF gaze was on a line
    var infoStr = '';               // will fill with info you send back to server

    // CASE 1 - gaze rested on specific quadrant (subset of line)
    // -----------------
    if (currQuadId != '') {
        // parse the quadrant span's ID for quad number and span number
        // quadNums range [0,3], whereas spans are [0,INF]
        // In a string XYYYY , X = quad number, Y = span number
        var quadNum = parseInt(currQuadId.charAt(0));
        var spanNum = parseInt(currQuadId.substr(1));

        // selector for span containing these quadrants
        var spanHandle = $(`#${spanNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${spanNum}|${quadNum}|${t}`;

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, spanNum)) {
            // add to queue
            lineQueue.push(spanNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for relevant quadrant 
            // of relevant line in freq matrix
            quadFreqs[spanNum][quadNum] += 1;

            // use custom formula to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[spanNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;
            
            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                var dbPercentRead = Math.min(dbQuadFreqs[spanNum][4], 100);
                if (percentRead > dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${dbPercentRead}%, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (percentRead <= dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]}, ${dbPercentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
    
    // CASE 2 - gaze rested on a line, but no specific quadrant
    // -----------------
    } else if (currLineId != '') {        // Gaze not on a line
        // id of `line` span == line number of that span
        var lineNum = currLineId;
        // get a handle on the span corresponding to that line
        var spanHandle = $(`#${lineNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${lineNum}|NA|${t}`;

        lineNum = parseInt(lineNum);

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, lineNum)) {
            // add to queue
            lineQueue.push(lineNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for quadrants of relevant line in freq matrix
            // custom decision on how to distribute credit by quadrants
            // since we don't know of specific quadrant
            // right now: 4/8, 2/8, 1/8, 1/8 
            
            // console.log(quadFreqs);
            quadFreqs[lineNum][0] += 0.50;
            quadFreqs[lineNum][1] += 0.25;
            quadFreqs[lineNum][2] += 0.125;
            quadFreqs[lineNum][3] += 0.125;

            // use custom formulat to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[lineNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;

            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                if (dbQuadFreqs[lineNum][4] == 0) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (dbQuadFreqs[lineNum][4] == 1) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
                
    // CASE 3 -- gaze did not rest on a line at all
    // -----------------
    } else {
        // record that you weren't looking at a line
        const t = (new Date()).getTime();
        infoStr = `-1|-1|${t}`;                        
    }

    // send info on line num, quad num, and timestamp, back to server
    // console.log(infoStr);
    ws.send(infoStr);

}

function highlightMode8(ws, quadFreqs, dbQuadFreqs, x, y) {
    // INITIALISATION - DONE ONLY ONCE
    // at first you have to color everything the most basic color
    // this is only done once, afterwards you'll continue updating
    // each quadrant individually
    var colorLvls = ['#ffffff', '#99cfff', '#ffcc66', '#ffccff'];


    if (!initialHighlightingDone) {
        for(var i = 0; i < quadFreqs.length; i++) {
            // for(var j = 0; j < quadFreqs[i].length; j++) {
                var baseColor = colorLvls[0];   // use lowest level
                var currSpanNum = i;
                // var currQuadNum = j;
                var spanHandle = $(`#${currSpanNum}.line`);   // note `#x.y` instead of `#x .y`
                spanHandle.css("background-color", baseColor); // set the background to white for every line

                // Highlight lines that have already been read
                var freqs = dbQuadFreqs[i];
                var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
                var MAX = 450;
                percentRead = (normalisedFreq / MAX) * 100;

                // use linear gradient with given percent to highlight 
                // the selected span
                // ONLY if we've read >= 10% of line
                if (percentRead >= MIN_PERCENT_READ) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[2]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                    dbQuadFreqs[i].push(percentRead);
                }
                else {
                    dbQuadFreqs[i].push(0);
                }
            // } 
        }
        initialHighlightingDone = true;
    }

    // console.log(dbQuadFreqs);
    // console.log(quadFreqs);

    var currQuadId = '';
    var currLineId = '';

    // -----------------
    // STEP 1 
    // -----------------
    // check if gaze is on a quadrant, line, or neither
    el = document.elementFromPoint(x, y);
    // if element under pointer is one of our quads
    if (el != null){
        var isSpan = (el.nodeName.toLowerCase() == "span");
        var spanClassName = $(el).attr('class');
        if (isSpan) {
            if (spanClassName == "quad") {
                // extract and set id of our pointer
                currQuadId = $(el).attr('id');
            } else if (spanClassName == "line") {
                currLineId = $(el).attr('id');
            }
        }
    }
    

    // -----------------
    // STEP 2
    // -----------------
    // IF gaze was on a line
    var infoStr = '';               // will fill with info you send back to server

    // CASE 1 - gaze rested on specific quadrant (subset of line)
    // -----------------
    if (currQuadId != '') {
        // parse the quadrant span's ID for quad number and span number
        // quadNums range [0,3], whereas spans are [0,INF]
        // In a string XYYYY , X = quad number, Y = span number
        var quadNum = parseInt(currQuadId.charAt(0));
        var spanNum = parseInt(currQuadId.substr(1));

        // selector for span containing these quadrants
        var spanHandle = $(`#${spanNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${spanNum}|${quadNum}|${t}`;

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, spanNum)) {
            // add to queue
            lineQueue.push(spanNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for relevant quadrant 
            // of relevant line in freq matrix
            quadFreqs[spanNum][quadNum] += 1;

            // use custom formula to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[spanNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;
            
            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                var dbPercentRead = Math.min(dbQuadFreqs[spanNum][4], 100);
                if (percentRead > dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${dbPercentRead}%, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (percentRead <= dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]}, ${dbPercentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
    
    // CASE 2 - gaze rested on a line, but no specific quadrant
    // -----------------
    } else if (currLineId != '') {        // Gaze not on a line
        // id of `line` span == line number of that span
        var lineNum = currLineId;
        // get a handle on the span corresponding to that line
        var spanHandle = $(`#${lineNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${lineNum}|NA|${t}`;

        lineNum = parseInt(lineNum);

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, lineNum)) {
            // add to queue
            lineQueue.push(lineNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for quadrants of relevant line in freq matrix
            // custom decision on how to distribute credit by quadrants
            // since we don't know of specific quadrant
            // right now: 4/8, 2/8, 1/8, 1/8 
            
            // console.log(quadFreqs);
            quadFreqs[lineNum][0] += 0.50;
            quadFreqs[lineNum][1] += 0.25;
            quadFreqs[lineNum][2] += 0.125;
            quadFreqs[lineNum][3] += 0.125;

            // use custom formulat to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[lineNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;

            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                if (dbQuadFreqs[lineNum][4] == 0) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (dbQuadFreqs[lineNum][4] == 1) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
                
    // CASE 3 -- gaze did not rest on a line at all
    // -----------------
    } else {
        // record that you weren't looking at a line
        const t = (new Date()).getTime();
        infoStr = `-1|-1|${t}`;                        
    }

    // send info on line num, quad num, and timestamp, back to server
    // console.log(infoStr);
    ws.send(infoStr);

}

function highlightMode9(ws, quadFreqs, dbQuadFreqs, x, y) {
    // INITIALISATION - DONE ONLY ONCE
    // at first you have to color everything the most basic color
    // this is only done once, afterwards you'll continue updating
    // each quadrant individually
    var colorLvls = ['#ffffff', '#99cfff', '#ffcc66', '#ffccff'];


    if (!initialHighlightingDone) {
        for(var i = 0; i < quadFreqs.length; i++) {
            // for(var j = 0; j < quadFreqs[i].length; j++) {
                var baseColor = colorLvls[0];   // use lowest level
                var currSpanNum = i;
                // var currQuadNum = j;
                var spanHandle = $(`#${currSpanNum}.line`);   // note `#x.y` instead of `#x .y`
                spanHandle.css("background-color", baseColor); // set the background to white for every line

                // Highlight lines that have already been read
                var freqs = dbQuadFreqs[i];
                var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
                var MAX = 450;
                percentRead = (normalisedFreq / MAX) * 100;

                // use linear gradient with given percent to highlight 
                // the selected span
                // ONLY if we've read >= 10% of line
                if (percentRead >= MIN_PERCENT_READ) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[2]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                    dbQuadFreqs[i].push(percentRead);
                }
                else {
                    dbQuadFreqs[i].push(0);
                }
            // } 
        }
        initialHighlightingDone = true;
    }

    // console.log(dbQuadFreqs);
    // console.log(quadFreqs);

    var currQuadId = '';
    var currLineId = '';

    // -----------------
    // STEP 1 
    // -----------------
    // check if gaze is on a quadrant, line, or neither
    el = document.elementFromPoint(x, y);
    // if element under pointer is one of our quads
    if (el != null){
        var isSpan = (el.nodeName.toLowerCase() == "span");
        var spanClassName = $(el).attr('class');
        if (isSpan) {
            if (spanClassName == "quad") {
                // extract and set id of our pointer
                currQuadId = $(el).attr('id');
            } else if (spanClassName == "line") {
                currLineId = $(el).attr('id');
            }
        }
    }
    

    // -----------------
    // STEP 2
    // -----------------
    // IF gaze was on a line
    var infoStr = '';               // will fill with info you send back to server

    // CASE 1 - gaze rested on specific quadrant (subset of line)
    // -----------------
    if (currQuadId != '') {
        // parse the quadrant span's ID for quad number and span number
        // quadNums range [0,3], whereas spans are [0,INF]
        // In a string XYYYY , X = quad number, Y = span number
        var quadNum = parseInt(currQuadId.charAt(0));
        var spanNum = parseInt(currQuadId.substr(1));

        // selector for span containing these quadrants
        var spanHandle = $(`#${spanNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${spanNum}|${quadNum}|${t}`;

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, spanNum)) {
            // add to queue
            lineQueue.push(spanNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for relevant quadrant 
            // of relevant line in freq matrix
            quadFreqs[spanNum][quadNum] += 1;

            // use custom formula to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[spanNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;
            
            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                var dbPercentRead = Math.min(dbQuadFreqs[spanNum][4], 100);
                if (percentRead > dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${dbPercentRead}%, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (percentRead <= dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]}, ${dbPercentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
    
    // CASE 2 - gaze rested on a line, but no specific quadrant
    // -----------------
    } else if (currLineId != '') {        // Gaze not on a line
        // id of `line` span == line number of that span
        var lineNum = currLineId;
        // get a handle on the span corresponding to that line
        var spanHandle = $(`#${lineNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${lineNum}|NA|${t}`;

        lineNum = parseInt(lineNum);

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, lineNum)) {
            // add to queue
            lineQueue.push(lineNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for quadrants of relevant line in freq matrix
            // custom decision on how to distribute credit by quadrants
            // since we don't know of specific quadrant
            // right now: 4/8, 2/8, 1/8, 1/8 
            
            // console.log(quadFreqs);
            quadFreqs[lineNum][0] += 0.50;
            quadFreqs[lineNum][1] += 0.25;
            quadFreqs[lineNum][2] += 0.125;
            quadFreqs[lineNum][3] += 0.125;

            // use custom formulat to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[lineNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;

            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                if (dbQuadFreqs[lineNum][4] == 0) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (dbQuadFreqs[lineNum][4] == 1) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
                
    // CASE 3 -- gaze did not rest on a line at all
    // -----------------
    } else {
        // record that you weren't looking at a line
        const t = (new Date()).getTime();
        infoStr = `-1|-1|${t}`;                        
    }

    // send info on line num, quad num, and timestamp, back to server
    // console.log(infoStr);
    ws.send(infoStr);

}

function highlightMode10(ws, quadFreqs, dbQuadFreqs, x, y) {
    // INITIALISATION - DONE ONLY ONCE
    // at first you have to color everything the most basic color
    // this is only done once, afterwards you'll continue updating
    // each quadrant individually
    var colorLvls = ['#ffffff', '#99cfff', '#ffcc66', '#ffccff'];


    if (!initialHighlightingDone) {
        for(var i = 0; i < quadFreqs.length; i++) {
            // for(var j = 0; j < quadFreqs[i].length; j++) {
                var baseColor = colorLvls[0];   // use lowest level
                var currSpanNum = i;
                // var currQuadNum = j;
                var spanHandle = $(`#${currSpanNum}.line`);   // note `#x.y` instead of `#x .y`
                spanHandle.css("background-color", baseColor); // set the background to white for every line

                // Highlight lines that have already been read
                var freqs = dbQuadFreqs[i];
                var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
                var MAX = 450;
                percentRead = (normalisedFreq / MAX) * 100;

                // use linear gradient with given percent to highlight 
                // the selected span
                // ONLY if we've read >= 10% of line
                if (percentRead >= MIN_PERCENT_READ) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[2]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                    dbQuadFreqs[i].push(percentRead);
                }
                else {
                    dbQuadFreqs[i].push(0);
                }
            // } 
        }
        initialHighlightingDone = true;
    }

    // console.log(dbQuadFreqs);
    // console.log(quadFreqs);

    var currQuadId = '';
    var currLineId = '';

    // -----------------
    // STEP 1 
    // -----------------
    // check if gaze is on a quadrant, line, or neither
    el = document.elementFromPoint(x, y);
    // if element under pointer is one of our quads
    if (el != null){
        var isSpan = (el.nodeName.toLowerCase() == "span");
        var spanClassName = $(el).attr('class');
        if (isSpan) {
            if (spanClassName == "quad") {
                // extract and set id of our pointer
                currQuadId = $(el).attr('id');
            } else if (spanClassName == "line") {
                currLineId = $(el).attr('id');
            }
        }
    }
    

    // -----------------
    // STEP 2
    // -----------------
    // IF gaze was on a line
    var infoStr = '';               // will fill with info you send back to server

    // CASE 1 - gaze rested on specific quadrant (subset of line)
    // -----------------
    if (currQuadId != '') {
        // parse the quadrant span's ID for quad number and span number
        // quadNums range [0,3], whereas spans are [0,INF]
        // In a string XYYYY , X = quad number, Y = span number
        var quadNum = parseInt(currQuadId.charAt(0));
        var spanNum = parseInt(currQuadId.substr(1));

        // selector for span containing these quadrants
        var spanHandle = $(`#${spanNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${spanNum}|${quadNum}|${t}`;

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, spanNum)) {
            // add to queue
            lineQueue.push(spanNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for relevant quadrant 
            // of relevant line in freq matrix
            quadFreqs[spanNum][quadNum] += 1;

            // use custom formula to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[spanNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;
            
            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                var dbPercentRead = Math.min(dbQuadFreqs[spanNum][4], 100);
                if (percentRead > dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${dbPercentRead}%, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (percentRead <= dbPercentRead) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]}, ${dbPercentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
    
    // CASE 2 - gaze rested on a line, but no specific quadrant
    // -----------------
    } else if (currLineId != '') {        // Gaze not on a line
        // id of `line` span == line number of that span
        var lineNum = currLineId;
        // get a handle on the span corresponding to that line
        var spanHandle = $(`#${lineNum}.line`);     // note `#x.y` instead of `#x .y`

        // record info on line num, quad num, and timestamp
        const t = (new Date()).getTime();
        infoStr = `${lineNum}|NA|${t}`;

        lineNum = parseInt(lineNum);

        // if new line is NOT an outlier, process it. Otherwise don't
        if (lineIsValid(lineQueue, lineNum)) {
            // add to queue
            lineQueue.push(lineNum);       // add to end of array
            // and remove previous oldest from queue (after queue is of length)
            if (lineQueue.length > QUEUE_LENGTH) {
                lineQueue.shift(); // removes first element from array
            }

            // increment entry for quadrants of relevant line in freq matrix
            // custom decision on how to distribute credit by quadrants
            // since we don't know of specific quadrant
            // right now: 4/8, 2/8, 1/8, 1/8 
            
            // console.log(quadFreqs);
            quadFreqs[lineNum][0] += 0.50;
            quadFreqs[lineNum][1] += 0.25;
            quadFreqs[lineNum][2] += 0.125;
            quadFreqs[lineNum][3] += 0.125;

            // use custom formulat to convert frequencies for each
            // quadrant to a single percent read 
            var freqs = quadFreqs[lineNum];
            var normalisedFreq = freqs[0] + freqs[1] + (10*freqs[2]) + (100 * freqs[3]);
            var MAX = 450;
            percentRead = (normalisedFreq / MAX) * 100;

            // use linear gradient with given percent to highlight 
            // the selected span
            // ONLY if we've read >= 10% of line
            if (percentRead >= MIN_PERCENT_READ) {
                if (dbQuadFreqs[lineNum][4] == 0) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[1]}, ${percentRead}%, ${colorLvls[0]})`;
                    spanHandle.css("background", backgroundCSS);
                }
                else if (dbQuadFreqs[lineNum][4] == 1) {
                    var backgroundCSS = `linear-gradient(.25turn, ${colorLvls[3]}, ${percentRead}%, ${colorLvls[2]})`;
                    spanHandle.css("background", backgroundCSS);
                }
            }
        }
                
    // CASE 3 -- gaze did not rest on a line at all
    // -----------------
    } else {
        // record that you weren't looking at a line
        const t = (new Date()).getTime();
        infoStr = `-1|-1|${t}`;                        
    }

    // send info on line num, quad num, and timestamp, back to server
    // console.log(infoStr);
    ws.send(infoStr);

}

/**
 * Function that takes in a list of all the previous quadFreqs at one particular line
 * and returns one quadFreq with all the max values
 * @param {list} quadFreqsList 
 */
function getAverageArray(quadFreqsList) {
    var avg = [0, 0, 0, 0];
    var counter = 0;
    quadFreqsList.forEach(function (item, index) {
        for (var i = 0; i < 4; i++) {
            avg[i] += item[i];
        }
        counter += 1;
    });
    for (var i = 0; i < 4; i++) {
        avg[i] = avg[i] / counter;
    }
    return avg;
}

/**
 * Function that takes in a list of all the previous quadFreqs at one particular line
 * and returns one quadFreq with all the max values
 * @param {list} quadFreqsList 
 */
function getMaxArray(quadFreqsList) {
    var finalArray = [0, 0, 0, 0];
    quadFreqsList.forEach(function (item, index) {
        for (var i = 0; i < 4; i++) {
            finalArray[i] = Math.max(finalArray[i], item[i]);
        }
    });
    return finalArray;
}

/**
 * 
 * @param {*} arr 
 */
function getArrayAverage(arr) {
    var total = 0;
    arr.forEach(function(el) {
        total += el;
    });
    var avg = total / arr.length;
    return avg
}

/**
 * 
 * @param {*} arr 
 */
function lineIsValid(arr, el) {
    if (el >= 0) {
        if (arr.length == 0) {
            return true;
        }
        var avg = getArrayAverage(arr);
        var diff = Math.abs(el - avg);
        const MAX_DIFF = 3;
        return (diff <= MAX_DIFF)
    } else {
        return false
    }
}

/**
 * Returns true if elements in a certain window of an
 * array are sorted in descending order.
 * This is equivalent, in our use case, to the graph
 * of x-coordinates having a negative gradient in a 
 * given window (thus representing line change as
 * eyes scan right to left across a page, as opposed
 * to the usual left to right in reading).
 * @param {array} arr
 */
function hasNegativeGradient(arr) {
    // mark the window you want to check
    var highIdx = arr.length - 1;
    var lowIdx = arr.length - 10;

    // TRYING SOMETHING DIFFERENT:
    // this is still inducing problems
    if ((arr[highIdx] < 300) && (arr[highIdx - 30] > 600)) {
        return true;
    } else {
        return false;
    }


    if (lowIdx < 1) {           // array not long enough for checking
        return false;
    }
    // check given window for any pair that violates condition
    for (var i = highIdx; i > lowIdx; i--) {
        if (arr[i] > arr[i - 1]) {
            return false;
        }
    }
    // condition never violated
    // elements in our current window are in descending order
    return true;
}

function hasPositiveGradient(arr) {
    // mark the window you want to check
    var highIdx = arr.length - 1;
    var lowIdx = arr.length - 10;
    if (lowIdx < 1) {           // array not long enough for checking
        return true;
    }
    // check given window for any pair that violates condition
    for (var i = highIdx; i > lowIdx; i--) {
        if (arr[i] < arr[i - 1]) {
            return false;
        }
    }
    // condition never violated
    // elements in our current window are in descending order
    return true;
}
  



// https://stackoverflow.com/questions/1248081/get-the-browser-viewport-dimensions-with-javascript
// https://stackoverflow.com/questions/35969974/foreach-is-not-a-function-error-with-javascript-array
// https://stackoverflow.com/questions/10935888/highlight-element-that-is-closest-to-middle-of-viewport
// raw html not needed anymore
// var rawHTML = "<html>" + $("html").html() + "</html>";      // NOTE: used only when you actually have this in extension form going
                                                            // grabs the current page's html
