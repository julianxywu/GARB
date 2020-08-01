/*
// set current url to something else
chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
    chrome.tabs.update(tab.id, {url: "http://www.espn.com/"});
});
*/

function activateExtension() {
    console.log("RUNNING");
    chrome.tabs.executeScript(null, {file: "js/jquery/jquery.js"});
    chrome.tabs.executeScript(null, {file: "src/inject/inject.js"});
    chrome.tabs.insertCSS(null, { file: "src/inject/inject.css" });
}

document.getElementById('extActivateButton').onclick = activateExtension;