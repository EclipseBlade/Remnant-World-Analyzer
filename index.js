// After adventure mode is complete the website will display minified versions of the html, css, javascript, and jsons
// TODO review areas for extra items (Control Rod)

let subEventInfo = null;
let bossInfo = null;
let minibossInfo = null;
let dungeonInfo = null;
let siegeInfo = null;
let pointOfInterestInfo = null;

// seperates standard errors and connection to display different messages on html
class ConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConnectionError";
  }
}

// These just read the data for each category from the json files in the data folder
// Now stored in global variables to make sure we only request the data once for each type
async function initEventInfo() {
  if (subEventInfo === null) {
    const response = await fetch(
      "https://eclipseblade.github.io/Remnant-World-Analyzer/events.json"
    );
    if (!response.ok) {
      throw new ConnectionError("Could Not Read Items");
    }
    const eventInfo = await response.json();
    subEventInfo = eventInfo.subEvents;
    bossInfo = eventInfo.bosses;
    minibossInfo = eventInfo.minibosses;
    dungeonInfo = eventInfo.dungeons;
    siegeInfo = eventInfo.sieges;
    pointOfInterestInfo = eventInfo.pointOfInterests;
  }
}

// Makes deep copy of event to avoid editing dictionary
function deepCloneEvent({ zone, eventDetails }) {
  const eventDetailsCopy = eventDetails.map(
    ({ eventType, eventName, eventLink }) => ({
      eventType,
      eventName: [...eventName],
      eventLink: [...eventLink],
    })
  );
  return { zone, eventDetails: eventDetailsCopy };
}

function deepCloneSubEvent({ eventType, eventName, eventLink }) {
  return { eventType, eventName: [...eventName], eventLink: [...eventLink] };
}

function getWorld(location) {
  switch (location.toLowerCase()) {
    case "city":
      return "Earth";
    case "wasteland":
      return "Rhom";
    case "swamp":
      return "Corsus";
    case "jungle":
      return "Yaesha";
    case "snow":
      return "Reisum";
    default:
      throw new Error("Invalid Location: " + location);
  }
}

// TODO complete campain analysis
function analyzeCampaign(fileText) {}

