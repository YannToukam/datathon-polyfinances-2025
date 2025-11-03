from apis.api_news import apiNews
from apis.api_reddit import apiReddit
from apis.api_x import apiX

class Apis:
    def __init__(self):
        self.api_news = apiNews()
        self.api_reddit = apiReddit()
        self.api_x = apiX()

    def set_all_keywords(self, keywords: list[str]):
        self.api_news.setKeywords(keywords)
        self.api_reddit.setKeywords(keywords)
        self.api_reddit.setSubreddits(keywords)
        self.api_x.setKeywords("".join(keywords))

    def create_all_files(self):
        news_data = self.api_news.createFiles()
        reddit_data = self.api_reddit.createFile()
        x_data = self.api_x.createFile()

apis = Apis()