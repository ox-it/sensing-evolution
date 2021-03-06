define(["backbone", "jquery", "underscore",
          "app/collections/TrailsCollection",
          "app/views/TrailsView", "app/views/TrailInstructionsView", "app/views/TrailIntroView", "app/views/ItemView", "app/views/FinishedView",
          "app/views/ContentView", "app/models/Session", "app/views/NavView", "app/views/DashboardView", "app/views/ResumeView"],
  function(Backbone, $, _,
            TrailsCollection,
            TrailsView, TrailInstructionsView, TrailIntroView, ItemView, FinishedView,
            ContentView, Session, NavView, DashboardView, ResumeView) {

    var SEVRouter = Backbone.Router.extend({
        initialize: function() {
          //initialize the collections
          this.allTrails = new TrailsCollection();
          this.allTrails.fetch({
            error: function(coll, resp, opt) {
              console.log("error fetching trails: ");
              console.log(resp);
            }
          });

            //create the container content-view
            this.contentView = new ContentView({el:$('#content')});
        },

        routes: {
            "": "resume_ui",
            "home": "home",
            "trail/:trail/instructions/:num": "trail_instructions",
            "trail_video/:trail": "trail_video",
            "item/:item": "item",
            "finished": "finished",
            "restart": "restart",
            "resume": "resume",
            "dashboard": "dashboard"
        },
        resume_ui: function() {
          if(typeof(Storage)!=="undefined" && localStorage.getItem("SEVOsession")) {
            var view = new ResumeView();
            this.contentView.setView(view);
            view.render();
          }
          else {
            this.home();
          }
        },
        home: function() {
          var view = new TrailsView({
            trails:this.allTrails
          });
          this.contentView.setView(view);
          view.renderIfReady();
            if(this.navView) {
                this.navView.hide();
            }
        },

	    //trail instructions
        trail_instructions: function(trailSlug, num) {
            var trail = this.session.getCurrentTrail();
            if(!this.navView) {
                //create a navbar now we have a session
                this.navView = new NavView({el: $('#nav-menu'), session: this.session});
            }
            else {
                //update if for the new session.
                this.navView.session = this.session;
            }
            this.navView.render();

            //create intro view
            var view = new TrailInstructionsView({
                trail: trail,
                nextURL: this.session.getNextURL(),
	            num: num
            });

            this.contentView.setView(view);
            view.render();
        },

        trail_video: function(trailSlug) {
            //create a new session for the chosen trail
            var trail = this.allTrails.findWhere( {slug: trailSlug} );
            this.session = new Session(trail);

            if (trailSlug != trail.attributes.slug) {
                console.error("Trying to show video for trail other than the current one")
            }

            //create intro view
            var view = new TrailIntroView({
                trail: trail,
            });

            this.contentView.setView(view);
            view.render();
        },

        item: function(itemSlug) {
            var item = this.session.getItem(itemSlug);
            //Inform the session that we've visited this item
            //var nextURL = this.session.getNextURL();
            var currentTrail = this.session.getCurrentTrail();
            var currentTopic = this.session.getCurrentTopic();
            var view = new ItemView({
                item: item,
                trail: currentTrail,
                topic: currentTopic,
                //nextURL: nextURL
                session: this.session,
                //need to pass the session rather than the URL, as the appropriate nextUrL can't be determined at this point
            });
            this.contentView.setView(view);
            view.render();
            //re-render and hide the nav view
            if(this.navView) {
              this.navView.render();
              this.navView.hide();
            }
        },
        finished: function() {
          var view = new FinishedView({
            trail: this.session.getCurrentTrail(),
          });
          this.contentView.setView(view);
          view.render();
          //TODO mark with the session that it's finished.
          //TODO re-render the nav menu
          //Hide the nav-menu
          if(typeof(Storage)!=="undefined") {
            localStorage.removeItem("SEVOsession");
          }
	        if(this.navView) {
		        this.navView.hide();
	        }

        },
        restart: function() {
            //restart the current trail
            this.session = new Session(this.session.attributes.trail.attributes.slug);
            Backbone.history.navigate(this.session.getNextURL());
        },
        resume: function() {
          //resume the previous trail
          if(typeof(Storage)!=="undefined") {
            var savedSession =  JSON.parse(localStorage.getItem("SEVOsession"));
            var trail = this.allTrails.findWhere( {slug: savedSession.slug} );
            this.session = new Session(trail, savedSession);
            Backbone.history.navigate(this.session.getNextURL());
            if(!this.navView) {
                //create a navbar now we have a session
                this.navView = new NavView({el: $('#nav-menu'), session: this.session});
            }
            else {
                //update if for the new session.
                this.navView.session = this.session;
            }
            this.navView.render();
          }
        },
        dashboard: function() {
            var dashboardView = new DashboardView( [
                {beaconId: 4005, name: 'Fossils1'},
                {beaconId: 11889, name: 'Fossil2'},
                {beaconId: 2889, name: 'Changes1'}
            ]);
            this.navView.hide();
            this.contentView.setView(dashboardView);
            dashboardView.render();
        }
    });

    return SEVRouter;

  });
