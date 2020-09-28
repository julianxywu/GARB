# Julian Wu
## Lab 5-1 - Redux Platform + Server
## May 2020

### 1. What did we do?
In this lab, we created the server side, working with the routes and the CRUD commands. Each post and its data is now saved in an online Mongo Database, hosted by Heroku. We used React along with Redux on the front-end. There is also authentication where users are required to sign up/sign in in order to add posts of their own and each post has their username on it!

### 2. What worked/didn't work?
This lab was not that difficult. The CRUD commands were pretty easy to write and figure out, especially when we're given an example. The hardest parts were linking Heroku properly to our lab 4, but it works now! Authentication was pretty cool! I didn't have a lot of time to add in "flair" but it was quite straightforward. The hardest part was probably understanding what the code in Passport.js does.

### 3. Extra Credit
- __Tag Array:__ My tags are taken and split into arrays, which is used in the search functionality described below!
- __Search Support:__ My posts can be searched by tags! It automatically takes the tags in each post, splits them into arrays, and uses a string matching set of functions to display posts that have matching tags!

