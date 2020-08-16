from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from goose3 import Goose

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
app.config["DEBUG"] = True

@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def content_extractor():
    if request.method == 'GET':
        return "<h1>Yes, the server's running</h1>"
    if request.method == 'POST':
        # to handle the absurd CORS problems - figure out how to do JSON
        data = str(request.data, encoding='utf-8')

        # actual content extraction
        url = data
        g = Goose(config={'enable_image_fetching': True})
        article = g.extract(url=url)
        # when you have in extension form, `data` will be the targetSiteURL's
        # raw html. Hence you'll have the following commansds:
            # raw_html = data
            # article = g.extract(raw_html=raw_html)
        # Right now, though, goose handles getting the html

        # if image available send that also
        img_src = ""
        if article.top_image:
            img_src = article.top_image.src

        res_dict = {
            'title': article.title,
            'img_src': img_src,
            'content': article.cleaned_text
        }
        response = jsonify(res_dict)
        return response

app.run()