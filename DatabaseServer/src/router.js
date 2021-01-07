import { Router } from 'express';
// import * as Posts from './controllers/post_controller';
import * as UserController from './controllers/user_controller';
import { requireAuth, requireSignin } from './services/passport';
import * as PageSessions from './controllers/pageSession_controller';


const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'welcome to the GARB back-end!' });
});

router.post('/signin', requireSignin, UserController.signin);

router.post('/signup', UserController.signup);

router.route('/pageSessions')
	.post(PageSessions.createPageSession);

router.post('/', function(req, res){
	var data = res.body;
	console.log("RES");
	console.log(data);
})

router.route('/pageSessions/:user/:url')
	// .get(PageSessions.getPageSession)
	.get(PageSessions.getPageSessions);

//router.route('/pageSessions/:user')
//	.get(PageSessions.getPageSession);

// your routes will go here
// router.route('/posts')
//   .post(requireAuth, Posts.createPost)
//   .get(Posts.getPosts);

// router.route('/posts/:id')
//   .get(Posts.getPost)
//   .put(requireAuth, Posts.updatePost)
//   .delete(requireAuth, Posts.deletePost);


export default router;
