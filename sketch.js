

//ChatGPT v3 (make the json available as a variable, testing this with consol.log)

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

//api key (expires every 100 days)
var oshwaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzNDAxNjBhNTY1N2M0MDAxODNjMGZlYSIsImlhdCI6MTcwNzQzMDQ5MiwiZXhwIjoxNzE2MDcwNDkyfQ.M3aL-9EOxtG9gviTdH_heXfBGMzU9rvaJCyh_sGaTzo';
var oshwaKeyForHeader = 'Bearer ' + oshwaKey;


var allEntries = []; // Step 1: Create an empty array to store all entries

xhr.addEventListener("readystatechange", function() {
  if(this.readyState === 4) {
    //creates JSON object
    var data = JSON.parse(this.responseText);
    //pulls out the total number of entries
    var total_entries = data["total"];
    console.log(total_entries);
    //iterates through and appends all objects to the array
    for (var i = 0; i < data["items"].length; i++)
    {
        allEntries.push(data["items"][i]); // Step 2: Push each item to the array
    }
    // If there are more entries to fetch, send another request
    var remainingEntries = total_entries - (data["offset"] + data["items"].length);
    if (remainingEntries > 0) {
      var nextOffset = data["offset"] + 100;
      fetchData(nextOffset);
    } else {
      // If all entries have been fetched, save the array to a file
      //saveToFile(allEntries);
      console.log("All entries fetched:", allEntries); // Log the allEntries array
      console.log(allEntries[0]["country"]);
      console.log(allEntries.length);
      //run the country_counter function
      var country_counter = countCountry(allEntries);
      console.log(country_counter);
      //calculate the number of countries with certifications for the map label below
      var numberOfCountries = Object.keys(country_counter).length;
      console.log(numberOfCountries);
      
      //create the map JSON 
      var map_json = loadGeoJson();

      //*********combine jsons so geojson has HW counts as a feature********
      // new variable combined_jsons to hold the . . . combined jsons
      var combined_jsons = combineJSONs(country_counter, map_json);
      console.log(combined_jsons);

      //start of map stuff

      //****************tutorial stuff****************
      var map = L.map('map').setView([37.8, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

      }).addTo(map);


      // control that shows state info on hover
      var info = L.control();

      info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
      };

      info.update = function (props) {
        titleText = '<h4>OSHWA Open Source Hardware Certifications <br />(' + total_entries + ' certifications from ' + numberOfCountries + ' countries)</h4>';
        this._div.innerHTML = titleText +  (props ?
          '<b>' + props.ADMIN + '</b><br />' + props.HW_COUNT + ' registrations'
          : 'Hover over a country for registration count');
      };

      info.addTo(map);


      // get color depending on population density value
      function getColor(d) {
        return d > 50 ? '#800026' :
            d > 20  ? '#BD0026' :
            d > 10  ? '#E31A1C' :
            d > 5  ? '#FC4E2A' :
            d > 1   ? '#FD8D3C' :
                  '#FFFFFF';
      }

      function style(feature) {
        return {
          weight: 1,
          opacity: 1,
          color: '#d9d9d9',
          dashArray: '3',
          fillOpacity: 0.7,
          fillColor: getColor(feature.properties.HW_COUNT)
        };
      }

      function highlightFeature(e) {
        var layer = e.target;

        layer.setStyle({
          weight: 1,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
        }

        info.update(layer.feature.properties);
      }

      var geojson;

      function resetHighlight(e) {
        geojson.resetStyle(e.target);
        info.update();
      }

      function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
      }

      function onEachFeature(feature, layer) {
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature
        });
      }

      geojson = L.geoJson(combined_jsons, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);

      
      map.attributionControl.addAttribution('Hardware Registrations from the <a href="https://certification.oshwa.org/">OSHWA Open Source Hardware Certification Program</a>');
      


      var legend = L.control({position: 'bottomright'});

      legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'legend'),
          grades = [1, 5, 10, 20, 50],
          labels = [],
          from, to;

        for (var i = 0; i < grades.length; i++) {
          from = grades[i];
          //to = grades[i + 1];
          to = (grades[i + 1]) - 1;

          labels.push(
            '<i style="background:' + getColor(from + 1) + '"></i> ' +
            from + (to ? '&ndash;' + to : '+'));
        }

        div.innerHTML = labels.join('<br>');
        return div;
      };

      legend.addTo(map);


      //end of map stuff
      
    }

    
  }
});

