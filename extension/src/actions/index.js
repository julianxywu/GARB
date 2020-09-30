import axios from 'axios';

const ROOT_URL = 'http://localhost:9090/api';
// const ROOT_URL = 'https://garb-user-pagesession.herokuapp.com/';
// const API_KEY = '?key=julian_wu';

// keys for actiontypes
export const ActionTypes = {
  FETCH_PAGESESSION: 'FETCH_PAGESESSION',
  UPDATE_PAGESESSION: 'UPDATE_PAGESESSION',
  CREATE_PAGESESSION: 'CREATE_PAGESESSION',
  DELETE_PAGESESSION: 'DELETE_PAGESESSION',
  ERROR_SET: 'ERROR_SET',
  ERROR_CLEAR: 'ERROR_CLEAR',
  AUTH_USER: 'AUTH_USER',
  DEAUTH_USER: 'DEAUTH_USER',
  AUTH_ERROR: 'AUTH_ERROR',
};

export function fetchPosts() {
  // ActionCreator returns a function
  // that gets called with dispatch
  // remember (arg) => { } is a function
  return (dispatch) => {
    axios.get(`${ROOT_URL}/posts`)
      .then((response) => {
        // once we are done fetching we can dispatch a redux action with the response data
        dispatch({ type: ActionTypes.FETCH_POSTS, payload: response.data });
        // console.log(response.data);
      })
      .catch((error) => {
        // whaaat?
        // dispatch an error, use it in a separate error reducer. this is the beauty of redux.
        // have an error component somewhere show it
        dispatch({ type: ActionTypes.ERROR_SET, error });
        // might you also want an ERROR_CLEAR action?
      });
  };
}

export function fetchPost(id) {
  return (dispatch) => {
    axios.get(`${ROOT_URL}/posts/${id}`)
      .then((response) => {
        dispatch({ type: ActionTypes.FETCH_POST, payload: response.data });
      })
      .catch((error) => {
        dispatch({ type: ActionTypes.ERROR_SET, error });
      });
  };
}

export function createPageSession(pageSession, history) {
  const fields = {
    url: pageSession.url, title: pageSession.title, user: pageSession.user, timestampStart: pageSession.timestampStart,
    timestampEnd: pageSession.timestampEnd, sessionClosed: pageSession.sessionClosed, quadFreqs: pageSession.quadFreqs,
  };
  return (dispatch) => {
    axios.post(`${ROOT_URL}/posts`, fields, { headers: { authorization: localStorage.getItem('token') } })
      .then((response) => {
        dispatch({ type: ActionTypes.CREATE_POST, payload: response.data });
        history.push('/');
      })
      .catch((error) => {
        dispatch({ type: ActionTypes.ERROR_SET, error });
      });
  };
}

export function updatePost(post) {
  const fields = {
    title: post.title, content: post.content, coverUrl: post.coverUrl, tags: post.tags,
  };
  return (dispatch) => {
    axios.put(`${ROOT_URL}/posts/${post.id}?`, fields, { headers: { authorization: localStorage.getItem('token') } })
      .then((response) => {
        dispatch({ type: ActionTypes.UPDATE_POST, payload: response.data });
      })
      .catch((error) => {
        dispatch({ type: ActionTypes.ERROR_SET, error });
      });
  };
}

// trigger to deauth if there is error
// can also use in your error reducer if you have one to display an error message
export function authError(error) {
  return {
    type: ActionTypes.AUTH_ERROR,
    message: error,
  };
}

export function signinUser({ email, username, password }, history) {
  const fields = { email, username, password };
  return (dispatch) => {
    axios.post(`${ROOT_URL}/signin`, fields)
      .then((response) => {
        dispatch({ type: ActionTypes.AUTH_USER, payload: response.data });
        localStorage.setItem('token', response.data.token);
        history.push('/');
      })
      .catch((error) => {
        dispatch(authError(`Sign In Failed: ${error.response.data}`));
      });
  };
  // takes in an object with email and password (minimal user object)
  // returns a thunk method that takes dispatch as an argument (just like our create post method really)
  // does an axios.post on the /signin endpoint
  // on success does:
  //  dispatch({ type: ActionTypes.AUTH_USER });
  //  localStorage.setItem('token', response.data.token);
  // on error should dispatch(authError(`Sign In Failed: ${error.response.data}`));
}

export function signupUser({ email, username, password }, history) {
  const fields = { email, username, password };
  return (dispatch) => {
    axios.post(`${ROOT_URL}/signup`, fields)
      .then((response) => {
        dispatch({ type: ActionTypes.AUTH_USER, payload: response.data });
        localStorage.setItem('token', response.data.token);
        history.push('/');
      })
      .catch((error) => {
        dispatch(authError(`Sign Up Failed: ${error.response.data}`));
      });
  };

  // takes in an object with email and password (minimal user object)
  // returns a thunk method that takes dispatch as an argument (just like our create post method really)
  // does an axios.post on the /signup endpoint (only difference from above)
  // on success does:
  //  dispatch({ type: ActionTypes.AUTH_USER });
  //  localStorage.setItem('token', response.data.token);
  // on error should dispatch(authError(`Sign Up Failed: ${error.response.data}`));
}


// deletes token from localstorage
// and deauths
export function signoutUser(history) {
  return (dispatch) => {
    localStorage.removeItem('token');
    dispatch({ type: ActionTypes.DEAUTH_USER });
    history.push('/');
  };
}
