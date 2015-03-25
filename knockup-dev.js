/*jslint browser: true , indent: 2, vars: true*/
/*global ko*/
(function(root, factory) {
  //Shamefully ripped and modified from Backbone.
  if (typeof exports !== 'undefined') {
    var _ = require('underscore');
    factory(root, exports, _);

  // Finally, as a browser global.
  } else {
    root.ku = factory(root, Backbone, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }
})(this, function(root, Backbone, _, $) {
  'use strict';

  var ku = {}; // = root.ku = {};

  ku._shared = {};

  ku._shared.komapkey = function (idAttribute, d) {
    if (!!d[idAttribute])
      return ko.utils.unwrapObservable(d[idAttribute]);
    else if (!!d._kuid)
      return ko.utils.unwrapObservable(d._kuid);
    return;
  };

  ku._shared._kucompile = function (opts) {
    var self = this;
    opts || (opts = {});
    //compile _kubase into _ku and subscribe to all children.

    //skip if updating ko if update came form ko
    if (!!!opts.fromko || !!opts.skipmap)
      ko.mapping.fromJS(self._kubase, self._komap, self._ku);

    ku.subscribeAll(self._ku, function (nv, obj, path, parr) {
      var koself = this;
      var lastbb = self;
      var lastobj = null;
      var o = _.reduce(parr, function (pv, cv, i) {
        if (i+2 > parr.length)
          return pv;
        if(pv._kuparent)
          lastbb = pv;

        if (pv instanceof Backbone.Model)
          return pv.get(cv);
        else if (pv instanceof Backbone.Collection)
          return pv.at(cv);
        else if (pv instanceof Array)
          return pv[cv];
      }, self);

      var lastkey = _.last(parr);

      var ov = (function() {
        try { return o.get(lastkey); } catch(ex) {}
        try { return o[lastkey]; } catch(ex) {}
        throw "ov is nothing";
      })();

      if(ov.toJSON)
        ov = ov.toJSON();

      if(_.isEqual(ko.mapping.toJS(nv), ov))
        return;

      if (!(o instanceof Backbone.Model || o instanceof Backbone.Collection) && typeof o !== 'undefined' && typeof o[lastkey] !== 'undefined') {
        o[lastkey] = nv;
        //todo trigger update
      } else if (o.get(lastkey) instanceof Backbone.Collection)
        o.get(lastkey).set(ko.mapping.toJS(nv), {merge: true, fromko: true});
      else if (typeof o.get(lastkey) !== 'undefined')
        o.set(lastkey, nv, {fromko: true});

    }, {overwrite: !!self._kuparent});


    if (!!!opts.frombubble || !!!opts.self)
      self.trigger('kububble', opts);
  };
  ku._shared._kuupdate = function (opts) {
    var self = this;
    opts || (opts = {});

    var to = {};
    if (self instanceof ku.Collection) {
      to = [];
    }
    //todo: check if self is model
    var type = "Model";
    if (self instanceof ku.Collection)
      type = "Collection";
    //var changedAttr = (self instanceof Backbone.Model && self.hasChanged()) ? self.changed : self.attributes;
    var changedAttr = self.attributes;
    var changedModel = self.models;

    /*if(self instanceof ku.Model) {
      changedModel = (self.hasChanged()) ? self.changed : self.attributes;
    }
    if(self instanceof ku.Collection) {
      changedModel = (self.hasChangedModels()) ? self.changedModels : self.models;
    }*/

    _.each(opts.values || changedAttr || self.models || [], function (v, k) {
      if ((v instanceof Backbone.Model ||
            v instanceof Backbone.Collection) &&
          typeof v._kuparent === 'undefined') {
        v._kuparent = self;
        //v.trigger('kuupdate', {self: true});
        ku._shared._kuupdate.call(v, {self: true});
      }
      if (type === "Model")
        to[k] = ku._extract(v);
      if (type === "Collection")
        to[k] = ku._extract(v);
        //to[k] = v.toJSON();
    });

    self._kubase = to;
    ku._shared._kucompile.call(self, opts); //self.trigger('kucompile', opts);
  };
  ku._shared._kububble = function (o, opts) {
    opts || (opts = {});
    var self = this;
    if (arguments.length == 1) {
      if (!(o instanceof Backbone.Model || o instanceof Backbone.Collection)) {
        opts = o;
        o = self;
      }
      opts.frombubble = self;
    } else if (!(o instanceof Backbone.Model || o instanceof Backbone.Collection)) {
      throw "ku.bubble needs to be a backbone.model or collection"
    }
    opts || (opts = {});
    opts.frombubble = true;

    if (typeof opts.trail == 'undefined')
      opts.trail = [];
    opts.trail.push(self);

    //console.log(o, opts)

    if (arguments.length == 2)
      self.trigger('kuupdate', opts);
    if (self._kuparent)
      self._kuparent.trigger('kububble', o, opts);
    else
      self._ku.valueHasMutated();
  };


  ku.Model = Backbone.Model.extend({
    constructor: function (attr, opts) {
      attr || (attr = {});
      opts || (opts = {});
      Backbone.Model.call(this, attr, opts);

      var self = this;

      //if we're initialized from a collection or it was just assigned a parent
      if (opts.collection)
        self._kuparent = opts.collection;
      if (opts.kuparent)
        self._kuparent = otps.kuparent;

      //ko.mapping.fromJS mapping variable.
      self._komap = opts.komap || {};
      self._komap.key || (self._komap.key = ku._shared.komapkey.bind(null, self.idAttribute));

      self._event_change = function (model, opts) {
        opts || (opts = {});

        //assign _kuparent
        _.each(self.attributes, function (v) {
          if(v instanceof Backbone.Model || v instanceof Backbone.Collection)
            v._kuparent == self;
        });
        self.trigger('kuupdate', opts);
      };
      self.on('change', self._event_change);

      self.on('kuupdate', ku._shared._kuupdate.bind(self));
      self.on('kucompile', ku._shared._kucompile.bind(self));
      self.on('kububble', ku._shared._kububble.bind(self));
    }
    ,initialize: function (attrs, opts) {
      var self = this;

      if (typeof self.get(self.idAttribute) === 'undefined')
        self.set('_kuid', self.cid);

      self._kubase = ko.observable({});
      self._ku = ko.mapping.fromJS(self._kubase);

      //self.trigger('kuupdate');
      ku._shared._kuupdate.call(self, {values: attrs})

      //map events
      if(opts.events) {
        _.forEach(opts.events, function(events, method) {
          _.forEach(events, function(cb, eventname) {
            if(typeof cb === 'function')
              self[method](eventname, cb);
            if(Array.isArray(cb))
              self[method].apply(self, cb);
          });
        });
      }
    }
    ,set: function(key, val, options) {
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        options = val;
      }

      options || (options = {});

      if (options.fromko)
        return this;

      return Backbone.Model.prototype.set.apply(this, arguments);
    }
  });

  ku.Collection = Backbone.Collection.extend({
    model: ku.Model
    ,constructor: function (models, opts) {
      var self = this;
      models || (models = []);
      opts || (opts = {});
      Backbone.Collection.call(self, models, opts);

      if (opts.kuparent)
        self._kuparent = otps.kuparent;

      this.cid = _.unique('c');

      //ko.mapping.fromJS mapping variable.
      this._komap = opts.komap || {};
      self._komap.key || (self._komap.key = ku._shared.komapkey.bind(null, self.idAttribute));

      self.changedModels = [];

      var changedModels = function(opts) {
        var iself = this;
        self.changedModels = _.filter(self.models, function(v) {
          return v.hasChanged();
        });
      }
      self.hasChangedModels = function() {
        return self.changedModels.length > 0;
      }

      self._event_add = function (model, coll, opts) {
        changedModels(opts);
        self.trigger('kuupdate', opts);
      };
      self._event_remove = function (model, coll, opts) {
        changedModels(opts);
        self.trigger('kuupdate', opts);
      };
      self._event_reset = function (coll, opts) {
        if (opts.fromko) return;
        changedModels(opts);
        self.trigger('kuupdate', opts);
      }
      self.on('add', self._event_add)
      self.on('remove', self._event_remove)
      self.on('reset', self._event_reset)

      self.on('kuupdate', ku._shared._kuupdate.bind(self));
      self.on('kucompile', ku._shared._kucompile.bind(self));
      self.on('kububble', ku._shared._kububble.bind(self));
      self.on('kububble', function(o, opts) {
        changedModels(opts);
      })
    }
    ,initialize: function(models, opts) {
      //Backbone.Collection.prototype.initialize.call(this, models, opts)
      var self = this;
      if (typeof self.get(self.idAttribute) === 'undefined')
        self.set('_kuid', self.cid);
      self._kubase = ko.observableArray([]);
      self._ku = ko.mapping.fromJS(self._kubase);
      self.trigger('kuupdate', {values: self.models});

      if(opts.events) {
        _.forEach(opts.events, function(events, method) {
          _.forEach(events, function(cb, eventname) {
            if(typeof cb === 'function')
              self[method](eventname, cb);
            if(Array.isArray(cb))
              self[method].apply(self, cb);
          });
        });
      }
    }
    ,add: function(models, opts) {
      opts || (opts = {});
      if(opts.fromko)
        return this;
      return Backbone.Collection.prototype.add.apply(this, arguments);
    }
    ,remove: function(models, opts) {
      opts || (opts = {});
      if(opts.fromko)
        return this;
      return Backbone.Collection.prototype.remove.apply(this, arguments);
    }
    ,reset: function(models, opts) {
      opts || (opts = {});
      if(opts.fromko)
        return this;
      return Backbone.Collection.prototype.reset.apply(this, arguments);
    }
    ,push: function(model, opts) {
      opts || (opts = {});
      if(opts.fromko)
        return this;
      return Backbone.Collection.prototype.push.apply(this, arguments);
    }
    ,pop: function(opts) {
      opts || (opts = {});
      if(opts.fromko)
        return this;
      return Backbone.Collection.prototype.pop.apply(this, arguments);
    }
  })


  //
  //  ku utilities
  //

  //wrapper for ko.applyBindings.
  //or you could do ko.applyBindings(ku.Model._ku);
  ku.applyBindings = function (view, element) {
    //var koview = view._ku;
    view.trigger('kuupdate')
    ko.applyBindings(view._ku, element);
  };
  ku._extractRaw = function (v) {
    if (v instanceof ku.Model) {
      return v.attributes;
    }
    if (v instanceof ku.Collection) {
      return v._ku;
    }
  }
  ku._extract = function (v) {
    if (typeof v === 'undefined')
      return;

    if (v instanceof ku.Model) {
      return v._ku;
    }
    if (v instanceof ku.Collection) {
      return v._ku;
    }
    if (v instanceof Backbone.Model) {
      return ku._extract(v.attributes);
    }
    if (v instanceof Backbone.Collection) {
      return _.map(v.models, ku._extract);
    }
    if (typeof v.__ko_proto__ !== 'undefined' || typeof v.__ko_mapping__ !== 'undefined')
      return ko.mapping.fromJS(v)
    else
      return v;
  };

  //apply ko subscription to all children of mapped object
  ku.subscribeAll = function (koobj, cb, opts) {
    opts || (opts = {})
    opts.dispose = opts.dispose || false;
    var keys = _.filter(_.keys(koobj.__ko_mapping__.mappedProperties), function (v) {
      return !/__ko_mapping__/.test(v);
    });

    opts.id = opts.id || "kusubscription";

    _.each(keys, function (fullkey) {
      var ref = koobj;
      var lkey = null;
      var patharray = [];
      fullkey.match(/(\[[0-9]+\]|([^\[]*))/ig).forEach(function (v2) {
        if (/.+\..+/.test(v2)) {
          v2.split('.').forEach(function (v) {
            if (v) patharray.push(v);
          });
        } else {
          var t = v2.replace(/[\.\[\]]/g, "");
          if (t) patharray.push(t);
        }
      });

      var o = _.reduce(patharray, function (pv, cv, i) {
        if (i+2 > patharray.length)
          return (typeof pv === 'function') ? pv() : pv;

        if (typeof pv === 'function')
          return pv()[cv];
        else if (typeof pv !== 'undefined' && typeof pv[cv] !== 'undefined')
          return pv[cv];
        else if(typeof pv === 'undefined');
        else
          throw "something went wrong. Send code and data samples to knockup on github.";
      }, koobj);

      var lastkey = _.last(patharray);

      //doesn't exist for some reason...skip
      if (typeof o === 'undefined' || typeof o[lastkey] === 'undefined')
        return;

      if (typeof o[lastkey] === 'function' && typeof o[lastkey].__ko_proto__ !== 'undefined') {
        var alreadysetup = false;
        if(opts.overwrite && typeof o[lastkey]._subscriptions.change !== 'undefined') {
          o[lastkey]._subscriptions.change = _.filter(o[lastkey]._subscriptions.change, function(v, i) {
            return !!!v[opts.id];
          });
        } else if (typeof o[lastkey]._subscriptions.change !== 'undefined') {
          alreadysetup = _.reduce(o[lastkey]._subscriptions.change, function (pv, cv) {
            return pv || cv[opts.id] || false;
          }, alreadysetup);

          //already have a subscription setup.
          if (alreadysetup && !!!opts.notku)
            return;
        } else {
          o[lastkey]._subscriptions.change = [];
        }

        var dispose;
        var s = new ko.subscription(o[lastkey], function (nv) {
          cb.call((opts.bindto || this), nv, this, fullkey, patharray);
        });
        if(!!!opts.notku)
          s[opts.id] = true;
        o[lastkey]._subscriptions.change.push(s);
      }
    });// end each(keys)
  };


  ku.getKOKeys = function(koobj, opts) {
    opts || (opts = {});

    opts.map = (typeof opts.map === 'undefined') ? true : opts.map;

    var keys = _.filter(_.keys(koobj.__ko_mapping__.mappedProperties), function (v) {
      return !/__ko_mapping__/.test(v);
    });

    return _.map(keys, function(fullkey) {
      var patharray = [];
      fullkey.match(/(\[[0-9]+\]|([^\[]*))/ig).forEach(function (v2) {
        if (/.+\..+/.test(v2)) {
          v2.split('.').forEach(function (v) {
            if (v) patharray.push(v);
          });
        } else {
          var t = v2.replace(/[\.\[\]]/g, "");
          if (t) patharray.push(t);
        }
      });
      var rtn = { fullpath: fullkey, patharray: patharray };


      var o = _.reduce(patharray, function (pv, cv, i) {
        if (i+2 > patharray.length)
          return (typeof pv === 'function') ? pv() : pv;

        if (typeof pv === 'function')
          return pv()[cv];
        else if (typeof pv !== 'undefined' && typeof pv[cv] !== 'undefined')
          return pv[cv];
        else if(typeof pv === 'undefined');
        else
          throw "something went wrong. Send code and data samples to knockup on github.";
      }, koobj);

      if (typeof o === 'undefined') {
        return;
      } else if (typeof o !== 'undefined' && opts.map) {
        rtn.ko = o;
        rtn.value = o[_.last(patharray)];
      }
      return rtn;
    }).filter(function(v) {
      return typeof v !== 'undefined';
    });
  };

  ku.mapBB = function(koobj, bbobj) {
    var keys = ku.getKOKeys(koobj);
    _.forEach(keys, function(v) {
      var o = _.reduce(v.patharray, function (pv, cv, i) {
        if (i+2 > v.patharray.length)
          return pv;
        if (pv instanceof Backbone.Model)
            return pv.get(cv);
        if (pv instanceof Backbone.Collection)
          return pv.at(cv);
        if (pv instanceof Array)
          return pv[cv];
      }, bbobj);

      if (typeof o !== 'undefined') {
        v.bb = o;
      }
    });

    return keys;
  };

  //
  // overwride KO stuff with awesome _ features.
  //
  ko.observable['fn'].isDifferent = function (oldValue, newValue) {
    return !_.isEqual(oldValue, newValue);
  };

  return ku;
});