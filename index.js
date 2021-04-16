// const mainLocations = {
//   "City Overworld Zone1": "Fairview",
//   "City Overworld Zone2": "Westcourt",
//   "Wasteland Overworld Zone1": "TheEasternWind",
//   "Wasteland Overworld Zone2": "TheScouringWaste",
//   "Jungle Overworld Zone1": "TheVerdantStrand",
//   "Jungle Overworld Zone2": "TheScaldingGlade",
//   "Swamp Overworld Zone1": "TheFetidGlade",
//   "Swamp Overworld Zone2": "TheMistFen",
//   "Snow Overworld Zone1": "DrolniirWoods",
//   "Snow Overworld Zone2": "DeepfrostExpanse",
// };

function submitForm(event) {
  event.preventDefault();
  const file = $("#formFile")[0].files[0];

  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function () {
    try {
      if ($("#modeSelect").val() === "1") {
        // analyzeCampaign(reader.result);
        $("#modeSelect").addClass("is-invalid");
      } else {
        $("#modeSelect").removeClass("is-invalid");
        analyzeAdventure(reader.result);
      }
    } catch (error) {
      console.log(error);
      $("#formFile").addClass("is-invalid");
    }
  };

  reader.onerror = function () {
    console.log(reader.error);
    $("#formFile").addClass("is-invalid");
  };
}

// TODO complete campain analysis
// function analyzeCampaign(fileText) {}

function analyzeAdventure(fileText) {
  const startIndex = fileText.lastIndexOf("Adventure");
  if (startIndex === -1) {
    throw new Error("Invalid File Input");
  }

  const endIndex = fileText.indexOf(
    "\n",
    fileText.lastIndexOf("/Quests/Quest_")
  );
  if (endIndex === -1 || endIndex <= startIndex) {
    throw new Error("Invalid File Input");
  }

  const advText = fileText.substring(startIndex, endIndex).split(/Game/g);

  if (advText === null) {
    throw new Error("Invalid File Input");
  }

  // console.log(advText);

  const zone = getZone(advText[0].split(/_/)[1]);

  const worldEvents = [];
  for (let i = 1; i < advText.length; i++) {
    const eventInfo = advText[i].split(/\/Quest_/)[1].split(/_/);
    console.log(eventInfo);
    switch (eventInfo[0].toLowerCase()) {
      case "event":
        const itemEvent = {};
        if (eventInfo[1].toLowerCase() === "sketterling") {
          itemEvent.eventType = "Sketterling Temple";
          itemEvent.eventName = fileText.includes("Bug_Armored")
            ? (itemEvent.eventName = "Black Vikorian Beetle")
            : (itemEvent.eventName = "Red Vikorian Beetle");
        } else {
          itemEvent.eventType = "Item Drop";
          itemEvent.eventName = eventInfo[1]
            .replace(/([A-Z])/g, " $1")
            .replace(" Of", " of")
            .replace(" The", " the")
            .trim();
        }
        worldEvents[worldEvents.length - 1].eventDetails.push(itemEvent);
        break;
      case "boss":
        const bossInfo = getBossInfo(eventInfo[1]);
        worldEvents.push(bossInfo);
        break;
      case "smalld":
        const dungeonInfo = getDungeonInfo(eventInfo[1]);
        worldEvents.push(dungeonInfo);
        break;
      case "miniboss":
        const minibossInfo = getMinibossInfo(eventInfo[1]);
        worldEvents.push(minibossInfo);
        break;
      case "siege":
        const siegeInfo = getSiegeInfo(eventInfo[1]);
        worldEvents.push(siegeInfo);
        break;
      case "overworldpoi":
        worldEvents.push({
          location: "Overworld",
          eventDetails: [
            {
              eventType: "Point of Interest",
              eventName: eventInfo[1].replace(/([A-Z])/g, " $1").trim(),
            },
          ],
        });
        break;
      case "cryptolith":
        if (zone === "Rhom") {
          worldEvents[worldEvents.length - 1].eventDetails.push({
            eventType: "Item Drop",
            eventName: "Soul Link",
          });
        }
        break;
      default:
        throw new Error("Cannot Read Event: " + eventInfo[0]);
    }
  }

  $("#worldInfo").empty();
  for (const worldEvent of worldEvents) {
    for (const details of worldEvent.eventDetails) {
      $("#worldInfo").append(
        `<tr>
        <td>${zone}: ${worldEvent.location}</td>
        <td>${details.eventType}</td>
        <td>${details.eventName}</td>
        </tr>`
      );
    }
  }
  $("#formFile").removeClass("is-invalid");
  $("#worldDescriptor").show();
}

