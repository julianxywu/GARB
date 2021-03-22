/*
// set current url to something else
chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
    chrome.tabs.update(tab.id, {url: "http://www.espn.com/"});
});
*/

var authResult;

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
document.getElementById('mode1').onclick = changeMode.bind(this, [1]);
document.getElementById('mode2').onclick = changeMode.bind(this, [2]);
document.getElementById('mode3').onclick = changeMode.bind(this, [3]);
document.getElementById('mode4').onclick = changeMode.bind(this, [4]);
document.getElementById('mode5').onclick = changeMode.bind(this, [5]);
document.getElementById('mode6').onclick = changeMode.bind(this, [6]);
document.getElementById('mode7').onclick = changeMode.bind(this, [7]);
document.getElementById('mode8').onclick = changeMode.bind(this, [8]);
document.getElementById('mode9').onclick = changeMode.bind(this, [9]);
document.getElementById('mode10').onclick = changeMode.bind(this, [10]);

function changeMode(i) {
    console.log(i);
    chrome.runtime.getBackgroundPage(async (bgPage) => {
        await bgPage.sendMode(i);
    });
    // if (i == 1) {
    //     console.log("changing mode to 1");
    //     chrome.runtime.getBackgroundPage(async (bgPage) => {
    //         await bgPage.sendMode(1);
    //     });
    // } else if (i == 2) {
    //     console.log("changing mode to 2");
    //     chrome.runtime.getBackgroundPage(async (bgPage) => {
    //         await bgPage.sendMode(2);
    //     });
    // } else {
    //     console.log("NO MODE");
    // }
}

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
        console.log(bgPage.getAuthCode());
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
        let authenticated = bgPage.getAuth();
        let authCode = bgPage.getAuthCode();
        console.log(username);
        
        // Error code for unauthorized / resource not found
        if (authCode == 401 || authCode == 404 || authCode == 400) {
            setColor("signInMessage", "red");
            setText("signInMessage", "Your login credentials are incorrect. Please try again.");

        } 
        // Successful login
        else if (authCode == 200 || authCode == 0) {
            setText("signInMessage", "");
        }
        // Unsucessful sign up
        else if (authCode == 422) {
            setColor("signInMessage", "red");
            setText("signInMessage", "That username already exists.");
        } else {
            setColor("signInMessage", "red");
            setText("signInMessage", "Something has gone wrong. Please try again.");

        }

        // Changing styling based on authentication
        if (authenticated) { // Getting authentication from 'background.js'
            document.getElementById("signInMessage").innerHTML = `You are signed in as ${username}!`; 
            setColor("signInMessage", "black")
            document.getElementById("mainPopup").style.backgroundColor = 'green';
            document.getElementById("login").style.display = "none";
            document.getElementById("login2").style.display = "block";
        }
        else {
            document.getElementById("mainPopup").style.backgroundColor = 'white'; 
            document.getElementById("login").style.display = "block";
            document.getElementById("login2").style.display = "none";
        }
    });
}

updateRender();

// HELPER FUNCTIONS

function setColor(id, color) {
    document.getElementById(id).style.color = color;
}

function setText(id, text) {
    document.getElementById(id).innerHTML = text;
}