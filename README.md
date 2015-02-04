# Knockup
What happens when Knockout and Backbone are Ben Stone and Alison Scott. You'll need to decide who is who though.

# Tested and works on

* Chromium/Chrome 39.0.2171.65
* Firefox 35.0.1
* Internet Explorer 11.0.9600/11.0.15

# Requirements
These are what knockup was developed with, older versions may work but have not been tested. Also please note that the development versions are the only ones tested with.

* [underscore](http://underscorejs.org/) 1.7.0
* [backbone](http://backbonejs.org/) 1.1.2
* [jQuery](https://jquery.com) 1.11.2
* [knockout](http://knockoutjs.com) (dev/debug version) 3.2.0
* [knockout.mapping](http://knockoutjs.com/documentation/plugins-mapping.html) 2.4.1

# Why?
You: What about [Knockback](http://kmalakoff.github.io/knockback/) or [Epoxy](http://epoxyjs.org/) if you like Knockout so much?

Me: Because. ...And I found Knockback and Epoxy to be obnoxious for my style. Granted my style could be really bad. Plus, CoffeeScript? Amirite? ~~Also, knockup itself is 9K un-minified and un-gziped, 5K minified and less than 2K min/gziped. It's smaller than Epoxy is minified.~~ I will allow knockup possibly being suckier and slower but I don't have benchmarks to prove it's not. It also does the most relaxing back-rubs.

The real reason is those other libraries didn't seem to handle nested objects well. Knockup does, every attribute and array contained within a model has two-way updates with knockout. So no matter where the model is updated.

# So...how does it work and how I use it?

![Magic!](http://snoj.us/miscfiles/magic.jpg)

Pretty much like you would knockout for views and backbone for model management. I'm using the right terms, right? Frak it, lets do an exercise.

```
var viewmodel = new ku.Model({stuff: "I", want: "to track"});
viewmodel.set('awesomecharacters', new ku.Collection());

viewmodel.get('awesomecharacters').add([{name: "Batman"}, {name: "Abed"}, {name: "Troy"}, {name: "Inspector Spacetime"}]);

ku.applyBindings(viewmodel, $('#page'))
```

You: "That's neat and all, but what about syncing data (save & fetch)?"

Me: "Just use 'em?"

```
vm = new ku.Model();
rdata = ku.Model.extend({urlRoot: '/allabout', idAttribute: 'bass'})
somedata = new rdata({bass: 'notreble'});
vm.set('value', somedata);
ku.applyBindings(vm, $('#page')[0]);

somedata.fetch();
```

You: I need to know when stuff happens.

Me: That's not really a question. You can use Backbone's event system or Knockout's, but Backbone's is currently easier to access.

```
vm = new ku.Model({});
vm.on('change:dangerlvl', function() {
  if(vm.get('dangerlvl') > 0) alert('Danger Will Robinson! Danger!');
});
vm._ku().dangerlvl.subscribe(function(nv) {
  if(vm.get('dangerlvl') < 1) alert('Danger levels have dropped to an acceptable value.');
});
```

You: I've extended ku.Model, but my code fails.

Me: Have you executed the necesseary functions?

```
customModel = ku.Model.extend({
  //if constructor is overridden
  constructor: function(attrs, opts) {
    ku.Model.call(this, attrs, opts);
  },
  //if initialize is overridden
  initialize: function(attrs, opts) {
    ku.Model.prototype.initialize.call(this, attrs, opts);
  }
});
```

# Got docs?

The only thing you need to know about Knockup is the following.

* ku.Model, the base to all. Replace any Backbone.Model with this.
* ku.Collection, same idea as ku.Model.
* ku.applyBindings, pretty much the same as ko.applyBindings but use a ku.Model instead.
 * You could also use ko.applyBindings(viewmodel._ku, domelement) if you felt like punching yourself in the face.

Otherwise, just use [knockout](http://knockoutjs.com/documentation/introduction.html) and [backbone's](http://backbonejs.org/) documentation. 
 
