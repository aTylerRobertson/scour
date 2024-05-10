# scour

👋 Good evening, internet sickos. This is an experiment I've been working with off and on for several months, spurred into 1.0 by the recent announcement that Duck Duck Go (my usual search engine of choice) has joined the artificial intelligence brigade with an AI chatbot. As capitalism has borne out that the addition of AI to a product is a omen of anti-labor acts to come, I believe I can safely say: this is a bad idea. 

What I'd like to propose is a step in fully the opposite direction: let's add friction to the internet. Instead of crawlers and spiders and robots trawling the internet for hashtag #content, let's become internet gardeners ([again](https://csszengarden.com)). Scour is a tool meant to do that: create a search platform using only websites that I manually add to a list. No ads, no algorithms, no AI.

The goals are to:

1. Let you quickly add webpages _(note: individual **pages** — not crawling whole sites)_
2. Let you search the contents of the pages you've added
3. Give access to cached versions of the added pages
4. Create an RSS feed of the pages as you add them

The idea here being that you can whip up a site with a few steps, begin adding pages, share the link with friends, and they can follow along as your site becomes more useful with time.

## getting started

The quickest way to start with Scour would be on [Glitch](https://glitch.com), where I host most of my projects. You can click [this link](https://glitch.com/edit/#!/remix/scour) to spin up a brand new site with your own unique URL and everything.

If you're a mad lad who wants to run things locally, make sure you've installed [Node](https://nodejs.org/en/download) v16 at least, and then you can open a terminal and run these commands to start the server instead:

- `npm install`
- `npm start`

Either way, you'll then want to create a new file named `.env`, and in it enter the text `key=` followed by some secret password. That key lets the site know that you're allowed to add pages to the collection! 

Then, there's two other files you'll want to get into and edit:

1. `src/seo.json`: this is where you'll set your site's name, description, and other information.
2. `src/pages/about.hbs`: this is the about page for the site, and you may feel like removing my ramblings.

After that, the site is yours to play around with as you like! I've tried to put comments in most places, which will hopefully help point out any tricky bits. 

## adding new pages

Remember that key value you created earlier? Head to `/new?key={That key value}` to start adding!

### bookmarklet

It's important to me that adding new items be as easy as possible, so the `/new` page also includes a javascript bookmarklet, which you can add to your browser's bookmarks. Whenever you come to a page on the internet that you'd like to save, you can click the bookmark and a new tab or window will open with the page's information loaded automatically. Make adjustments as needed, then click "submit". On a success, the item will get added to your site, and the tab/window will close so you can keep browsing.

## editing/removing items

All saved items are stored in `.data/items.json`, so to remove something you can log into Glitch (or wherever you're hosting this) and edit that file directly.