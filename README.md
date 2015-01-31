# Knockup
What happens when Knockout and Backbone are Ben Stone and Alison Scott. You'll need to decide who is who though.

# Tested and works on

* Chromium/Chrome 39.0.2171.65
* Firefox 35.0.1

# Requirements
(These are what knockup was developed with, older versions may work but have not been tested.)

* [underscore](http://underscorejs.org/) 1.7.0
* [backbone](http://backbonejs.org/) 1.1.2
* [jQuery](https://jquery.com) 1.11.2
* [knockout](http://knockoutjs.com) 3.2.0
* [knockout.mapping](http://knockoutjs.com/documentation/plugins-mapping.html) 2.4.1

# Why?
You: What about [Knockback](http://kmalakoff.github.io/knockback/) or [Epoxy](http://epoxyjs.org/) if you like Knockout so much?

Me: Because. ...And I found Knockback and Epoxy to be obnoxious for my style. Granted my style could be really bad. Plus, CoffeeScript? Amirite? Also, knockup itself is 9K un-minified and un-gziped, 5K minified and less than 2K min/gziped. It's smaller than Epoxy is minified. I will allow knockup possibly being suckier and slower but I don't have benchmarks to prove it's not. It also does the most relaxing back-rubs.

# So...how do I use it?
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

![Magic!](http://snoj.us/miscfiles/magic.jpg)

# Got docs?

The only thing you need to know about Knockup is the following.

* ku.Model, the base to all. Replace any Backbone.Model with this.
* ku.Collection, same idea as ku.Model.
* ku.applyBindings, pretty much the same as ko.applyBindings but use a ku.Model instead.
 * You could also use ko.applyBindings(viewmodel._ku, domelement) if you felt like punching yourself in the face.

Otherwise, just use [knockout](http://knockoutjs.com/documentation/introduction.html) and [backbone's](http://backbonejs.org/) documentation. 
 