function getZone(location) {
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
      throw new Error("Cannot Read Location: " + location);
  }
}

// TODO item match
// function getItemInfo(event) {}

function getBossInfo(event) {
  // TODO use a Map/Dict instead of a switch statement
  switch (event.toLowerCase()) {
    // Earth
    case "rootdragon":
      return {
        location: "The Ash Yard",
        eventDetails: [{ eventType: "World Boss", eventName: "Singe" }],
      };
    case "rootent":
      return {
        location: "The Choking Hollow",
        eventDetails: [{ eventType: "World Boss", eventName: "The Ent" }],
      };

    // Rhom
    case "theharrow":
      return {
        location: "The Bunker",
        eventDetails: [{ eventType: "World Boss", eventName: "The Harrow" }],
      };
    case "wastelandguardian":
      return {
        location: "Loom of the Black Sun",
        eventDetails: [{ eventType: "World Boss", eventName: "Claviger" }],
      };

    // Corsus
    case "fatty":
      return {
        location: "The Shack",
        eventDetails: [
          { eventType: "World Boss", eventName: "The Unclean One" },
        ],
      };
    case "swampguardian":
      return {
        location: "The Grotto",
        eventDetails: [{ eventType: "World Boss", eventName: "Ixillis" }],
      };

    // Yaesha
    case "totemfather":
      return {
        location: "The Scalding Glade",
        eventDetails: [{ eventType: "World Boss", eventName: "Totem Father" }],
      };
    case "wolf":
      return {
        location: "Ravager's Haunt",
        eventDetails: [{ eventType: "World Boss", eventName: "The Ravager" }],
      };
    // Reisum
    case "ratrider":
      return {
        location: "Crimson Hold",
        eventDetails: [
          {
            eventType: "World Boss",
            eventName: "Brudvaak, the Rider and Vargr",
          },
        ],
      };
    default:
      throw new Error("Cannot Read Boss: " + event);
  }
}

