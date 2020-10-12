
all: 

deployhtml:
	heroku git:remote -a garb-eyetracking && git subtree push --prefix HTMLExtractionServer heroku master

deploynode:
	heroku git:remote -a garb-user-pagesession && git subtree push --prefix DatabaseServer heroku master