//chatGPT
function fetchData(offset) {
  var url = "https://certificationapi.oshwa.org/api/projects?offset=" + offset;
  xhr.open("GET", url);
  xhr.setRequestHeader("Authorization", oshwaKeyForHeader);
  xhr.send();
}


//chatGPT
//revised (access country)
function saveToFile(data) {
    // Log the country of each item
    data.forEach(function(item) {
      console.log("Country:", item.country);
    });
  
    var jsonData = JSON.stringify(data);
    var blob = new Blob([jsonData], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "json_of_all_entries.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("JSON file saved."); // Log once the file is saved
  }

function countCountry(input_json) {
  //confirm it is running
  console.log("countCountry is running");
  //console.log(input_json);
  //TODO: the json you are getting back is not interable by entry
  //var count = Object.keys(input_json).length;
  var count = input_json.length;
  console.log(count);
  //for (var i = 0; i < count; i++)



  //create a temporary dictionary in the function
  function_country_counter = {};
  //loop through all of the entries
  //.length wasn't working for unknown reasons, so you just hardcoded in a number
  //for (var i = 0; i < input_json.length; i++)
  //TODO: THIS WILL WORK IF YOU CAN FIGURE OUT THE .length ISSUE
  for (var i = 0; i < count; i++)
  {
    console.log(input_json[i]["country"]);
    //var country = input_json[i]["country"];
    var country = input_json[i]['country'];
    //console.log("hi");
    //data['items'][0]['oshwaUid']

    //this checks to see if the country is in the list
    let result = function_country_counter.hasOwnProperty(country);
    //console.log(result);

    //if the country is not in the dictionary
    if (function_country_counter.hasOwnProperty(country) == false) {
      //console.log('fffalse');
      //add the country with a count 1
      function_country_counter[country] = 1;
      //console.log(function_country_counter);
    }

    //if the country is in the dictionary
    if (function_country_counter.hasOwnProperty(country) == true) {
      //console.log('tttrue');
      //increment the counter
      function_country_counter[country] = function_country_counter[country] + 1;
      //console.log(function_country_counter);
    }
  }

  console.log(function_country_counter);
  console.log(function_country_counter["Switzerland"]);
  //return the tempoary dictionary
  return function_country_counter;

}

function loadGeoJson(){
  //*********add generic geojson file*********
  //loads in the geojson
  var map_data_request = new XMLHttpRequest();
  map_data_request.open("GET", "./data/countries.geojson", false);
  map_data_request.send(null);
  var map_json = JSON.parse(map_data_request.responseText);


  console.log(map_json);

  //demo of how to access elements in geojson
  console.log(map_json.features[0].properties.ADMIN);
  console.log(map_json.features[1].properties.ADMIN);
  return map_json;
}

function combineJSONs(country_list, geo_json) {
  console.log("hello");

  for (x in country_list) {

    //apparently the best way to add things to the geojson is to
    //loop over the entire thing every time to see if there is a match
    //and then add the entry when there is
    for (let i = 0; i < geo_json.features.length; i++) {
      // if the name of the country blob in the geo_json
      //being iterated upon equals x, which is the current country
      //from the country_list in the iteration
      if (geo_json.features[i].properties.ADMIN === x){
        //add a new elements that is HW_COUNT:<number of HW from the country_list>
        geo_json.features[i].properties["HW_COUNT"] = country_list[x]
        }
      }
    }

    //now loop over everything again and add a HW_COUNT of 0 to everything else
    for (let i = 0; i < geo_json.features.length; i++) {
      console.log(geo_json.features[i].properties.HW_COUNT);
      if (geo_json.features[i].properties.HW_COUNT === undefined){
        geo_json.features[i].properties["HW_COUNT"] = 0
      }
    }


    //prints the updated geojson
    console.log(geo_json);
    //returns the updated geojson
    return(geo_json);

  }
// function countCountryTwo(input_json) {
//   console.log("Length of input_json:", input_json.length);
//   console.log("First entry:", input_json[0]["country"]);
// }

// Start fetching data with an initial offset of 0
fetchData(0);
