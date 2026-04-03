import requests
from bs4 import BeautifulSoup

while True:
    url = input("Enter URL to crawl or press q to quit: ")

    # exit
    if url.lower() == "q":
        break

    # try input url
    try:
        # request
        fixedUrl = url if url.startswith("http") else f"https://{url}"
        response = requests.get(fixedUrl)

        # crawl
        soup = BeautifulSoup(response.content, "html.parser")
        print(soup.find('title').string)

    except requests.exceptions.RequestException:
        print("Invalid URL. Please try again.")
        continue
