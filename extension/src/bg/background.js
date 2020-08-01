/**************** YOUR CODE ****************/

// https://stackoverflow.com/questions/55637406/how-to-remove-this-cross-origin-read-blocking-corb-blocked-cross-origin-respo
// https://www.chromium.org/Home/chromium-security/extension-content-script-fetches
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
// https://developer.chrome.com/extensions/background_pages
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
// https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Fetching_data
// https://developer.chrome.com/extensions/runtime#method-sendMessage
// https://scotch.io/tutorials/how-to-use-the-javascript-fetch-api-to-get-data
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.contentScriptQuery == "extractURLContent") {
        var url = "https://mysterious-fortress-86319.herokuapp.com/";
        fetch(url, {
            method: "POST",
            mode: "cors", // no-cors, cors, *same-origin
            credentials: "same-origin", // include, *same-origin, omit
            headers: {
                "Content-Type": "text/plain",
                // "Content-Type": "application/x-www-form-urlencoded",
            },
            redirect: "follow", // manual, *follow, error
            referrer: "no-referrer", // no-referrer, *client
            body: request.data, // body data type must match "Content-Type" header
        })
        .then((resp) => resp.json()) // Transform the data into json
        .then(function(data) {
            sendResponse(data);
          })
        .catch(error => console.log(error))
        return true;  // Will respond asynchronously.
      }
    });


/**************** PRE SET ****************/

// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });


//example of using a message handler from the inject scripts
// chrome.extension.onMessage.addListener(
//   function(request, sender, sendResponse) {
//   	chrome.pageAction.show(sender.tab.id);
//     sendResponse();
//   });

// chrome.browserAction.onClicked.addListener(function(activeTab) {
//   chrome.tabs.executeScript(null, {file: "content.js"});
// });s
