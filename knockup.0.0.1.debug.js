(function() {
  window.ku = {};
  ku.fromBB = function() {
    var args =_.map(arguments, function(v) {
      return v;
    });
    var t = ko.mapping.fromJS.bind(null, args)();
    return t;  
  };
  ku.fromBB = ko.mapping.fromJS;
  ku.subscribeAll = function(/*koobj, bbobj, bbopts*/) {
    throw "A little something something for later.";
  };
  ku.Model = Backbone.Model.extend({
    initialize: function() {
      var self = this;
      //Backbone.Model.apply(this, arguments);
      this._ku = ku.fromBB(self.attributes);
      this._getkoview = function(i) {
        return self._ku;
      };
      this.on('change', function(uo, opts) {
        //if(opts.fromko) return;
        var to = {};
        _.each(uo.attributes, function(v, k) {
          if(typeof v._getkoview !== 'undefined') {
            to[k] = ko.mapping.toJS(v._getkoview());
          } else {
            to[k] = v;
          }
        });
        ku.fromBB(to, self._ku);

        _.keys(self._ku.__ko_mapping__.mappedProperties)
          .forEach(function(k) {
            if(typeof self._ku[k] === 'undefined')
              return;
            if(typeof self._ku[k]._ku != 'undefined') {
              return;
            }
            if(typeof self._ku[k].subscribe !== 'function')
              return;
            self._ku[k].subscribe(function(nv) {
              if(opts.fromko) return;
              self.set(k, nv, {fromko: true});
            });
          });
      });
    }
  });
  ku.Collection = Backbone.Collection.extend({
    model: ku.Model
    ,initialize: function() {
      var self = this;
      /*var tarr = self.models.map(function(v) { return v._getkoview() });
      self._ku = ko.mapping.fromJS(tarr);*/
      self._ku = ko.mapping.fromJS([]);
      self._getkoview = function(i) {
        return self._ku;
      };
      this.on('change', function(uo, opts) {
        //if(opts.fromko) return;
        var to = {};
        _.each(uo.attributes, function(v, k) {
          if(typeof v._getkoview !== 'undefined') {
            to[k] = ko.mapping.toJS(v._getkoview());
          } else {
            to[k] = v;
          }
        });
        ku.fromBB(to, self._ku);

        _.keys(self._ku.__ko_mapping__.mappedProperties)
          .forEach(function(k) {
            if(typeof self._ku[k] === 'undefined')
              return;
            if(typeof self._ku[k]._ku != 'undefined') {
              return;
            }
            if(typeof self._ku[k].subscribe !== 'function')
              return;
            self._ku[k].subscribe(function(nv) {
              if(opts.fromko) return;
              self.set(k, nv, {fromko: true});
            });
          });
      });

      var remap = function(collection, opts) {
        if(opts.fromko) return;
        var tarr = collection.map(function(v) {
          if(typeof v._getkoview === 'function')
            return v._getkoview();
          return v;
        });
        //ko.mapping.fromJS(tarr, self._ku);
        ko.mapping.fromJS(tarr, self._ku);
      };
      self.on('reset', remap)
      self.on('add', function(model, collection, opts) {
        remap(collection, opts);
      });
    }
  });
  ku.View = Backbone.View.extend();
  ku.applyBindings = function(view, element) {
    var koview = view._getkoview();
    ko.applyBindings(koview, element);
  };
})();