async function analyzeAdventure(fileText) {
  // Update it is actually faster to find end index first
  // We find the last mention of an event/item which will always begin with "Game/World_@/Quests/Quest_*" where @ is the world and * is the type of event
  // Every event/item ends with "_C"
  // This could cause problems if the last event/item started with a "C", but the last event/item must either be a Simulacrum or Trait Book
  const endIndex = fileText.indexOf(
    "_C",
    fileText.lastIndexOf("/Quests/Quest_")
  );
  if (endIndex === -1) {
    throw new Error("Invalid File Input");
  }

  // Adventure mode save file items and events can be read after the last mention of "Adventure"
  // hzla found this trick and used it in his analyzer
  const startIndex = fileText.lastIndexOf("Adventure", endIndex);
  if (startIndex === -1) {
    throw new Error("Invalid File Input");
  }

  // Remember each event/item will start with Game so we can split the string by the delimeter "Game" to get them
  const advText = fileText.substring(startIndex, endIndex).split(/Game/g);

  // console.log(
  //   advText.map((str) => {
  //     return str.replace(/[^0-9a-zA-Z_\/]/g, "");
  //   })
  // );

  // The first element of the list is not an item or an event but it does contain some descriptors for the adventure mode including which world was chosen
  const world = getWorld(advText[0].split(/_/)[1]);
  advText.splice(0, 1);

  // Load data into global variables
  await initEventInfo();

  const overworldZone = {
    order: 5,
    zone: ["Overworld"],
    eventDetails: [],
  };

  // Reads a single event from advText, paired with reduce function
  const readEventReducer = (eventAccumulator, eventText) => {
    const eventInfo = eventText.split(/\/Quest_/)[1].split(/_/);
    // console.log(eventInfo);

    // The event text must be switched to lowercase because sometimes the save file uses capitalizes words other times it doesn't like MiniBoss/miniboss or OverWorldPOI/OverworldPOI
    switch (eventInfo[0].toLowerCase()) {
      // An event is usual an item, but there are a few outliers like the sketterling temple
      case "event":
        if (!(eventInfo[1] in subEventInfo)) {
          throw new Error("Invalid Item: " + eventInfo[1]);
        }
        const subEvent = deepCloneSubEvent(subEventInfo[eventInfo[1]]);
        if (subEvent) {
          // We can check for the color of a Sketterling bug if we check if the temple spawns Sketterling_Bug.C or Sketterling_Bug_Armored.C
          // At the moment, it does not seem possible to identify the drop of the red beetle
          if (eventInfo[1] === "Sketterling") {
            let beetleIndex = -1;
            // Mar'Gosh's Lair means that a second Sketterling can spawn so we have to check for the spawns seperately
            // This will break on more than 2 sketters (Not Sure If Possible)
            if (eventInfo[2] === "Mines") {
              beetleIndex = fileText.lastIndexOf(
                "Sketterling_Bugs",
                fileText.indexOf("Sketterling_Mines")
              );
            } else {
              beetleIndex = fileText.lastIndexOf("Sketterling_Bugs");
            }
            if (beetleIndex === -1) {
              throw new Error("Could Not Read Color of Sketterling");
            }
            // Check if the character after g in Bug is an _ or not
            subEvent.eventName[0] =
              (fileText.charAt(beetleIndex + 48) === "_" ? "Black" : "Red") +
              subEvent.eventName[0];
          }

          if (
            eventInfo[1] === "CreepersPeepers" ||
            eventInfo[1] === "Packmaster"
          ) {
            overworldZone.eventDetails.push(subEvent);
          } else {
            eventAccumulator[eventAccumulator.length - 1].eventDetails.push(
              subEvent
            );
          }
        }
        break;
      // A boss is the world boss like Singe, Claviger, Ixiillis, or The Ravager
      case "boss":
        if (!(eventInfo[1] in bossInfo)) {
          throw new Error("Invalid Boss: " + eventInfo[1]);
        }
        const bossEvent = {
          order: 0,
          ...deepCloneEvent(bossInfo[eventInfo[1]]),
        };
        eventAccumulator.push(bossEvent);
        break;
      // A miniboss is a side dungeon with a fogged wall containing a boss like Gorefist, Raze, Canker, or The Warden
      case "miniboss":
        if (!(eventInfo[1] in minibossInfo)) {
          throw new Error("Invalid Miniboss: " + eventInfo[1]);
        }
        const minibossEvent = {
          order: 1,
          ...deepCloneEvent(minibossInfo[eventInfo[1]]),
        };
        eventAccumulator.push(minibossEvent);
        break;
      // A smalld is a side dungeon with no boss or siege at the end like Leto's Lab, The Clean Room, Circlet Hatchery, or Widow's Vestry
      case "smalld":
        if (!(eventInfo[1] in dungeonInfo)) {
          throw new Error("Invalid Dungeon: " + eventInfo[1]);
        }
        const dungeonEvent = {
          order: 2,
          ...deepCloneEvent(dungeonInfo[eventInfo[1]]),
        };
        eventAccumulator.push(dungeonEvent);
        break;
      // A siege is a side dungeon with a fogged wall containing no boss like A Tale of Two Liz's, The Lost Gantry, or the Matyr's Sanctuary
      // Interestingly enough, Mar'Gosh's Lair is considered a siege because he is sometimes a boss and sometimes an npc
      case "siege":
        if (!(eventInfo[1] in siegeInfo)) {
          throw new Error("Invalid Siege: " + eventInfo[1]);
        }
        const siegeEvent = {
          order: 3,
          ...deepCloneEvent(siegeInfo[eventInfo[1]]),
        };
        eventAccumulator.push(siegeEvent);
        break;
      // A overworldpoi is a point of interest like Mud Tooth, the Monolith, the Abandoned Throne, the Flautist, and the Cryptolith
      // A point of interest is sometimes refered to as a world event
      case "overworldpoi":
        if (!(eventInfo[1] in pointOfInterestInfo)) {
          throw new Error("Invalid Point of Interest: " + eventInfo[1]);
        }
        if (eventInfo[1] === "Stuck Merchant") {
          eventAccumulator.push({
            order: 4,
            ...deepCloneEvent(dungeonInfo["GuardianShrine"]),
          });
        }
        overworldZone.eventDetails = pointOfInterestInfo[eventInfo[1]]
          .map((overworldEvent) => deepCloneSubEvent(overworldEvent))
          .concat(overworldZone.eventDetails);
        eventAccumulator.push(overworldZone);
        break;
      // The cryptolith is a unique point of interest because it spawns the labyrinth that players can traverse to get the labyrinth armor set
      // This indicates that the labyrinth was spawned
      // However, I just use it to add the Soul Link ring if the cryptolith spawned on Rhom
      case "cryptolith":
        if (world === "Rhom") {
          eventAccumulator[eventAccumulator.length - 1].eventDetails.push({
            eventType: "Item Drop: Ring",
            eventName: ["Soul Link"],
            eventLink: [
              "https://remnantfromtheashes.wiki.fextralife.com/Soul+Link",
            ],
          });
        }
        break;
      default:
        throw new Error("Invalid Event: " + eventInfo[0]);
    }
    return eventAccumulator;
  };

  // Move randomly spawned trait books and simulacrum to bottom of each worldEvent
  const compareEvents = (a, b) => {
    if (a.eventType === "Item Drop") {
      if (b.eventType === "Item Drop") {
        if (a.eventName[0] > b.eventName[0]) {
          return 1;
        }
        if (a.eventName[0] < b.eventName[0]) {
          return -1;
        }
        return 0;
      }
      return 1;
    }
    if (b.eventType === "Item Drop") {
      return -1;
    }
    return 0;
  };

  const worldEvents = advText
    .reduce(readEventReducer, [])
    .sort((a, b) => a.order - b.order)
    .map(({ zone, eventDetails }) => ({
      zone,
      eventDetails: eventDetails.sort(compareEvents),
    }));

  return { world, worldEvents };
}

