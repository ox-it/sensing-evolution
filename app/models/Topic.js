define(["backbone", "app/collections/ItemsCollection"], function(Backbone, ItemsCollection) {

  //Get all items. Each topic will build its own list of items.
  var allItems = new ItemsCollection();

  var Topic = Backbone.Model.extend({
    initialize: function () {
      //filter those items which are valid for this topic
      var topicItems = Topic.allItems.filter(function(item) {
        var itemHasCorrectTopic = (item.attributes.topic === this.attributes.slug);

        if(itemHasCorrectTopic) {
        //check that the item belongs to at least one trail to which the topic belongs
        var itemHasValidTrail = false;
          for(var i=0; i<this.attributes.trails.length; i++) {
            if (item.attributes.trails.indexOf(this.attributes.trails[i]) >= 0) {
              itemHasValidTrail = true;
              return true;
            }
          }
        }
      }, this);
      this.items = new ItemsCollection(topicItems);
    },

    parse: function (response) {
      var t = {};
      t.slug = response.slug;
      t.title = response.title;
      t.trails = [];

      //read in the list of trails into a single array. The trails are parameters of id trail[n]
      var foundEmpty = false;
      var i=1;
      while(!foundEmpty) {
        var trailKey = "trail" + i;
        if(response[trailKey]) {
           t.trails.push(response[trailKey]);
        } else {
          foundEmpty = true;
        }
        i++;
      }

        t.fixed_order=false;
        if(response.fixed_order=="true" || response.fixed_order=="TRUE") {
            t.fixed_order=true;
        }

      return t;
    },

    getItems: function() {
      return this.items;
    },

    //return a collection of items for this topic on the given trail
    getItemsForTrail: function(trailSlug) {
        var trailItems = this.items.filter(function(item) {
           return item.attributes.trails.indexOf(trailSlug) >= 0;
        });
        return new ItemsCollection(trailItems);
    }

  },
  {
    //class property of all items
    allItems: allItems,
      loadItems: function(callback) {
          allItems.fetch({success: callback});
      }
  }
  );

  return Topic;

});
