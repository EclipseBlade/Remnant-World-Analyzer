let bossInfo = null;
let dungeonInfo = null;
let minibossInfo = null;
let siegeInfo = null;

async function submitForm(event) {
  event.preventDefault();
  const file = $("#formFile")[0].files[0];

  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = async () => {
    try {
      // Currently the user has to select whether they want to analyze campaign or adventure, but the program should be able to tell
      // The option will probably be removed in the future though it does make the program more efficient to leave it
      if ($("#modeSelect").val() === "1") {
        // analyzeCampaign(reader.result);
        $("#modeSelect").addClass("is-invalid");
      } else {
        $("#modeSelect").removeClass("is-invalid");
        await analyzeAdventure(reader.result);
      }
    } catch (error) {
      // To Do Custom Errors and Parsing
      console.log(error);
      $("#formFile").addClass("is-invalid");
    }
  };

  reader.onerror = () => {
    console.log(reader.error);
    $("#formFile").addClass("is-invalid");
  };
}

// TODO complete campain analysis
function analyzeCampaign(fileText) {}

async function analyzeAdventure(fileText) {
  // Adventure mode save file items and events can be read after the last mention of "Adventure"
  // hzla found this trick and used it in his analyzer
  const startIndex = fileText.lastIndexOf("Adventure");
  if (startIndex === -1) {
    throw new Error("Invalid File Input");
  }

  // Unfortunately, the game occasionally splits the items/events over multiple lines, so we can't just read the line of "Adventure"
  // Instead we find the last mention of an item or event which will always begin with "Game/World_@/Quests/Quest_" where @ is the world and * is the type of event
  const endIndex = fileText.indexOf(
    "\n",
    fileText.lastIndexOf("/Quests/Quest_")
  );
  if (endIndex === -1 || endIndex <= startIndex) {
    throw new Error("Invalid File Input");
  }

  // Remember each item/event will start with Game so we can split the string by the delimeter "Game" to get them
  const advText = fileText.substring(startIndex, endIndex).split(/Game/g);
  // console.log(advText);

  // The first element of the list is not an item or an event but it does contain some descriptors for the adventure mode including which world was chosen
  const world = getWorld(advText[0].split(/_/)[1]);
  const worldEvents = [];
  // All the event information is stored in jsons
  const bossInfo = await getBossInfo();
  const dungeonInfo = await getDungeonInfo();
  const minibossInfo = await getMinibossInfo();
  const siegeInfo = await getSiegeInfo();

  // Now time to analyze what's going in this world
  for (let i = 1; i < advText.length; i++) {
    const eventInfo = advText[i].split(/\/Quest_/)[1].split(/_/);
    // console.log(eventInfo);

    // The event text must be switched to lowercase because sometimes the save file uses MiniBoss and other times it uses Miniboss
    switch (eventInfo[0].toLowerCase()) {
      // An event in this case is usual an item, but there are a few outliers like the sketterling temple
      case "event":
        const itemEvent = {};
        // In the case of a sketterling temple, it is possible to identify the color by checking if the save file contains armored bugs or not
        // At the moment, it does not seem possible to identify the drop of the red beetle
        if (eventInfo[1].toLowerCase() === "Sketterling") {
          itemEvent.eventType = "Sketterling Temple";
          itemEvent.eventName = fileText.includes("Bug_Armored")
            ? (itemEvent.eventName = "Black Vikorian Beetle")
            : (itemEvent.eventName = "Red Vikorian Beetle");
        } else {
          // This is a normal item
          // This is not finished it will be more descriptive later on
          itemEvent.eventType = "Item Drop";
          itemEvent.eventName = eventInfo[1].replace(/([A-Z])/g, " $1").trim();
        }
        worldEvents[worldEvents.length - 1].eventDetails.push(itemEvent);
        break;

      // A boss is the world boss like Singe, Claviger, Ixiillis, or The Ravager
      case "boss":
        if (!(eventInfo[1] in bossInfo)) {
          throw new Error("Invalid Boss: " + eventInfo[1]);
        }
        worldEvents.push(bossInfo[eventInfo[1]]);
        break;

      // A smalld is a side dungeon with no boss or siege at the end like Leto's Lab, The Clean Room, Circlet Hatchery, or Widow's Vestry
      case "smalld":
        if (!(eventInfo[1] in dungeonInfo)) {
          throw new Error("Invalid Dungeon: " + eventInfo[1]);
        }
        worldEvents.push(dungeonInfo[eventInfo[1]]);
        break;

      // A miniboss is a side dungeon with a fogged wall containing a boss like Gorefist, Raze, Canker, or The Warden
      case "miniboss":
        if (!(eventInfo[1] in minibossInfo)) {
          throw new Error("Invalid Miniboss: " + eventInfo[1]);
        }
        worldEvents.push(minibossInfo[eventInfo[1]]);
        break;

      // A siege is a side dungeon with a fogged wall containing no boss like A Tale of Two Liz's, The Lost Gantry, or the Matyr's Sanctuary
      // Interestingly enough, Mar'Gosh's Lair is considered a siege because he is sometimes a boss and sometimes an npc
      case "siege":
        if (!(eventInfo[1] in siegeInfo)) {
          throw new Error("Invalid Siege: " + eventInfo[1]);
        }
        worldEvents.push(siegeInfo[eventInfo[1]]);
        break;

      // A overworldpoi is a point of interest like Mud Tooth, the Monolith, the Abandoned Throne, the Flautist, and the Cryptolith
      // A point of interest is sometimes refered to as a world event
      case "overworldpoi":
        // This is not finished it will be more descriptive later on
        worldEvents.push({
          zone: "Overworld",
          eventDetails: [
            {
              eventType: "Point of Interest",
              eventName: eventInfo[1].replace(/([A-Z])/g, " $1").trim(),
            },
          ],
        });
        break;

      // The cryptolith is a unique point of interest because it spawns the labyrinth that players can traverse to get the labyrinth armor set
      // This indicates that the labyrinth was spawned
      // However, I just use it to add the Soul Link ring if the cryptolith spawned on Rhom
      case "cryptolith":
        if (world === "Rhom") {
          worldEvents[worldEvents.length - 1].eventDetails.push({
            eventType: "Item Drop",
            eventName: "Soul Link",
          });
        }
        break;
      default:
        throw new Error("Invalid Event: " + eventInfo[0]);
    }
  }

  // This is what displays the processed events/items
  // It would be faster to do display the content in the switch statement above but it would also be harder to read and debug
  $("#worldInfo").empty();
  for (const worldEvent of worldEvents) {
    for (const details of worldEvent.eventDetails) {
      $("#worldInfo").append(
        `<tr>
        <td>${world}</td>
        <td>${worldEvent.zone}</td>
        <td>${details.eventType}</td>
        <td>${details.eventName}</td>
        </tr>`
      );
    }
  }
  $("#formFile").removeClass("is-invalid");
  $("#worldDescriptor").show();
}

