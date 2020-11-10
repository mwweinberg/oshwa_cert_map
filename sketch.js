function countCountry(input_json) {
  //create a temporary dictionary in the function
  function_country_counter = {};
  //loop through all of the entries
  for (var i = 0; i < input_json.length; i++)
  {
    console.log(input_json[i]["country"]);
    var country = input_json[i]["country"];

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

  //return the tempoary dictionary
  return function_country_counter;

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




var xhr = new XMLHttpRequest();
xhr.withCredentials = true;
xhr.addEventListener("readystatechange", function() {
  if(this.readyState === 4) {
    console.log(this.responseText);
    //this creates a JSON object that holds the data payload
    var data = JSON.parse(this.responseText);
    //this just prints something from the JSON to show that it works
    console.log(data[0]["oshwaUid"]);

    //runs the function to fill the country_counter dictionary
    var country_counter = countCountry(data);
    //prints the filled country_counter dictionary just to show that it worked
    console.log(country_counter);
    console.log(country_counter["Switzerland"]);


    //*********add generic geojson file*********
    //loads in the geojson
    var map_data_request = new XMLHttpRequest();
    map_data_request.open("GET", "/data/countries.geojson", false);
    map_data_request.send(null)
    var map_json = JSON.parse(map_data_request.responseText);
    console.log(map_json);

    //demo of how to access elements in geojson
    console.log(map_json.features[0].properties.ADMIN);
    console.log(map_json.features[1].properties.ADMIN);


    //*********combine jsons so geojson has HW counts as a feature********
    // new variable combined_jsons to hold the . . . combined jsons
    var combined_jsons = combineJSONs(country_counter, map_json);
    console.log(combined_jsons);


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
  		this._div.innerHTML = '<h4>OSHWA Open Source Hardware Certifications</h4>' +  (props ?
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



  }
});
xhr.open("GET", "https://certificationapi.oshwa.org/api/projects");
xhr.setRequestHeader("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmOTc0ZjEyNmU4NjcwMDAyYTdkY2JkYSIsImlhdCI6MTYwMzc1MTY5OCwiZXhwIjoxNjEyMzkxNjk4fQ.hPgWn9CnLkLVWfhl2TcI_Pbpgh6Sto1TI38aN3u-DaU");
xhr.send();
