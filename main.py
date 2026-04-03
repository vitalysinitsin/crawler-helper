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
            content = page.content()
            print(content)
            page.wait_for_load_state('networkidle')
            print(f'All links from: "{page.title()}"')
            print('--------------------------------------------')

            links = page.locator('a').all()
            for link in links:
                print(f'{link.get_attribute('href')}', end="\n\n")

    except requests.exceptions.RequestException:
        print("Invalid URL. Please try again.")
        continue
