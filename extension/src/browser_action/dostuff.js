/*
// set current url to something else
chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
    chrome.tabs.update(tab.id, {url: "http://www.espn.com/"});
});
*/

// Function to activate the extension
function activateExtension() {
    console.log("RUNNING");
    chrome.tabs.executeScript(null, {file: "js/jquery/jquery.js"});
    chrome.tabs.executeScript(null, {file: "src/inject/inject.js"});
    chrome.tabs.insertCSS(null, { file: "src/inject/inject.css" });
}
document.getElementById('extActivateButton').onclick = activateExtension;
document.getElementById('signup').onclick = signupUser;
document.getElementById('signin').onclick = signinUser;
document.getElementById('signout').onclick = signoutUser;

// Function to sign up
function signupUser() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    chrome.runtime.getBackgroundPage(async (bgPage) => {
        await bgPage.signup(username, password);
        updateRender();
    })
}

// Function to sign in
function signinUser() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    chrome.runtime.getBackgroundPage(async (bgPage) => {
        await bgPage.signin(username, password);
        updateRender();
    })
}

// Function to sign out
function signoutUser() {
    chrome.runtime.getBackgroundPage((bgPage) => {
        bgPage.signout();
    });
    updateRender();
}

// Function to update the popup rendering
function updateRender() {
    console.log("updating!");
    chrome.runtime.getBackgroundPage((bgPage) => {

        let username = bgPage.getUser();
        console.log(username);

        if (bgPage.getAuth()) { // Getting authentication from 'background.js'
            document.getElementById("test").innerHTML = `You are signed in as ${username}!`; 
            document.getElementById("mainPopup").style.backgroundColor = 'green';
            document.getElementById("login").style.display = "none";
            document.getElementById("login2").style.display = "block"; 

        }
        else {
            document.getElementById("test").innerHTML = "You are NOT signed in!";   
            document.getElementById("mainPopup").style.backgroundColor = 'white'; 
            document.getElementById("login").style.display = "block"; 
            document.getElementById("login2").style.display = "none"; 
        }
    });
}

updateRender();