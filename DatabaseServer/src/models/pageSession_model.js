import mongoose, { Schema } from 'mongoose';

// create a PostSchema with a title field
const PageSchema = new Schema({
  url: String,
  title: String,
  user: String,
  timestampStart: Date,
  timestampEnd: Date,
  sessionClosed: Boolean,
  quadFreqs: [[]],
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
  timestamps: true,
});

// create PostModel class from schema
const PageModel = mongoose.model('PageSession', PageSchema);

export default PageModel;


/*

Example User:

{
    _id: 1,
    email: 'John@gmail.com',
    password: 'password123',
    name: 'John Smith',
}

Example PageSessions:

{
    _id: 4,
    url: 'https://en.wikipedia.org/wiki/Dartmouth_College',
    title: 'Dartmouth College',
    users: 'userID',
    timestampStart: '',
    timestampEnd: '',
    sessionClosed: '',
    quadFreqs: [ [] [] [] [], [] [] [] [], ... ],   //only for the current session
}

Start event (timestamps)
Last event (timestamps)
sessionClosed (Boolean)
   - Frontend (close tab, navigate away)
   - Timeout

On start of new session:
  - Make sure all old sessions have been closed

const usersCollection = db.users;
const pagesCollection = db.pages;

// Find all pages read/used by a user
const currUser = usersCollection.findOne({username: "JohnSmith"});
const pagesReadByJohn = pagesCollection.find({ _id: { $in: currUser.pages } }).toArray();

// Find all users who have read/used a page
const currPage = pagesCollection.findOne({url: "https://en.wikipedia.org/wiki/Dartmouth_College"});
const usersWhoReadThisPage = usersCollection.find({ _id: { $in: currPage.users } }).toArray();

*/