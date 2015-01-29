(function() {
  $d = {};
  var model = $d.model = new ku.Model({test1: 1234});
  model.set('a', 11111234);
  ku.applyBindings(model, $('#test1')[0]);
  setTimeout(function() {
    model._ku.test1(new Date());
  }, 1000)
  var m2 = $d.m2 = new ku.Model();
  var coll = $d.coll = new ku.Collection()
  coll.reset([1,2,3,4,5,6,7,9].map(function() { return {h: arguments[0]}; }));
  //coll.reset()
  m2.set('coll', coll)
  ku.applyBindings(m2, $('#test2')[0]);
})();
