from dotenv import load_dotenv
import boto3
load_dotenv()  # reads .env file

s3 = boto3.client("s3")
print(s3.list_buckets())
