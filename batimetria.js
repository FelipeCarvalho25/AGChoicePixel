
 
// Mask out land and clouds
function mask(img, lSCL){
    var cloudBitMask = ee.Number(2).pow(10).int();
  var cirrusBitMask = ee.Number(2).pow(11).int();
  var qa = img.select('QA60');
  var ma = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0));
  if(lSCL){
    ma = ma.and(img.select(['SCL']).neq(3));
    ma = ma.and(img.select(['SCL']).neq(4));
    ma = ma.and(img.select(['SCL']).neq(5));
    ma = ma.and(img.select(['SCL']).neq(8));
    ma = ma.and(img.select(['SCL']).neq(9));
    ma = ma.and(img.select(['SCL']).neq(10));
  }
  ma = ma.and(img.select(['B9']).lt(300)); 
  ma = ma.and(img.select(['B9']).gt(50));
  ma = ma.and(img.select(['B3']).gt(100));
  ma = ma.focal_min({kernel: ee.Kernel.circle({radius: 1}), iterations: 1});
  img = img.mask(ma);

  var ndwi_revise = (img.select([2]).subtract(img.select([7]))).divide(img.select([2]).add(img.select([7])));
  img = img.updateMask(ndwi_revise.gt(0));
 
  return img;
}

// Create a FeatureCollection containing each points' band information and depth
function createPoints(el) {
  return ee.Feature(ee.Geometry.Point([el.get('X'),el.get('Y')], 'EPSG:32722'),
  {'depth': el.get('Z')})
}


// Calculate the NDWI value (Green and Blue bands) and the Reason (Green and Blue bands)
function calculateReason(el) {
  return ee.Feature(el.geometry()).set('depth', el.get('depth'))
  .set('ndwi', ee.Feature(ee.Number(el.get('B3')).subtract(el.get('B2')).divide(ee.Number(el.get('B3')).add(el.get('B2')))))
  .set('ratio', ee.Feature(ee.Number(el.get('B3')).multiply(1).log().divide(ee.Number(el.get('B2')).multiply(1).log())))
  .set('constant', 1)
}



// Create raster with the predicted depth
function createPredictionRaster(el) {
  var ndwi = el.select('B3').subtract(el.select('B2')).divide(el.select('B3').add(el.select('B2'))).rename('NDWI');
  el = el.addBands(ndwi);
  var depth = el.select('NDWI').multiply(ee.Number(slope)).add(ee.Number(yInt)).rename('depth');
  return el.addBands(depth);
}
exports.startBatimetria = function (genes){
  var table = ee.FeatureCollection("projects/ee-jfelipecarvalho1/assets/batimetria_babitonga_2018_50K"),
    geometry = 
    ee.Geometry.Polygon(
      [[[-48.624656947326656, -26.181710245683796],
      [-48.59530285186767, -26.22298800628459],
      [-48.57281521148681, -26.213901994461565],
      [-48.605087550354, -26.176472469036128]
      ]]),
      visRGB = {"min":0, "max":3000, "bands":["B4","B3", "B2"]},
      visDepth = {"bands":["depth"], "min":0, "max":20,"palette":["00FFFF","0000FF"]};
      
  // QA60 band cloud bits

  Map.setCenter(-48.5932,-26.1957, 14)
  var addQualityBands = function(image) {
    // Normalized difference vegetation index.
    var ndvi = image.normalizedDifference(['B8', 'B3']).multiply(-1);
    var qa = ((image.select(['B1']).multiply(ee.Number(ee.List(genes).get(0))))
    .add(image.select(['B2']).multiply(ee.Number(ee.List(genes).get(1))))
    .add(image.select(['B3']).multiply(ee.Number(ee.List(genes).get(2))))
    .add(image.select(['B4']).multiply(ee.Number(ee.List(genes).get(3))))
    .add(image.select(['B5']).multiply(ee.Number(ee.List(genes).get(4))))
    .add(image.select(['B6']).multiply(ee.Number(ee.List(genes).get(5))))
    .add(image.select(['B8']).multiply(ee.Number(ee.List(genes).get(6))))
    .add(image.normalizedDifference(['B8', 'B3']).multiply(ee.Number(ee.List(genes).get(7)))))
    .multiply(-0.1)
    .rename('QA');
    // Image timestamp as milliseconds since Unix epoch.
    return image.addBands([ndvi, qa]);
  };
  
  var addMask = function(image) {
    return mask(image.clip(geometry));
  };
  var points = table.map(createPoints);
  var sentinel = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterBounds(geometry).filterDate('2018-05-01', '2018-06-30');
  //print(sentinel)
  //sentinel = sentinel.filter(ee.Filter.date(ee.Date.fromYMD(2018,5,20),ee.Date.fromYMD(2018,5,21)));
  
  if(sentinel.size().eq(0)){
    sentinel = ee.ImageCollection('COPERNICUS/S2')
    .filterBounds(geometry).filterDate('2018-05-01', '2018-06-30');
    //sentinel = sentinel.filter(ee.Filter.date(ee.Date.fromYMD(2018,5,20),ee.Date.fromYMD(2018,5,21)));
  }
  //print(sentinel)
  sentinel = sentinel.map(addMask);
  sentinel = sentinel.map(addQualityBands);
  
  var temp = sentinel.toList(999);
  var image = ee.Image(temp.get(1))
  
  var im = image
  //Map.addLayer(im, visRGB, 'RGB');
  image = sentinel.qualityMosaic('QA');
  
  //print('All non-system image properties copied to the FeatureCollection',
       // image.copyProperties(im));
  
  // Associate each point with the band values retrived from the Sentinel image
  var pointFilter = points.filterBounds(geometry);
  var pointData = image.reduceRegions({
    collection: pointFilter,
    crs: ee.Projection('EPSG:32722'),
    scale: 10,
    reducer: ee.Reducer.median()
  });
  
  // Filter points with depth ≤ 17 meters
  pointData = pointData.filter(ee.Filter.lte('depth', 17))
  var trainingData = pointData.map(calculateReason, true)
  
  // Apply a Linear Regression model to the data
  var linearRegression = ee.Dictionary(trainingData.reduceColumns({
    reducer: ee.Reducer.linearRegression({
      numX: 2,
      numY: 1
    }),
    selectors: ['constant', 'ndwi', 'depth']
  }));
  
  var coefList = ee.Array(linearRegression.get('coefficients')).toList();
  
  var yInt = ee.List(coefList.get(0)).get(0); // y-intercept
  var slope = ee.List(coefList.get(1)).get(0); // slope
  
  //print('Interception = ', yInt);
  //print('Slope = ', slope);
  var predicted = function(sloping){
     // Predict depth based on the linear model results
    var p = function(el) {
      return ee.Feature(el.geometry()).set('depth', el.get('depth'))
      .set('predicted_depth', ee.Number(el.get('ndwi')).multiply(sloping).add(yInt))
      .set('diff', ee.Number(el.get('depth')).subtract(ee.Number(el.get('ndwi')).multiply(slope).add(yInt)).abs().pow(2))
    }
    return p
  }
  // Predict depth of the training data to measure RMSE
  var predictedData = trainingData.map(predicted(slope),  true)
  
  // Export.table.toDrive(predictedData, "predictedDepth200518")
  
  // Calculate RMSE value
  var rmse = ee.Number(
    predictedData
    .reduceColumns(ee.Reducer.sum(), ['diff'])
    .get('sum')
  )
  .divide(predictedData.size())
  .sqrt()
  //print('rmse = ', rmse);
  return rmse;
  
}