function getDungeonInfo(event) {
  // TODO use a Map/Dict instead of a switch statement
  switch (event.toLowerCase()) {
    // Earth
    case "huntershideout":
      return {
        location: "Hidden Grotto",
        eventDetails: [
          {
            eventType: "Quest Reward",
            eventName: "Hunter's Hideout: Hunting Pistol",
          },
        ],
      };
    case "lastwill":
      return {
        location: "Sorrow's Field",
        eventDetails: [
          {
            eventType: "Quest Item",
            eventName: "Supply Run: Monkey Key",
          },
          {
            eventType: "Quest Reward",
            eventName: "Supply Run: Assault Rifle",
          },
        ],
      };
    case "lizandliz":
      return {
        location: "The Warren",
        eventDetails: [
          {
            eventType: "Quest Item",
            eventName: "A Tale of Two Liz's: Liz's Key (Defend Both Liz's)",
          },
          {
            eventType: "Quest Reward",
            eventName: "A Tale of Two Liz's: Chicago Typewriter",
          },
        ],
      };
    case "madmerchant":
      return {
        location: "Junktown",
        eventDetails: [
          {
            eventType: "Quest Reward",
            eventName: "Showdown at Junk Town: Twisted Mask",
          },
        ],
      };
    case "rootcultist":
      return {
        location: "Marrow Pass",
        eventDetails: [
          {
            eventType: "Quest Reward",
            eventName: "Cult of the Root: Root Circlet",
          },
          {
            eventType: "Quest Reward",
            eventName: "Cult of the Root: Braided Thorns",
          },
        ],
      };
    case "rootshrine":
      return {
        location: "The Gallows",
        eventDetails: [
          {
            eventType: "Quest Reward",
            eventName: "The Root Shrine: Twisted Armor Set (Craft at Shrine)",
          },
        ],
      };

    // Rhom
    case "armorvault":
      return {
        location: "Vault of the Heralds",
        eventDetails: [
          {
            eventType: "Quest Item",
            eventName: "Armor Vault: Glowing Rod",
          },
          {
            eventType: "Quest Reward",
            eventName: "Armor Vault: Akari Armor Set",
          },
        ],
      };
    case "thecleanroom":
      return {
        location: "The Purge Hall",
        eventDetails: [
          {
            eventType: "Quest Reward",
            eventName: "The Clean Room: Wastelander Flail",
          },
        ],
      };
    case "thelostgantry":
      return {
        location: "Concourse of the Sun",
        eventDetails: [
          {
            eventType: "Quest Reward",
            eventName: "The Lost Gantry: Beam Rifle",
          },
        ],
      };

    // Corsus
    case "brainbug":
      return {
        location: "Strange Pass",
        eventDetails: [
          {
            eventType: "Mini Boss/NPC",
            eventName: "Mar'Gosh",
          },
          {
            eventType: "Quest Reward",
            eventName: "Brain Bug: Gift of the Iskal",
          },
        ],
      };
    case "fetidpool":
      return {
        location: "Fetid Pools",
        eventDetails: [
          {
            eventType: "Item",
            eventName: "Fetid Pools: Rusted Amulet",
          },
          {
            eventType: "Quest Reward",
            eventName: "Fetid Pools: Heart of Darkness",
          },
          {
            eventType: "Quest Reward",
            eventName: "Fetid Pools: Hero's Ring",
          },
        ],
      };
    case "queenstemple":
      return {
        location: "Iskal Sanctum",
        eventDetails: [
          {
            eventType: "Ungodly Boss",
            eventName: "Iskal Queen",
          },
        ],
      };
    case "wisp":
      return {
        location: "Circlet Hatchery",
        eventDetails: [
          {
            eventType: "Quest Reward",
            eventName: "Circlet Hatchery: Soul Ember (Destroy All Hives)",
          },
        ],
      };

    // Yaesha
    case "blinkthief":
      return {
        location: "The Verdant Strand",
        eventDetails: [
          {
            eventType: "Mini Boss",
            eventName: "Blink Thief",
          },
          {
            eventType: "Item Drop",
            eventName: "Ricochet Rifle",
          },
        ],
      };
    case "doeshrine":
      return {
        location: "Widow's Vestry",
        eventDetails: [
          {
            eventType: "Quest Reward",
            eventName: "The Doe Shrine: Scavenger's Bauble",
          },
        ],
      };
    // TODO is this a miniboss?
    case "guardianshrine":
      return {
        location: "Guardian Shrine",
        eventDetails: [
          {
            eventType: "Quest Reward",
            eventName: "Guardian Shrine: Radiant Visage",
          },
          {
            eventType: "Quest Reward",
            eventName: "Guardian Shrine: Trait Book",
          },
        ],
      };
    // Reisum
    // TODO Reisum dungeons
    default:
      throw new Error("Cannot Read Dungeon: " + event);
  }
}

function getMinibossInfo(event) {
  switch (event.toLowerCase()) {
    // Earth
    case "brabus":
      return {
        location: "Cutthroat Channel",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Brabus",
          },
        ],
      };
    case "rootbrute":
      return {
        location: "Sunken Passage",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Gorefist",
          },
        ],
      };
    case "roottumbleweed":
      return {
        location: "The Tangled Pass",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "The Mangler",
          },
        ],
      };
    case "rootwraith":
      return {
        location: "The Hidden Sanctum",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Shroud",
          },
        ],
      };
    case "splitter":
      return {
        location: "Leto's Lab",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Riphide",
          },
          {
            eventType: "Item Drop",
            eventName: "Leto's Armor Set",
          },
        ],
      };

    // Rhom
    case "houndmaster":
      return {
        location: "The Burrow",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Houndmaster and Maul",
          },
        ],
      };
    case "sentinel":
      return {
        location: "Shackled Canyon",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Raze",
          },
        ],
      };
    case "swarmmaster":
      return {
        location: "The Iron Rift",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Scourge",
          },
        ],
      };
    case "vyr":
      return {
        location: "The Ardent Temple",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Shade and Shatter",
          },
        ],
      };

    // Corsus
    case "barbterror":
      return {
        location: "Needle Lair",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Barbed Terror",
          },
        ],
      };
    case "flickeringhorror":
      return {
        location: "Hall of Whispers",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Dream Eater",
          },
        ],
      };
    case "slimehulk":
      return {
        location: "The Drowned Trench",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Canker",
          },
        ],
      };
    case "tyrant":
      return {
        location: "The Capillary",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "The Thrall",
          },
        ],
      };

    // Yaesha
    case "kincaller":
      return {
        location: "The Hall of Judgement",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "The Warden",
          },
        ],
      };
    case "blinkfiend":
      return {
        location: "Widow's Pass",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Onslaught",
          },
        ],
      };
    case "stormcaller":
      return {
        location: "Heretic's Nest",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Stormcaller",
          },
        ],
      };
    case "immolatorandzephyr":
      return {
        location: "Withering Village",
        eventDetails: [
          {
            eventType: "Dungeon Boss",
            eventName: "Sear and Scald",
          },
        ],
      };

    // Reisum
    // TODO Reisum
    default:
      throw new Error("Cannot Read Miniboss: " + event);
  }
}