function getWorld(location) {
  switch (location.toLowerCase()) {
    case "city":
      return "Earth";
    case "wasteland":
      return "Rhom";
    case "jungle":
      return "Yaesha";
    case "swamp":
      return "Corsus";
    case "snow":
      return "Reisum";
    default:
      throw new Error("Invalid Location: " + location);
  }
}

// These just read the data for each category from the json files in the data folder
// Now stored in gobal variables to make sure we only request the data once for each type

// TODO item json dictionary
// function getItemInfo(event) {}

async function getBossInfo() {
  if (bossInfo === null) {
    const response = await fetch(
      "https://eclipseblade.github.io/Remnant-World-Analyzer/data/bosses.json"
    );
    if (!response.ok) {
      throw new Error("Could Not Read Bosses");
    }
    bossInfo = await response.json();
  }
  return bossInfo;
}

async function getDungeonInfo() {
  if (dungeonInfo === null) {
    const response = await fetch(
      "https://eclipseblade.github.io/Remnant-World-Analyzer/data/dungeons.json"
    );
    if (!response.ok) {
      throw new Error("Could Not Read Dungeons");
    }
    dungeonInfo = await response.json();
  }
  return dungeonInfo;
}

async function getMinibossInfo() {
  if (minibossInfo === null) {
    const response = await fetch(
      "https://eclipseblade.github.io/Remnant-World-Analyzer/data/minibosses.json"
    );
    if (!response.ok) {
      throw new Error("Could Not Read Minibosses");
    }
    minibossInfo = await response.json();
  }
  return minibossInfo;
}

