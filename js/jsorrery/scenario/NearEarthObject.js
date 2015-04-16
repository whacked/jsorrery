/** 

mass : kg
dist : km
apeed : km/s
radius: km

*/

// see
// http://ssd.jpl.nasa.gov/?sb_elem
// for named and unnamed asteroid text
// see below for direct parser

NEODATA = {
  // "2015 GA1": {
  //   epoch: 2457000.5,
  //   oe: [
  //     // important
  //     ["e"      , .6259576996642546, 0.00035569, null],
  //     // important
  //     ["a"      , 2.335063510400353, 0.002092, "AU"],
  //     ["q"      , .8734125268602085, 4.8077e-05, "AU"],
  //     // important
  //     ["i"      , 5.091306742043598, 0.0020614, "deg"],
  //     // important
  //     ["node"   , 25.9054842425528 , 2.9304e-05, "deg"],
  //     // important
  //     ["peri"   , 228.5019344980487, 0.00065254, "deg"],
  //     // important
  //     ["M"      , 314.968045544073 , 0.061883, "deg"],
  //     ["tp"     , 2457163.528963870635, 0.0049446, "JED"],
  //     [null     , "(2015-May-21.02896387)", null, null],
  //     // important
  //     ["period" , 1303.306234484429, 1.7515, "d"],
  //     [null     , 3.57, 0.004795, "yr"],
  //     ["n"      , .2762205769255844, 0.00037121, "deg/d"],
  //     ["Q"      , 3.796714493940497, 0.0034016, "AU"]
  //   ]}
};



var hdr = 'Designation Epoch      a           e        i         w        Node        M         H    G   Ref';
var div = '----------- ----- ----------- ---------- --------- --------- --------- ----------- ----- ---- ----------';
parse_header(hdr, div);

function parse_header(hdr_line, div_line) {
  var dhl = {};
  _.each(_.zip(hdr_line.replace(/^\s+/, "").split(/\s+/),
               _.map(div_line.split(/\s+/), function(s) {return s.length;})),
         function(pair) {
           var header = pair[0];
           var hdrlen = pair[1];
           dhl[header] = hdrlen;
         });

  return dhl;
}

function parse_line_list(line_list) {
  var dhl = parse_header(line_list[0], line_list[1]);
  var compiled = {};
  _.each(line_list.slice(2),
         function (line) {
           var rtn = {oe: []};
           var offset = 0;
           _.each(dhl, function(len, hdr) {
             var val = line.substr(offset, len).trim();
             offset += len + 1;

             var oe_header = hdr;
             switch(hdr) {
             case "Name":
             case "Designation":
               compiled[val] = rtn;
               return;
             case "Epoch":
               rtn.epoch = Number(val) + 2400000.5;
               return;
             case "Ref":
               return;

             case "Node":
               oe_header = "node";
               break;
             case "w":
               oe_header = "peri";
               break;

             }
             rtn.oe.push([oe_header, Number(val)]);
           });
           // we don't know this
           rtn.oe.push(["period", 300])
         });
  return compiled;
};

var named_list = [' Num   Name              Epoch      a          e        i         w        Node        M         H    G   Ref',
                  '------ ----------------- ----- ---------- ---------- --------- --------- --------- ----------- ----- ---- ----------',
                  '     1 Ceres             57000  2.7675059 0.07582277  10.59339  72.52203  80.32927  95.9891758  3.34 0.12 JPL 33',
                  '     2 Pallas            57000  2.7716061 0.23127363  34.84100 309.93033 173.09625  78.2287037  4.13 0.11 JPL 26',
                  '     3 Juno              57000  2.6707002 0.25544826  12.98166 248.40997 169.87118  33.0771533  5.33 0.32 JPL 102',
                  '     4 Vesta             57000  2.3617932 0.08874017   7.14043 151.19853 103.85137  20.8638415  3.20 0.32 JPL 33'];
var unnamed_list = ['Designation Epoch      a           e        i         w        Node        M         H    G   Ref',
                    '----------- ----- ----------- ---------- --------- --------- --------- ----------- ----- ---- ----------',
                    '1927 LA     57000   3.3223311 0.34433808  17.72267 338.68452 191.22647 171.5515002 11.00 0.15 JPL 6',
                    '1935 UZ     28097   2.1665899 0.25129031   4.79105 280.78378 134.71624 342.5138563 99.00 0.00 JPL 3',
                    '1937 CK     57000   2.3202971 0.13860436   6.54634 130.19154 273.91866 102.8620477 99.00 0.00 JPL 3',
                    '2015 GZ     57124   2.8030920 0.72075280  13.51970 113.83354  20.37478   9.2737177 26.09 0.15 JPL 3',
                    '2015 GA1    57000   1.9991969 0.61008248   5.24163  69.25952 202.66610 300.1071063 26.63 0.15 JPL 4',
                    '2015 GB1    57000   1.7621395 0.44033970   2.40076 200.04383  27.71889 298.5543100 26.64 0.15 JPL 2'];


