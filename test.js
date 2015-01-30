(function() {

  window.m1 = new ku.Model({test1: 11111});
  m1.on('all', function() {
    $('#test1-bb pre').text(JSON.stringify(m1, null, " "))
  });
  m1.set('inception', new ku.Model({innard: new Date()}))
  ku.applyBindings(m1, $('#test1')[0])

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
    $('#test2-bb pre').text(JSON.stringify(m2, null, " "))
  });
  m2.get('c').reset(ic);
  ku.applyBindings(m2, $('#test2')[0])

  var tool2 = {
    addbb: function() {
      var d = new Date();
      m2.get('c').add({id: d.getTime(), name: d.toString()});
    }
    ,addko: function() {
      var d = new Date();
      m2._ku().c.push({id: d.getTime(), name: d.toString()})
    }
  }
  ko.applyBindings(tool2, $('#tool2')[0]);
})();
