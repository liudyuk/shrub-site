//--------------------------------------------------------
// Authors:
// Script: Nezha Acil, University of Birmingham
// Site data: Daijun Liu, University of Birmingham
//--------------------------------------------------------


Map.setZoom(0);

//--------------------
// Parameters to edit
//--------------------
var siteFile = "Daijun/Shrub_sites_NA"; // Name of the file that contains site id and their locations in latlon WGS84
var id = 'ID'; // Name of the column containing site id 

var startYear=1980;
var endYear=2000;//not included

var GLDASv = '_GLDASv20'; // 1980-1999
//var GLDASv = '_GLDASv21' // >=2000


//--------------
// Import
//--------------
// Plots

var plots = ee.FeatureCollection("users/NXA807/"+siteFile); // change to GEE username
Map.addLayer(plots);

// SoilMoi0_10cm_inst	unit kg/m^2	min 1.99 max	47.59
// SoilMoi10_40cm_inst unit kg/m^2 min 5.99	max 142.8
// SoilMoi40_100cm_inst	unit kg/m^2	min 11.99	max 285.6	
// SoilMoi100_200cm_inst  unit kg/m^2 min 20 max 476

// Layer to import 
var lyr_names = ['SoilMoi0_10cm_inst','SoilMoi10_40cm_inst','SoilMoi40_100cm_inst','SoilMoi100_200cm_inst'];

for (var i = startYear; i<endYear ;i++) { 


var year = ee.String(ee.Number(i));
var yearE = ee.String(ee.Number(i+1)); // excluded, this is to include 31 december of year i


//var lyr = ee.ImageCollection('NASA/GLDAS/V021/NOAH/G025/T3H').select(lyr_names).filter(ee.Filter.date(year.cat('-01-01'), yearE.cat('-01-01'))).sort('system:time_start'); // GLDAS v 2.1
var lyr = ee.ImageCollection('NASA/GLDAS/V20/NOAH/G025/T3H').select(lyr_names).filter(ee.Filter.date(year.cat('-01-01'), yearE.cat('-01-01'))).sort('system:time_start'); // GLDAS v 2.0 for years <2000
//print(lyr.limit(5))
//var vis = {min: 1.99, max: 47.59, palette: ['blue', 'green', 'yellow', 'red']};
//Map.addLayer(lyr, {}, 'lyr');


//--------------
// Extract stats 
//--------------

// Average soil moisture
var lyr = lyr.mean().reproject(lyr.first().projection());
var bandNames = lyr.bandNames(); 
print(bandNames);
print(lyr);
//Map.addLayer(lyr.select(1))

// Points
var addVar = function (f1) { 
  var addVarBand = function (band, f2) {
     band = ee.String(band)
     f2 = ee.Feature(f2)
    var varBand = ee.String(band)
    var l = lyr.select(band);
    var r = l.reduceRegion({
            geometry: f1.geometry(),
            reducer: ee.Reducer.first(),
            //scale: res
            }).get(band)
                return f2.set(
                  varBand, r
                  )
            } 
  var f = ee.Feature(bandNames.iterate(addVarBand, f1))
    return ee.Feature(null, f.toDictionary(
      bandNames.add(id)))
};

var outPts = plots.map(addVar);
print(outPts.first().toDictionary(), 'Data extracted for one example plot point');



//----------------------
// Export
//----------------------

var tabPts = ee.FeatureCollection(outPts.toList(outPts.size()));
print(tabPts.limit(5));
Export.table.toDrive({
    collection: tabPts, 
    folder: 'Shrub_sites_update_2022-01-05',
    description: 'shrub_sites_NA_SoilMoisture_kgM2_Means_'+i+GLDASv,
    fileFormat: 'CSV'
});

}
