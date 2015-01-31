(function() {

  window.m1 = new ku.Model({test1: 11111});
  m1.on('all', function() {
    $('#test1 pre').text(JSON.stringify(m1, null, " "))
  });
  m1.set('inception', new ku.Model({innard: new Date()}))
  ku.applyBindings(m1, $('#test1 .content')[0])

  window.ic = _.map(['Bat Man', 'Bruce Wayne', 'Abed Nadir'], function(v, i) {
    return {id: i, name: v};
  });
  window.m2 = new ku.Model();
  var collopts = {
    komap: {
      key: function(d) {
        return ko.utils.unwrapObservable(d.id);
      }
    }
  };
  m2.set({c: new ku.Collection([], collopts)})
  m2.get('c').on('all', function() {
    $('#test2 pre').text(JSON.stringify(m2, null, " "))
  });
  m2.get('c').reset(ic);
  ku.applyBindings(m2, $('#test2 .content')[0])

  var tool2 = {
    addbb: function() {
      var d = new Date();
      m2.get('c').add({id: d.getTime(), name: d.toString()});
    }
    ,addko: function() {
      var d = new Date();
      m2._ku().c.push({id: d.getTime(), name: d.toString()})
    }
    ,rembb: function() {
      var d = new Date();
      m2.get('c').pop(); //({id: d.getTime(), name: d.toString()});
    }
    ,remko: function() {
      var d = new Date();
      m2._ku().c.pop(); //({id: d.getTime(), name: d.toString()})
    }
  }
  ko.applyBindings(tool2, $('#test2 .tools')[0]);
})();
