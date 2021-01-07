/**************** YOUR CODE ****************/

// https://stackoverflow.com/questions/55637406/how-to-remove-this-cross-origin-read-blocking-corb-blocked-cross-origin-respo
// https://www.chromium.org/Home/chromium-security/extension-content-script-fetches
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
// https://developer.chrome.com/extensions/background_pages
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
// https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Fetching_data
// https://developer.chrome.com/extensions/runtime#method-sendMessage
// https://scotch.io/tutorials/how-to-use-the-javascript-fetch-api-to-get-data

let authenticated = false;
let authUser = 'testUser';

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.contentScriptQuery == "extractURLContent") {
        //var url = "https://mysterious-fortress-86319.herokuapp.com/";
        var url = "https://garb-eyetracking.herokuapp.com/";
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
      else if (request.contentScriptQuery == "saveToDatabase") {
        alert("inside savetodatabase")
        var url = "https://garb-user-pagesession.herokuapp.com/pageSessions";
        
        //const testData = {
        //    url: 'testURL',
        //    title: 'title',
        //    user: 1,
        //    timestampStart: 0,
        //    timestampEnd: 10,
        //    sessionClosed: true,
        //    quadFreqs: [[10, 10, 10, 10], [11, 11, 11, 11]]
        //  };

        fetch(url, {
            method: "POST",
            mode: "cors", // no-cors, cors, *same-origin
            credentials: "same-origin", // include, *same-origin, omit
            headers: {
                "Content-Type": "application/json",
                // "Content-Type": "application/x-www-form-urlencoded",
            },
            redirect: "follow", // manual, *follow, error
            referrer: "no-referrer", // no-referrer, *client
            body: JSON.stringify(request.data), // body data type must match "Content-Type" header
        })
        .then((resp) => resp.json()) // Transform the data into json
        .then(function(data) {
            sendResponse(data);
          })
        .catch(error => console.log(error))
        return true;  // Will respond asynchronously.
        
        
        // Testing AJAX calls 1
        // console.log("inside request to save");
        // var testData = {
        //   url: 'testURL',
        //   title: 'title',
        //   user: 'user',
        //   timestampStart: 0,
        //   timestampEnd: 10,
        //   sessionClose: true,
        //   quadFreqs: [[10, 10, 10, 10], [11, 11, 11, 11]]
        // }
        
        // const ROOT_URL = 'https://garb-user-pagesession.herokuapp.com/'

        // $.ajax({
        //   url: ROOT_URL,
        //   type: "POST",
        //   data: testData,
        //   contentType: "application/json",
        //   success: function(data) {
        //       console.log('success --> data :', data);  
			  //   },
        //   error: function(xhr, text, err) {
        //       console.log('error: ', err);
        //       console.log('text: ', text);
        //       console.log('xhr: ', xhr);
        //       console.log("there is a problem with the request!")
        //   }
		    // });
	    }
      else if (request.contentScriptQuery == "getFromDatabase") {
        // alert("inside getfromdatabase");

        // Get the user and url
        var user = request.data.user;
        var pageUrl = encodeURIComponent(request.data.url);
        var url = `https://garb-user-pagesession.herokuapp.com/pageSessions/${user}/${pageUrl}`;
        // var url = `https://garb-user-pagesession.herokuapp.com/pageSessions/${user}`;
        alert(url);

        fetch(url, {
            method: "GET",
            mode: "cors", // no-cors, cors, *same-origin
            credentials: "same-origin", // include, *same-origin, omit
            headers: {
                "Content-Type": "application/json",
                // "Content-Type": "application/x-www-form-urlencoded",
            },
            redirect: "follow", // manual, *follow, error
            referrer: "no-referrer", // no-referrer, *client
            // body: JSON.stringify(request.data), // body data type must match "Content-Type" header
        })
        // fetch(url)
        .then((resp) => resp.json()) // Transform the data into json
        .then(function(data) {
          sendResponse(data);
        })
        // .then(function(data) {
        //     sendResponse("hello");
        //     return ("hello");
        //   })
        .catch(error => {
          console.log(error);
          sendResponse(null);
        });
        return true;  // Will respond asynchronously.
      }
      else if (request.contentScriptQuery == "getUser") {
        sendResponse(authUser);
        return true;
      };
    }
);

// AUTHENTICATION

// Getter method for authentication
function getAuth() {
  return authenticated;
}

function getUser() {
  return authUser;
}


// Function to sign up ---------------------------
async function signup(username, password) {
  const fields = {username, password};
  var url = `https://garb-user-pagesession.herokuapp.com/signup`;

  // Fetch request
  fetch(url, {
      method: "POST",
      mode: "cors", // no-cors, cors, *same-origin
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
          "Content-Type": "application/json",
          // "Content-Type": "application/x-www-form-urlencoded",
      },
      redirect: "follow", // manual, *follow, error
      referrer: "no-referrer", // no-referrer, *client
      body: JSON.stringify(fields), // body data type must match "Content-Type" header
  })
  .then((resp) => {
    authenticated = resp.ok;
    authUser = username;
    // document.getElementById("mainPopup").style.backgroundColor = 'green';
  })
  .catch(error => console.log(error));
    // document.getElementById("formLogin").style.display = "none";
  return authenticated;  // Will respond asynchronously.
}


// Function to sign in ------------------------------
async function signin(username, password) {
  const fields = {username, password};
  var url = `https://garb-user-pagesession.herokuapp.com/signin`;

  // Fetch request
  await fetch(url, {
      method: "POST",
      mode: "cors", // no-cors, cors, *same-origin
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
          "Content-Type": "application/json",
          // "Content-Type": "application/x-www-form-urlencoded",
      },
      redirect: "follow", // manual, *follow, error
      referrer: "no-referrer", // no-referrer, *client
      body: JSON.stringify(fields), // body data type must match "Content-Type" header
  })
  .then((resp) => {
    authenticated = resp.ok;
    authUser = username;
  })
  .catch(error => console.log(error));
  return authenticated;  // Will respond asynchronously.
}

function signout() {
  authenticated = false;
}


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
