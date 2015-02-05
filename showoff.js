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
      m2.get('c').pop();
    }
    ,remko: function() {
      var d = new Date();
      m2._ku().c.pop();
    }
  }
  ko.applyBindings(tool2, $('#test2 .tools')[0]);


  //test 3
  userModel = ku.Model.extend({
    urlRoot: "/tdata/"
  });
  m3 = new ku.Model();
  m3.on('all', function() {
    $('#test3 pre').text(JSON.stringify(m3, null, " "))
  });
  var _user = new userModel({id: "820awnlnawlrgawrg"});
  m3.set('user', _user);
  _user.fetch().always(function() {
  });
  ku.applyBindings(m3, $('#test3 .content')[0]);


  //test4
  kidModel = ku.Model.extend();
  kidModelCollection = ku.Collection.extend({
    model: kidModel
  });
  familyModel = ku.Model.extend();
  familyModelCollection = ku.Collection.extend({
    model: familyModel
  })
  test4model = new ku.Model({
    c: new familyModelCollection()
  });
  test4model.get('c').add(new familyModel());
  
  t41k = new kidModelCollection([{id: 1, name: "jet"}, {id: 2, name: "jo"}]);
  test4model.get('c').add(new familyModel({kids: t41k}));
  t40k = new kidModelCollection([{name: "walter"}, {name: "reed"}]);

  dtrig = function() {
    test4model.get('c').at(0).unset('kids');
  }
  trig = function trig() {
    t40k = new kidModelCollection([{id: 1, name: "jet"}, {id: 2, name: "jo"}]);
    test4model.get('c').at(0).set({'kids': t40k});
    console.log(JSON.stringify(test4model.get('c').at(0).get('kids'), null, "\t"));
    console.log(JSON.stringify(ko.mapping.toJS(test4model._ku().c()[0].kids), null, "\t"));
  }
  trig();
  test4model._ku.jsko = function(o) {
    return JSON.stringify(ko.mapping(o), null, "  ");
  }
  ku.applyBindings(test4model, $('#test4 .content')[0]);

})();
