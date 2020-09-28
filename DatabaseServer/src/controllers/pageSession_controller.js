import PageSession from '../models/pageSession_model';
import User from '../models/user_model';

export const createPageSession = (req, res) => {
  const pageSession = new PageSession();
  pageSession.url = req.body.url;
  pageSession.title = req.body.title;
  pageSession.users = [req.body.user];
  pageSession.save()
    .then((result) => {
      res.json({ message: 'PageSession created!' });
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

// requires the userID, to get all the pages of a certain user
// required inputs:
//  - user's username...?
export const getPageSessions = (req, res) => {
  // const currUser = User.findOne({username: req.body.username})
  PageSession.find({_id: { $in: req.body.id}})
    .then((result) => {
      res.json(result);
    });
};

// get a single page with its url
// export const getPage = (req, res) => {
//   Page.findOne({url: req.body.url})
//     .then((result) => {
//       res.json(result);
//     });
// };

export const deletePageSession = (req, res) => {
  Page.findOneAndRemove({ url: req.params.url })
    .then((result) => {
      res.json('Deleted page!');
    });
};

// req.body includes:
// 1. url
// 2. title
// 3. [users] array
export const updatePage = (req, res) => {
  Page.findOneAndUpdate({ url: req.body.url }, req.body)
    .then((result) => {
      res.json('Updated page!');
    });
};

// req.body includes:
// 1. url
// 2. new user's ID
export const addUserToPage = (req, res) => {
    Page.updateOne(
      { url: req.body.url },
      { $push: {users: req.body.userID} })
      .then((result) => {
        res.json('Added user to page!');
      });
}
