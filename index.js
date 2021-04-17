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

async function submitForm(event) {
  event.preventDefault();
  const file = $("#formFile")[0].files[0];

  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = async () => {
    try {
      if ($("#modeSelect").val() === "1") {
        // analyzeCampaign(reader.result);
        $("#modeSelect").addClass("is-invalid");
      } else {
        $("#modeSelect").removeClass("is-invalid");
        await analyzeAdventure(reader.result);
      }
    } catch (error) {
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
// function analyzeCampaign(fileText) {}

async function analyzeAdventure(fileText) {
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

  const location = getLocation(advText[0].split(/_/)[1]);

  const worldEvents = [];
  const bossInfo = await getBossInfo();
  const dungeonInfo = await getDungeonInfo();
  const minibossInfo = await getMinibossInfo();
  const siegeInfo = await getSiegeInfo();

  for (let i = 1; i < advText.length; i++) {
    const eventInfo = advText[i].split(/\/Quest_/)[1].split(/_/);
    // console.log(eventInfo);
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
        worldEvents.push(bossInfo[eventInfo[1]]);
        break;
      case "smalld":
        worldEvents.push(dungeonInfo[eventInfo[1]]);
        break;
      case "miniboss":
        worldEvents.push(minibossInfo[eventInfo[1]]);
        break;
      case "siege":
        worldEvents.push(siegeInfo[eventInfo[1]]);
        break;
      case "overworldpoi":
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
      case "cryptolith":
        if (location === "Rhom") {
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
        <td>${location}</td>
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

function getLocation(location) {
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

async function getBossInfo() {
  const response = await fetch("/Remnant-World-Analyzer/data/bosses.json");
  const bossInfo = await response.json();
  return bossInfo;
}

async function getDungeonInfo() {
  const response = await fetch("/Remnant-World-Analyzer/data/dungeons.json");
  const dungeonInfo = await response.json();
  return dungeonInfo;
}

async function getMinibossInfo() {
  const response = await fetch("/Remnant-World-Analyzer/data/minibosses.json");
  const minibossInfo = await response.json();
  return minibossInfo;
}

async function getSiegeInfo() {
  const response = await fetch("/Remnant-World-Analyzer/data/sieges.json");
  const siegeInfo = await response.json();
  return siegeInfo;
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