async function getSiegeInfo() {
  if (siegeInfo === null) {
    const response = await fetch(
      "https://eclipseblade.github.io/Remnant-World-Analyzer/data/sieges.json"
    );
    if (!response.ok) {
      throw new Error("Could Not Read Sieges");
    }
    siegeInfo = await response.json();
  }
  return siegeInfo;
}

// TODO Points of Interest json dictionary
// function getPointOfInterestInfo(event) {
//   switch (event.toLowerCase()) {
//   }
// }

// These are the names of various zones and sub locations
// I got these from hzla's world analyzer
// Will be deleted later after this project is refined to include all of these areas

// "City Overworld Zone1": "Fairview"
// "City Overworld Zone2": "Westcourt"
// "Wasteland Overworld Zone1": "TheEasternWind"
// "Wasteland Overworld Zone2": "TheScouringWaste"
// "Jungle Overworld Zone1": "TheVerdantStrand"
// "Jungle Overworld Zone2": "TheScaldingGlade"
// "Swamp Overworld Zone1": "TheFetidGlade"
// "Swamp Overworld Zone2": "TheMistFen"
// "Snow Overworld Zone1": "DrolniirWoods"
// "Snow Overworld Zone2": "DeepfrostExpanse"

// Double checked location and events with remnantfromtheashes.wiki.fextralife.com

//  Earth
// RootWraith: "TheHiddenSanctum",
// RootBrute: "SunkenPassage",
// Brabus: "CutthroatChannel",
// RootTumbleweed: "TheTangledPass",
// Splitter: "ResearchStationAlpha",
// RootEnt: "TheChokingHollow",
// RootDragon: "TheAshYard",
// HuntersHideout: "HiddenGrotto",
// MadMerchant: "Junktown",
// LastWill: "Sorrow'sField",
// RootShrine: "TheGallows",
// LizAndLiz: "TheWarren",
// RootCultist: "MarrowPass",

//  Rhom
// SwarmMaster: "TheIronRift",
// HoundMaster: "TheBurrows",
// Sentinel: "ShackledCanyon",
// Vyr: "TheArdentTemple",
// WastelandGuardian: "LoomOfTheBlackSun",
// TheHarrow: "TheBunker",
// TheLostGantry: "ConcourseOfTheSun",
// ArmorVault: "VaultOfTheHeralds",
// TheCleanRoom: "ThePurgeHall",

//  Corsus
// SlimeHulk: "TheDrownedTrench",
// Tyrant: "TheCapillary",
// FlickeringHorror: "HallOfWhispers",
// BarbTerror: "NeedleLair",
// QueensTemple: "IskalTemple",
// SwampGuardian: "TheGrotto",
// Wisp: "CircletHatchery",
// FetidPool: "FetidPools",
// BrainBug: "StrangePass",
// Fatty: " TheShack",

//  Yaesha
// KinCaller: "TheHallOfJudgement",
// BlinkFiend: "Widow'sPass",
// BlinkThief: "VerdantStrand",
// StormCaller: "Heretic'sNest",
// ImmolatorAndZephyr: "WitheringVillage",
// Wolf: "Ravager'sHaunt",
// DoeShrine: "Widow'sVestry",
// WolfShrine: "TempleOfTheRavager",
// TheRisen: "Ahanae'sLament",
// TotemFather: "TheScaldingGlade",
// StuckMerchant: "MerchantDungeon",

//  Reisum
// UrikkiBlademasters: "ValenhagMines",
// ShieldWarden: "Exiles'sTrench",
// BlizzardMage: "WutheringKeep",
// TheJackal: "WildReach",
// WarningTotems: "Magir'sDirge",
// ShamanFlames: "GraveOfTheElders",
// RatRider: "CrimsonHold",
// FrozenLords: "Judgement'sSpear",
// IceSkimmer: "TheFrieranSea",
// CreepersPeeper: "Watcher'sHollow"
