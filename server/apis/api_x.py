import requests
from dotenv import load_dotenv
import os
from helper import Helper
import json

class apiX:
    def init(self):
        ENV_PATH = "../../api_x.env"
        load_dotenv(dotenv_path=ENV_PATH)
        self.BEARER_TOKEN = os.getenv("BEARER_TOKEN")
        self.url = "https://api.x.com/2/tweets/search/recent"

    def getTweets(self, keywords: str):
        headers = {
            "Authorization": f"Bearer {self.BEARER_TOKEN}"
        }

        params = {
            "query": keywords,
            "max_results": 10,
            "tweet.fields": "text"
        }

        response = requests.get(self.url, headers=headers, params=params)
        if response.status_code != 200:
            raise Exception(f"Request returned {response.status_code}: {response.text}")

        data = response.json()

        return data

if __name__ == "__main__":
    x = apiX()

    data = x.getTweets("money")

    file_name = "x.json"

    with open(file_name, 'w') as json_file:
        json.dump(data, json_file, indent=4)

    helper = Helper()
    helper.sendDataToBucket(source="x", file_path=file_name)

    os.remove(file_name)

