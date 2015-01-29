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
  ku.subscribeAll = function(koobj, cb, opts) {
    opts || (opts = {})

    opts.dispose = opts.dispose || false;

    if(!koobj || !koobj.__ko_mapping__) return;
    var tko = koobj;
    if(typeof koobj.__ko_mapping__._ku_mapped == 'undefined')
      koobj.__ko_mapping__._ku_mapped = {};
    Object.keys(koobj.__ko_mapping__.mappedProperties)
      .forEach(function(fullkey) {
        if(/__ko_mapping__/.test(fullkey))
          return;
        if(/__ko_proto__/.test(fullkey))
          return;

        var ref = tko;
        var lkey = null;
        var keys = [];
        fullkey.match(/(\[[0-9]+\]|([^\[]*))/ig).forEach(function(v2) {
          if(/.+\..+/.test(v2)) {
            v2.split('.').forEach(function(v) {
              keys.push(v);
            });
          } else {
            keys.push(v2.replace(/[\.\[\]]/g, ""));
          }
        });
        var fkeys = keys.filter(function(v) {return typeof v !== 'undefined' && v != ''; });
        fkeys.filter(function(v) {return typeof v !== 'undefined' && v != ''; })
          .forEach(function(k, i, arr) {
            lkey = k;
            if(i+1 < arr.length) {
              if(ref[lkey]) {
                ref = ref[lkey];
              } else if(typeof ref == 'function' && typeof ref()[lkey] !== 'undefined') {
                ref = ref()[lkey];
              } else {
                //throw "danger will robinson"
              }

              if(typeof ref == 'function' && Array.isArray(ref()))
                ref = ref();
            }
          });
        if(ref[lkey] && ref[lkey].subscribe && ref[lkey]._subscriptions) {
          var skip = false;
          if(typeof ref[lkey]._subscriptions.change !== 'undefined') {
            skip = ref[lkey]._subscriptions.change.reduce(function(pv, cv) {
              return (!!(pv || cv._kuf))
            }, false);
            if(skip) return;
          }
          //var f = cb.bind(opts.bo || null, fullkey, fkeys)
          //f._kuf = true;
          //ref[lkey].subscribe(f);
          //koobj.__ko_mapping__._ku_mapped[fullkey] = 1;
          //var s = new ko.subscription(ref[lkey], cb.bind(opts.bo || null, fullkey, fkeys));
          var s = new ko.subscription(ref[lkey], function(nv) {
            cb.call(this, fullkey, fkeys, nv);
          });
          s._kuf = true;
          if(typeof ref[lkey]._subscriptions.change === 'undefined')
            ref[lkey]._subscriptions.change = [];
          ref[lkey]._subscriptions.change.push(s);
        }
      });
  };
  ku.Model = Backbone.Model.extend({
    initialize: function() {
      var self = this;
      //Backbone.Model.apply(this, arguments);
      self._ku_base = {};
      self._ku = ko.mapping.fromJS(self._ku_base);

      self._kucompile_opts = {};
      self._kucompile = function(opts) {
        opts || (opts = {});
        console.log('ku.mod compile opts.fromko', opts.fromko)
        //if(opts.fromko) return;
        //self._kucompile_opts.fromko = opts.fromko;

        if(typeof self._ku_parent !== 'undefined')
          return;
        if(!!!opts.fromko) ko.mapping.fromJS(self._ku_base, self._ku);
        ku.subscribeAll(self._ku, function(pstring, parray, nv) {
          console.log("ku.model", this);
          console.log("ku.model", arguments);
          console.log("ku.model", self._kucompile_opts)
          if(self._kucompile_opts.fromko) {
            delete self._kucompile_opts.fromko
            return;
          }
          var o = parray.reduce(function(pv, cv, i) {
            if(i+2 > parray.length) return pv;

            if(pv instanceof Backbone.Model)
              return pv.get(cv);
            if(pv instanceof Backbone.Collection)
              return pv.at(cv);
            if(pv instanceof Array)
              return pv[cv];
          }, self);
          try {
            if(nv instanceof Array) {
              nv = ko.mapping.toJS(nv);
            }
            var k = _.last(parray);
            if(o.get(k) instanceof Backbone.Collection)
              o.get(k).reset(nv, {fromko: true})
            else
              o.set(k, nv, {fromko: true});
          } catch (e) {
            throw e;
          }
        })
      };
      self._getkoview = function() {
        if(typeof self._ku_parent !== 'undefined')
          return self._ku_base;
        return self._ku;
      }
      self._kuupdate = function(model, opts) {
        opts || (opts = {});
        console.log('ku.mod update opts.fromko', opts.fromko)
        var to = {};
        _.each(self.attributes, function(v, k) {
          if(v instanceof Backbone.Model || v instanceof Backbone.Collection)
            v._ku_parent = self;
          if(v instanceof ku.Model) {
            to[k] = v._ku_base;
            return;
          }
          if(v instanceof ku.Collection) {
            to[k] = v._ku_base;
            return;
          }
          if(v instanceof Backbone.Model) {
            to[k] = v.attributes;
            return;
          }
          if(v instanceof Backbone.Collection) {
            to[k] = v.models;
            return;
          }
          if(typeof v.__ko_mapping__ !== 'undefined' || typeof v.__ko_proto__ !== 'undefined')
            to[k] = ko.mapping.toJS(v);
          else
            to[k] = v;
        });

        self._ku_base = to;
        self._kucompile(opts);
        if(self._ku_parent)
          self._ku_parent.trigger('kuchange', self);
      };

      self._kuupdate();
      this.on('change', self._kuupdate);
      this.on('kuchange', function(o, opts) {
        //if(opts.fromko) return;
        self._kuupdate(null, opts);
        if(self._ku_parent)
          self._ku_parent.trigger('kuchange', o, opts)
        //console.log("ku.model kuchange");
      })
      this.on('change', function(uo, opts) {
        /*//if(opts.fromko) return;
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
          });*/
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
      self._ku_base = [];
      self._kucompile = function(opts) {
        opts || (opts = {});
        console.log('ku.coll opts.fromko', opts.fromko)
        
        if(typeof self._ku_parent !== 'undefined')
          return -1;
        if(!!!opts.fromko) ko.mapping.fromJS(self._ku_base, self._ku);
        ku.subscribeAll(self._ku, function(pstring, parray, nv) {
          console.log("ku.collection")
          var o = parray.reduce(function(pv, cv, i) {
            if(i+2 > parray.length) return pv;

            return pv.get(cv);
          }, self);
          //o.set(parray[parray.length-1], nv)
        })
      };
      self._getkoview = function() {
        if(typeof self._ku_parent !== 'undefined')
          return self._ku_base;
        return self._ku;
      };
      /*this.on('change', function(uo, opts) {
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
      });*/

      var remap = function(collection, opts) {
        //if(opts.fromko) return;
        console.log("remap", opts.fromko);
        
        var tarr = collection.map(function(v) {
          if(v instanceof Backbone.Model)
            v._ku_parent = self;
          if(typeof v._getkoview === 'function')
            return v._getkoview();
          return v;
        });
        //ko.mapping.fromJS(tarr, self._ku);
        //ko.mapping.fromJS(tarr, self._ku);
        self._ku_base = tarr;
        //if(opts.fromko) return;
        self._kucompile(opts);
        if(self._ku_parent)
          self._ku_parent.trigger('kuchange', self, opts);
      };
      self.on('reset', remap)
      self.on('add', function(model, collection, opts) {
        remap(collection, opts);
      });
      this.on('kuchange', function(o, opts) {
        console.log("ku.collection kuchange")
        if(self._ku_parent)
          self._ku_parent.trigger('kuchange', o, opts);
      })
    }
  });
  ku.View = Backbone.View.extend();
  ku.applyBindings = function(view, element) {
    var koview = view._getkoview();
    ko.applyBindings(koview, element);
  };
})();
