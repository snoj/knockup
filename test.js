(function() {
  $d = {};
  var model = $d.model = new ku.Model({test1: 1234});
  model.set('a', 11111234);
  model.set('inception', new ku.Model({innard: new Date()}))
  ku.applyBindings(model, $('#test1')[0]);
  setInterval(function() {
    //model._ku.a("update from KO! " + (new Date()));
  }, 1900)
  model.on('all', function() {
    $('#test1-bb pre').text(JSON.stringify(model))
  });

  /*var m2 = $d.m2 = new ku.Model();
  var coll = $d.coll = new ku.Collection()
  coll.on('all', function() {
    $('#test2-bb pre').text(JSON.stringify(ko.mapping.toJS(m2._ku)))
  })
  coll.reset([1,2,3,4,5,6,7,9].map(function() { return {h: arguments[0]}; }));
  //coll.reset()
  setInterval(function() {
    coll.add({h: Date.now()});
    //console.log(coll.length);
  }, (Math.random() * 30000));
  m2.set('coll', coll)
  ku.applyBindings(m2, $('#test2')[0]);*/

  var m3 = $d.m3 = new ku.Model({});
  var coll = $d.coll = new ku.Collection();
  coll.reset([1,2,3,4].map(function() { return {id: arguments[0], h: arguments[0]}; }));
  coll.on('all', function() {
    $('#test2-bb pre').text(JSON.stringify(ko.mapping.toJS(m3._ku)))
  })
  m3.set('c', coll);

  setInterval(function() {
    var d = new Date();
    coll.add({id: d.getTime(), h: d.toString()});
  }, 5000);
  ku.applyBindings(m3, $('#test2')[0]);
})();

window.t = function(a, i) {
  var r = {};
  var verboden = {__ko_mapping__: 1};
  _.forEach(a._ku || a, function(v, k) {
    if(verboden[k])
      return;
  });
};
