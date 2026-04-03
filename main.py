import requests
from playwright.sync_api import sync_playwright

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
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            page.goto(fixedUrl)
            print(f'Title: "{page.title()}"', end="\n\n")
            print('--------------------------------------------')

            # for link in links:
            #     print(f'{link["href"]}', end="\n\n")

    except requests.exceptions.RequestException:
        print("Invalid URL. Please try again.")
        continue
