const fetch = require("node-fetch");
const fs = require("fs");
const converter = require("html-to-text");
const jsonFile = "./.data/items.json";

// Get all items from the JSON file and return them as an array
const getItems = (guid) => {
  try {
    const fileContents = fs.readFileSync(jsonFile, { encoding: "utf8" });
    const json = JSON.parse(fileContents);

    if (guid) {
      return json.items.filter((item) => item.guid === guid);
    }

    return json.items;
  } catch (err) {
    // Create a new item if there's nothing there currently
    fs.writeFileSync(jsonFile, JSON.stringify({
      "items": [
        {
          "title": "Hello, world!",
          "source": `https://${process.env.PROJECT_DOMAIN}.glitch.me/about`,
          "contents": "Your guide to getting set up!",
          "added": "Sun, 1 Jan 2023 12:00:00 GMT"
        }
      ]
    }));
    getItems(guid);
  }
};

// Add a new item to the collection
const addToItems = async (title, guid, source) => {
  try {
    const allItems = getItems();
    // Fetch the page URL and grab its text content
    const response = await fetch(source);
    const html = await response.text();
    
    // Sometimes pages will drop a closing body or html tag too soon, so let's ditch those
    const contents = converter.convert(html.replace('</body>','').replace('</html>',''));

    if (allItems.findIndex((item) => item.guid === guid) > -1) {
      // the guid value should be unique for each page saved
      throw new Error(`guid ${guid} already in use`);
    } else {
      const date = new Date();
      allItems.push({
        title,
        guid,
        source,
        contents,
        added: date.toUTCString(),
      });

      fs.writeFileSync(jsonFile, JSON.stringify({ items: allItems }), {
        encoding: "utf8",
      });
      console.log("New Item Added:", allItems[allItems.length - 1]);
    }
  } catch (err) {
    throw new Error(`Could not add item: ${err}`);
  }
};

// Search the items and return matches
const search = (query) => {
  try {
    let allItems = getItems();
    // Look for matches of the full text (not case-sensitive)
    const fullMatchRegex = new RegExp(query.trim(), "gi");
    const fullMatches = allItems
      .filter((item) => item.contents.match(fullMatchRegex))
      .sort(
        (a, b) =>
          b.contents.match(fullMatchRegex).length -
          a.contents.match(fullMatchRegex).length
      );
    // Remove those matches from the list, to avoid doubling up on results
    allItems = allItems.filter(item => !fullMatches.includes(item));
    // Look for partial matches (i.e. searching for "jelly donuts" should return pages with either "jelly" or "donuts" in them)
    const partialMatchRegex = new RegExp(`(${query.trim().replace(/ /g, "|")})`, "gi");
    const partialMatches = allItems
      .filter((item) => item.contents.match(partialMatchRegex))
      .sort(
        (a, b) =>
          b.contents.match(partialMatchRegex).length -
          a.contents.match(partialMatchRegex).length
      );
    
    // Combine and format the results
    const results = [...fullMatches, ...partialMatches];
    results.forEach((item) => {
      const regex = new RegExp(`[^\n]*(?:${query.replace(/ /g, "|")})[^\n]*`, "i");
      const excerpt = item.contents.match(regex)[0].replace(partialMatchRegex,"<b>$1</b>");
      item.excerpt = excerpt;
    });
    
    return {
      results,
      full: fullMatches.length || 0,
      partial: partialMatches.length || 0
    }
  } catch (err) {
    throw new Error(`Could not search for ${query}: ${err}`);
  }
};

// This was a thing I was playing with that would list the most popular words in the collection (to inspire searches)
// but it's really slow and I didn't like it as much as I thought I would
const wordCloud = () => {
  const commonWords = ["you","the","and","she","them","they","his","hers","our","your","for","this","that","because","with","either"];
  try {
    const allItems = getItems();
    const cloud = [];
    for (const item of allItems) {
      const words = item.contents.toLowerCase().split(' ').filter(word => !/[^A-Z]/i.test(word) && word.length > 2 && !commonWords.includes(word));
      words.push(...item.title.toLowerCase().split(' ').filter(word => !/[^A-Z]/i.test(word) && word.length > 2 && !commonWords.includes(word)))
      for (const word of words) {
        const obj = cloud.find(w => w.word == word)
        if (obj) {
          obj.count++;
        } else {
          cloud.push({
            word,
            count: 1
          });
        }
      }
    }
    return cloud.sort((a,b) => b.count - a.count).slice(0,9);
  } catch (err) {
    console.log(err);
    return [];
  }
}

module.exports = {
  getItems,
  addToItems,
  search,
  wordCloud
};
