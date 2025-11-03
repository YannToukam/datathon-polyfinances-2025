from apis.api_news import ApiNews
from apis.api_reddit import ApiReddit
from apis.api_x import ApiX

class Apis:
    def __init__(self):
        self.api_news = ApiNews()
        self.api_reddit = ApiReddit()
        self.api_x = ApiX()

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
print(apis.api_x.BEARER_TOKEN)