// This is what displays the processed events/items
// It would be faster to do display the content in the analyzeMode's switch statement but it would also be harder to read and debug
function renderTable({ world, worldEvents }) {
  $("#world-info").empty();
  for (const { zone, eventDetails } of worldEvents) {
    let subAreaEvents = 0;
    if (zone.length == 2) {
      if (zone[0] === "Strange Pass") {
        subAreaEvents++;
      }
      subAreaEvents++;
    }
    for (let i = 0; i < eventDetails.length; i++) {
      const { eventType, eventName, eventLink } = eventDetails[i];

      let $row = `<tr><td>${world}</td><td>${zone[0]}`;
      if (i < subAreaEvents) {
        $row += ` (${zone[1]})`;
      }
      $row += `</td><td>${eventType}</td><td class="hyperlink">`;

      for (let i = 0; i < eventLink.length; i++) {
        $row += `<a href="${eventLink[i]}"  target="_blank">${eventName[i]}</a>`;
        if (i !== eventLink.length - 1) {
          if (eventLink.length === 3) {
            $row += " or ";
          } else if (eventName[0] === "Houndmaster" || eventName[0] === "Wud") {
            $row += " and ";
          } else {
            $row += ": ";
          }
        }
      }

      $row += "</td></tr>";
      $("#world-info").append($row);
    }
  }
  $("#connection-error").hide();
  $("#form-file").removeClass("is-invalid");
  $("#world-descriptor").show();
}

$("#world-input").submit(async (event) => {
  event.preventDefault();
  $("#loading").show();

  const file = $("#form-file")[0].files[0];
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = async () => {
    try {
      let worldAnalysis = null;
      // Currently the user has to select whether they want to analyze campaign or adventure, but the program should be able to tell
      // The option will probably be removed in the future though it does make the program more efficient to leave it
      if ($("#mode-select").val() === "Campaign") {
        $("#mode-select").addClass("is-invalid");
        // analyzeCampaign(reader.result);
      } else {
        $("#mode-select").removeClass("is-invalid");
        worldAnalysis = await analyzeAdventure(reader.result);
      }

      if (worldAnalysis) {
        renderTable(worldAnalysis);
      }
    } catch (error) {
      if (error instanceof ConnectionError) {
        $("#connection-error").show();
      } else {
        $("#form-file").addClass("is-invalid");
      }
      console.log(error);
    }

    $("#loading").hide();
  };

  reader.onerror = () => {
    $("#form-file").addClass("is-invalid");
    console.log(reader.error);
    $("#loading").hide();
  };
});

// These are the names of various zones and sub locations
// I got these from hzla's world analyzer
// Will be deleted later after this project is updated to include all of these areas

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