// (RAW) small body ascii file parser
NEODATA = _.extend(NEODATA, parse_line_list(named_list), parse_line_list(unnamed_list));

function get_NEO_data(name) {
  if(!NEODATA[name]) {
    alert("NOT THERE! " + name);
    return;
  }
  if(NEODATA[name].orbitalElements) {
    return NEODATA[name].orbitalElements;
  } else {
    var rtn = {orbitalElements:{}};
    _.each(NEODATA[name].oe, function(row) {
      if(!row[0]) {
        return;
      }
      rtn.orbitalElements[row[0]] = row[1];
    });
    return _.extend(rtn, NEODATA[name]);
  }
}


define(
	[
		'jsorrery/NameSpace',
		'jsorrery/scenario/CommonCelestialBodies',
		'vendor/jquery.xdomainajax'
	], 
	function(ns, common) {


		var bodies = {};

		var neoPath = 'http://neo.jpl.nasa.gov/cgi-bin/neo_ca?type=NEO&hmax=all&sort=date&sdir=ASC&tlim=far_future&dmax=0.05AU&max_rows=0&action=Display+Table&show=1';

		var onLoadError = function(jqXHR, textStatus, errorThrown){
			alert('Error loading NEO definitions. See console.');
			console.log(textStatus, errorThrown);
		};


		var onListLoaded = function(res) {
			var html = res.results && res.results[0];
      console.log("on load error 1");
			if(!html) return onLoadError(res, null, 'No result');

			var reg = /http\:\/\/ssd\.jpl\.nasa\.gov\/sbdb\.cgi\?sstr\=([^";]+)/g;
			var matches = html.match(reg);
      console.log("on load error 2");
			if(!matches) return onLoadError(res, null, 'No links found');

			var allReady = $.ajax(document.baseURI);
      _.each(Object.keys(NEODATA), function(objname) {
				var loadDef = $.ajax({
					url: document.baseURI,
					type: 'get',
					dataType: 'html',
					context: {
						name: objname
					},
				});

				loadDef.fail(onLoadError);
				loadDef.then(onObjectLoaded);
				allReady = (allReady && allReady.then(function() {
					return loadDef.promise();
					onObjectLoaded();
				})) || loadDef;
      });

			// for(var i = 0; i<1 && i<matches.length; i++) {
      //   break
			// 	(function(i){
			// 		var url = matches[i];
			// 		var name = decodeURI(url.substring(url.indexOf('sstr=')+5));

			// 		var loadDef = $.ajax({
			// 			url: document.baseURI,
			// 			type: 'get',
			// 			dataType: 'html',
			// 			context: {
			// 				name: name,
			// 				url: url
			// 			},
			// 		});

			// 		loadDef.fail(onLoadError);
			// 		loadDef.then(onObjectLoaded);
			// 		allReady = (allReady && allReady.then(function() {
			// 			return loadDef.promise();
			// 			onObjectLoaded();
			// 		})) || loadDef;
					
			// 	})(i);
			// }
			return allReady.promise();
		};

    var onObjectLoaded = function() {
			//find epoch
      var neodata = get_NEO_data(this.name);
      var epoch = neodata.epoch;
			var tsSinceJ2000 = (epoch-2451545) * (60*60*24*1000);
			epoch = ns.J2000.getTime() + tsSinceJ2000;
			var epochDate = new Date(epoch);
			var orbitalElements = neodata.orbitalElements;
			bodies['_'+this.name] = _.extend({
				title : this.name,
        map: 'img/pusheenmap1.png',
				orbit: {
					epoch : epochDate,
					base : {
						a : orbitalElements.a * ns.AU,
						e : orbitalElements.e,
						w : orbitalElements.peri,
						M : orbitalElements.M,
						i : orbitalElements.i,
						o : orbitalElements.node
					},
					day : {
						M : 360 / orbitalElements.period
					}	
				}
			}, baseNEO);
		};

		var baseNEO = {
			mass : 1,
			radius : 2000,
			color : '#ffffff'
		};

		var cnf = {
			name : 'NEO',
			title : 'Near Earth Objects',
			load : (function(){
				var ready;
				return function(){

					if(ready) return ready.promise();
					var loaded = $.ajax({
						url: neoPath,
						type: 'get',
						dataType: 'html'
					});

					loaded.fail(onLoadError);
					ready = loaded.then(onListLoaded);
					return ready.promise();
				};
			})(),
			/*calculateAll : true,
			usePhysics : true,/**/
			commonBodies : [
				'sun',
				'mercury',
				'venus',
				'earth',
				'moon',
				'mars'
			],
			bodies : bodies,
			secondsPerTick : {min: 60, max: 3600 * 5, initial:3600},
			defaultGuiSettings : { 
				planetScale : 1
			},
			help : "This scenario shows the next 10 passages closer than 0.05 AU of near Earth objects from Nasa's Near Earth Object Project (<a href=\"http://neo.jpl.nasa.gov/\" target=\"_blank\">http://neo.jpl.nasa.gov/</a>."
		};
    z=cnf;
		return cnf;
		
	}
);
