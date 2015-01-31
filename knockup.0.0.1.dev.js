/*jslint browser: true , indent: 2, vars: true*/
/*global ko*/
(function () {
  'use strict';
  var ku = window.ku = new (function ku() {})();
  ku._shared = {};
  ku._shared.komapkey = function (idAttribute, d) {
    if (d[idAttribute])
      return ko.utils.unwrapObservable(d[idAttribute]);
    return;
  };
  ku._shared._kucompile = function (opts) {
    var self = this;
    opts || (opts = {});
    //compile _kubase into _ku and subscribe to all children.

    //skip if updating ko if update came form ko
    if (!!!opts.fromko)
      ko.mapping.fromJS(self._kubase, self._komap, self._ku);

    ku.subscribeAll(self._ku, function (nv, obj, path, parr) {
      var koself = this;
      var o = _.reduce(parr, function (pv, cv, i) {
        if (i+2 > parr.length)
          return pv;
        if (pv instanceof Backbone.Model)
            return pv.get(cv);
        if (pv instanceof Backbone.Collection)
          return pv.at(cv);
        if (pv instanceof Array)
          return pv[cv];
      }, self);

      var lastkey = _.last(parr);
      if (o.get(lastkey) instanceof Backbone.Collection)
        o.get(lastkey).set(ko.mapping.toJS(nv), {merge: true, fromko: true});
      else
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

    _.each(self.attributes || self.models || [], function (v, k) {
      if ((v instanceof Backbone.Model || 
               v instanceof Backbone.Collection) && 
         typeof v._kuparent === 'undefined') {
        v._kuparent = self;
        v.trigger('kuupdate', {self: true});
      }
      if (type === "Model")
        to[k] = ku._extract(v);
      if (type === "Collection")
        to[k] = v.toJSON();
    });

    self._kubase = to;
    self.trigger('kucompile');
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
          v._kuparent == self;
        });
        self.trigger('kuupdate', opts);
      };
      self.on('change', self._event_change);

      self.on('kuupdate', ku._shared._kuupdate.bind(self));
      self.on('kucompile', ku._shared._kucompile.bind(self));
      self.on('kububble', ku._shared._kububble.bind(self));
    }
    ,initialize: function () {
      var self = this;

      if (typeof self.get(self.idAttribute) === 'undefined')
        self.set(self.idAttribute, self.cid);

      self._kubase = ko.observable({});
      self._ku = ko.mapping.fromJS(self._kubase);
      self.trigger('kuupdate');
    }
  });

  ku.Collection = Backbone.Collection.extend({
    model: ku.Model
    ,constructor: function (models, opts) {
      var self = this;
      models || (models = {});
      opts || (opts = {});
      Backbone.Collection.call(self, models, opts);

      if (opts.kuparent)
        self._kuparent = otps.kuparent;

      this.cid = _.unique('c');
      //this.set(this.idAttribute, this.cid);
      
      //ko.mapping.fromJS mapping variable.
      this._komap = opts.komap || {};
      self._komap.key || (self._komap.key = ku._shared.komapkey.bind(null, self.idAttribute));
      
      self._event_addremove = function (model, coll, opts) {
        self.trigger('kuupdate', opts);
      };
      self._event_reset = function (coll, opts) {
        if (opts.fromko) return;
        self.trigger('kuupdate', opts);
      }
      self.on('add', self._event_addremove)
      self.on('remove', self._event_addremove)
      self.on('reset', self._event_reset)

      self.on('kuupdate', ku._shared._kuupdate.bind(self));
      self.on('kucompile', ku._shared._kucompile.bind(self));
      self.on('kububble', ku._shared._kububble.bind(self));
    }
    ,initialize: function (models, opts) {
      var self = this;
      if (typeof self.get(self.idAttribute) === 'undefined')
        self.set(self.idAttribute, self.cid);
      self._kubase = ko.observableArray([]);
      self._ku = ko.mapping.fromJS(self._kubase);
      self.trigger('kuupdate');
    }
  })


  //
  //  ku utilities
  //

  //wrapper for ko.applyBindings.
  //or you could do ko.applyBindings(ku.Model._ku);
  ku.applyBindings = function (view, element) {
    //var koview = view._ku;
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
    if (typeof v.__ko_proto__ !== 'undefined')
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
        else if (typeof pv[cv] !== 'undefined')
          return pv[cv];
        else
          throw "something went wrong. Send code and data samples to knockup on github.";
      }, koobj);

      var lastkey = _.last(patharray);
      
      //doesn't exist for some reason...skip
      if (typeof o === 'undefined' || typeof o[lastkey] === 'undefined')
        return;

      if (typeof o[lastkey] === 'function' && typeof o[lastkey].__ko_proto__ !== 'undefined') {
        var alreadysetup = false;
        if (opts.overwrite && typeof o[lastkey]._subscriptions.change !== 'undefined') {
          o[lastkey]._subscriptions.change = _.filter(o[lastkey]._subscriptions.change, function (v, i) {
            return !!!v._kusubscription;
          })
        } else if (typeof o[lastkey]._subscriptions.change !== 'undefined') {
          alreadysetup = _.reduce(o[lastkey]._subscriptions.change, function (pv, cv) {
            return pv || cv._kusubscription || false;
          }, alreadysetup);

          //already have a subscription setup.
          if (alreadysetup)
            return;
        } else {
          o[lastkey]._subscriptions.change = [];
        }

        var s = new ko.subscription(o[lastkey], function (nv) {
          cb.call((opts.bindto || this), nv, this, fullkey, patharray);
        }, opts.dispose);
        s._kusubscription = true;
        o[lastkey]._subscriptions.change.push(s);
      }
    });// end each(keys)
  };
})();
