from goose3 import Goose

if __name__ == "__main__":
     with open('nyt_article_html.txt', 'r') as myfile:
        data=myfile.read().replace('\n', '')
        g = Goose(config={'enable_image_fetching': True})
        article = g.extract(raw_html=data)
        print(article.cleaned_text)