function getSiegeInfo(event) {
  switch (event.toLowerCase()) {
    case "therisen":
      return {
        location: "Ahanae's Lament",
        eventDetails: [
          { eventType: "Quest Reward", eventName: "The Risen: Soul Anchor" },
        ],
      };
    case "wolfshrine":
      return {
        location: "Matyr's Sanctuary",
        eventDetails: [
          {
            eventType: "Quest Reward",
            eventName: "The Ravager Shrine: Elder Armor Set",
          },
        ],
      };
    default:
      throw new Error("Cannot Read Siege: " + event);
  }
}

// TODO Switch/Dict for Points of Interest
// function getPointOfInterestInfo(event) {
//   switch (event.toLowerCase()) {
//   }
// }

// function getLocation(event) {
//   const sublocations = {
//     //Double checked location and events with remnantfromtheashes.wiki.fextralife.com

//     //Earth
//     RootWraith: "TheHiddenSanctum",
//     RootBrute: "SunkenPassage",
//     Brabus: "CutthroatChannel",
//     RootTumbleweed: "TheTangledPass",
//     Splitter: "ResearchStationAlpha",
//     RootEnt: "TheChokingHollow",
//     RootDragon: "TheAshYard",
//     HuntersHideout: "HiddenGrotto",
//     MadMerchant: "Junktown",
//     LastWill: "Sorrow'sField",
//     RootShrine: "TheGallows",
//     LizAndLiz: "TheWarren",
//     RootCultist: "MarrowPass",

//     // Rhom
//     SwarmMaster: "TheIronRift",
//     HoundMaster: "TheBurrows",
//     Sentinel: "ShackledCanyon",
//     Vyr: "TheArdentTemple",
//     WastelandGuardian: "LoomOfTheBlackSun",
//     TheHarrow: "TheBunker",
//     TheLostGantry: "ConcourseOfTheSun",
//     ArmorVault: "VaultOfTheHeralds",
//     TheCleanRoom: "ThePurgeHall",

//     // Corsus
//     SlimeHulk: "TheDrownedTrench",
//     Tyrant: "TheCapillary",
//     FlickeringHorror: "HallOfWhispers",
//     BarbTerror: "NeedleLair",
//     QueensTemple: "IskalTemple",
//     SwampGuardian: "TheGrotto",
//     Wisp: "CircletHatchery",
//     FetidPool: "FetidPools",
//     BrainBug: "StrangePass",
//     Fatty: " TheShack",

//     // Yaesha
//     KinCaller: "TheHallOfJudgement",
//     BlinkFiend: "Widow'sPass",
//     BlinkThief: "VerdantStrand",
//     StormCaller: "Heretic'sNest",
//     ImmolatorAndZephyr: "WitheringVillage",
//     Wolf: "Ravager'sHaunt",
//     DoeShrine: "Widow'sVestry",
//     WolfShrine: "TempleOfTheRavager",
//     TheRisen: "Ahanae'sLament",
//     TotemFather: "TheScaldingGlade",
//     StuckMerchant: "MerchantDungeon",

//     //Reisum
//     UrikkiBlademasters: "ValenhagMines",
//     ShieldWarden: "Exiles'sTrench",
//     BlizzardMage: "WutheringKeep",
//     TheJackal: "WildReach",
//     WarningTotems: "Magir'sDirge",
//     ShamanFlames: "GraveOfTheElders",
//     RatRider: "CrimsonHold",
//     FrozenLords: "Judgement'sSpear",
//     IceSkimmer: "TheFrieranSea",
//     CreepersPeeper: "Watcher'sHollow",
//   };
// }
