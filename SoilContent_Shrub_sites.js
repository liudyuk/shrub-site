//--------------------------------------------------------
// Authors:
// Script: Nezha Acil, University of Birmingham
// Site data: Daijun Liu, University of Birmingham
//--------------------------------------------------------

Map.setZoom(0);


//-------------------
// Parameters to edit
//-------------------

var siteFile = "Daijun/Shrub_sites_NA";  // Name of the file that contains site id and their locations in latlon WGS84
var id = 'ID'; // Name of the column containing site id 

var radiusBuffer = 500; // Buffer width to apply in meters
//var res = 250 // resolution of processing in meters (to align with SoilGrids)


//--------------
// Import
//--------------


// Updated list of available layers in GEE SoilGrid https://git.wur.nl/isric/soilgrids/soilgrids.notebooks/-/blob/master/markdown/access_on_gee.md 
//-------------------------------------------------------------------------------------------------------------------------------------------------
// bdod_mean > Bulk density)
// cec_mean > Cation exchange capacity at pH7
// cfvo_mean > Coarse fragments
// clay_mean > Clay
// nitrogen_mean > Total Nitrogen
// ocd_mean > Organic carbon density
// ocs_mean > Organic carbon stock
// phh2o_mean > pH in H2O
// sand_mean > Sand
// silt_mean > Silt
// soc_mean > Soil organic carbon

var lyr_name = 'bdod_mean'; // Layer to import from isric dataset https://git.wur.nl/isric/soilgrids/soilgrids.notebooks/-/blob/master/markdown/access_on_gee.md


var plots = ee.FeatureCollection("users/NXA807/"+siteFile);
var lyr = ee.Image(ee.String("projects/soilgrids-isric/"+ lyr_name));


//--------------
// Mapping
//--------------
Map.addLayer(lyr,{}, lyr_name);
Map.addLayer(plots);


//--------------
// Extract stats 
//--------------

// Add a band summarising all the layer's bands (depths 0-5cm, 5-15cm,15-30cm,30-60cm,60-100cm,100-200cm) (mean, median etc.) 
var lyr_mn = lyr.reduce(ee.Reducer.mean());
var lyr = lyr.addBands(lyr_mn.rename("Mean of all layers"));
var bandNames = lyr.bandNames(); 


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
}

var outPts = plots.map(addVar);
print(outPts.first().toDictionary(), 'Data extracted for one example plot point');


// Buffers around points
var addVar = function (f1) { 
  var addVarBand = function (band, f2) {
     band = ee.String(band)
     f2 = ee.Feature(f2)
    var varBand = ee.String(band)
    var l = lyr.select(band);
    var r = l.reduceRegion({
            geometry: f1.geometry().buffer(radiusBuffer),
            reducer: ee.Reducer.mean(),
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

var outBuf = plots.map(addVar);
print(outBuf.first().toDictionary(), 'Data extracted for one example buffered plot point');



//----------------------
// Export
//----------------------

var tabPts = ee.FeatureCollection(outPts.toList(outPts.size()));
print(tabPts.limit(5));
Export.table.toDrive({
    collection: tabPts, 
    folder: 'Shrub_sites_update_2022-01-05',
    description: 'Shrub_sites_NA_SoilContent_'+lyr_name+'_plotsPoints',
    fileFormat: 'CSV'
});

var tabBuf = ee.FeatureCollection(outBuf.toList(outBuf.size()));
Export.table.toDrive({
    collection: tabBuf , 
    folder: 'Shrub_sites_update_2022-01-05',
    description: 'Shrub_sites_NA_SoilContent_'+lyr_name+'_'+'plotsBuffered'+radiusBuffer+'m',
    fileFormat: 'CSV'
});




