const fetch = require("node-fetch");
const fs = require("fs");
const converter = require("html-to-text");
const jsonFile = "./.data/items.json";

const getItems = (guid) => {
  try {
    const fileContents = fs.readFileSync(jsonFile, { encoding: "utf8" });
    const json = JSON.parse(fileContents);

    if (guid) {
      return json.items.filter((item) => item.guid === guid);
    }

    return json.items;
  } catch (err) {
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

const addToItems = async (title, guid, source) => {
  try {
    const allItems = getItems();
    const response = await fetch(source);
    const html = await response.text();
    const contents = converter.convert(html.replace('</body>','').replace('</html>',''));

    if (allItems.findIndex((item) => item.guid === guid) > -1) {
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

const search = (query) => {
  try {
    let allItems = getItems();
    const fullMatchRegex = new RegExp(query.trim(), "gi");
    const fullMatches = allItems
      .filter((item) => item.contents.match(fullMatchRegex))
      .sort(
        (a, b) =>
          b.contents.match(fullMatchRegex).length -
          a.contents.match(fullMatchRegex).length
      );
    allItems = allItems.filter(item => !fullMatches.includes(item)); // So we don't double-up results
    const partialMatchRegex = new RegExp(`(${query.trim().replace(/ /g, "|")})`, "gi");
    const partialMatches = allItems
      .filter((item) => item.contents.match(partialMatchRegex))
      .sort(
        (a, b) =>
          b.contents.match(partialMatchRegex).length -
          a.contents.match(partialMatchRegex).length
      );
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
