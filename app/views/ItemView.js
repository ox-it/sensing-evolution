define(["backbone", "underscore", "jquery", "app/views/vcentre", "hbs!app/templates/item", "app/logging",
        "app/collections/QuestionsCollection", "app/views/QuestionView", "app/views/UnlockCodeView",],
    function(Backbone, _, $, CentreMixin, itemTemplate, Logging, QuestionsCollection, QuestionView, UnlockCodeView) {

  var ItemView = Backbone.View.extend({

    template: itemTemplate,

    serialize: function() {
      var output = this.item.toJSON();

      output.nextURL = this.nextURL;
      output.trailTitle = this.trail.attributes.title;
      output.topicTitle = this.topic.attributes.title;
      output.isAndroid = this.isAndroid;
      return output;
    },

    initialize: function(params) {
      this.item = params.item;
      //this.nextURL = params.nextURL;
      this.session = params.session;
      this.trail = params.trail;
      this.topic = params.topic;
      this.question = params.item.questionForTrail(this.trail.attributes.slug);
      //listen for events
      this.eventId = 'beaconRange:' + this.item.attributes.beaconMajor;
      this.listenTo(Backbone, this.eventId, this.didRangeBeacon);
      Logging.logToDom("Listening for event: " + this.eventId);
      this.listenTo(Backbone, 'unlock-item', this.findObject);
      this.item.attributes.isAvailable = true;
      this.isAndroid = (typeof(device) !== 'undefined') &&   (device.platform == 'Android' || device.platform == 'amazon-fireos');
      if(typeof(device)!='undefined') {
        this.videoPath = this.isAndroid ? 'file:///android_asset/www/video/' : 'video/';
      }
      
	    if(typeof(Media) !== 'undefined') {

	            var pathPrefix = '';
                if(device.platform && device.platform.toLowerCase() === "android") {
                    pathPrefix = "/android_asset/www/";
                    this.foundSound_media = new Media(pathPrefix + this.item.attributes.foundsound,
                                    function() { console.log("Created media object"); },
                                    function(error) { console.log("error creating media object"); console.log(error); });
                } else {
                    //ios, use an html5 audio object. Multiple Media objects seem to clash - resulting in the end of the
                    // found sound stopping the main object audio.
                    this.foundSound = new Audio(this.item.attributes.foundsound);
                }
        } else { console.log("Media plugin not available!");}
    },

    afterRender: function() {
      this.$video = $('#foundVideo');
      this.video = this.$video[0];

      //var eventData = { question: this.question, url:this.nextURL };
      this.$video.on('ended', this.onVideoEnded.bind(this));

        //create the unlock view
        this.unlockView = new UnlockCodeView({ el:$('#unlock-code'), item: this.item});
        this.unlockView.render();

    },


    didRangeBeacon: function(data) {
        Logging.logToDom("View heard about ranged beacon!");
      switch(data.proximity) {
        case "ProximityImmediate":
          //update proximity indicator
          $('.proximity-indicator').removeClass('near far').addClass('immediate').html('Immediate');
          this.findObject();
          //TODO
          break;
        case "ProximityNear":
          //update proximity indicator
          this.findObject();
          $('.proximity-indicator').removeClass('immediate far').addClass('near').html('Near');
          break;
        case "ProximityFar":
	        if(this.item.attributes.triggerOnFar) {
		        this.findObject();
	        }
          //update proximity indicator
          $('.proximity-indicator').removeClass('immediate near far').html('Scanning...');
          break;
      }
    },

    findObject: function() {
      $('.proximity-indicator').hide();
      $('.before-found').hide();
      $('.found-video').show();
      this.$video.addClass('playing');
      //start the video after half a second
      //setTimeout( _.bind(function() {
      //  this.video.play();
      //}, this), 500);
      //unsubscribe from further beacon events
      this.stopListening(Backbone, this.eventId);
      this.item.attributes.isFound=true;

      Backbone.trigger('found-item');
      this.unlockView.remove();

	    //center play button
	    //this.moveToCentre($('.play'));
		  //this.moveToCentre($('#foundVideo'));
      navigator.vibrate(500);
	    if (this.foundSound_media) {
            this.foundSound_media.play();
        } else {
            this.foundSound.play();
        }


	    ////start video playing
	    //this.playVideo();
	    ////pause immediately
	    //setTimeout(this.pauseVideo().bind(this), 1);

    },

    //For browser simulation of 'finding' the object. Click on the picture
    events: {
      "click .show-hint" : "showHint",
      "click #nav-menu-button" : "toggleNavMenu",
      "click .replay": "replayVideo",
      "click .play" : "playVideo",
      "click .pause" : "pauseVideo",
      "click .resume" : "resumeVideo",
      "click .stop" : "stopVideo",
      "click video" : "playVideo",
      "click #android-video": "playVideo",
    },
    replayVideo: function(ev) {
	    //enable stopping on second play
	    $('.stop').show();
	    this.playVideo(ev);
    },
    playVideo: function(ev) {
      if(!this.$video.hasClass('playing')) {
        this.$video.addClass('playing');
      }
      if (this.isAndroid) {
        $("#android-video").hide();
        VideoPlayer.play(this.videoPath +this.item.attributes.video);
        setTimeout(this.onVideoEnded.bind(this), 2000);
      } else {
        $('.found-video').show();
        this.video.play();
      }

    },
    showHint: function(ev) {
      ev.preventDefault();
      $('.button-hint').hide();
      $('.hint').show();
    },
    onVideoEnded: function(ev) {
      //create and render question view
      $('video').removeClass('playing');
      var questionView = new QuestionView({ el: $('.question'),
                                            question:this.question,
                                            //nextURL:ev.data.url
                                            session:this.session
                                        });
      questionView.render();
      //mark the video element as finished
      $('video').parents('div').addClass("finished").removeClass("center-vertically");

	    //hide the video
      $('.found-video').hide();
	    $('.replay').show();

          //show the found item panel
      $('.found-item').show();

      //setTimeout(this.centreQuestion.bind(this), 100);
	
    },
	  centreQuestion: function() {
	    //this.moveToVerticalCentre($('.questions'));
	    //this.moveToVerticalCentre($('.video-container'));
	  },
    toggleNavMenu: function(ev)
    {
        var content = $('#content');
        content.toggleClass('slideout');
    },
    
    cleanup: function() {
        if(this.foundSound_media) {
            console.log('releasing found sound media object');
            this.foundSound_media.stop();
            this.foundSound_media.release();
        }
    }

  }
  );

    _.extend(ItemView.prototype, CentreMixin);

  return ItemView;

});
