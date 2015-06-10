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
    },

    afterRender: function() {
      this.$video = $('#foundVideo');
      this.video = this.$video[0];

      //var eventData = { question: this.question, url:this.nextURL };
      this.$video.on('ended', this.onVideoEnded.bind(this));

	    if(typeof(device)!='undefined') {
		    //on Android the videos must be loose in res/raw/, where the plugin plays them, on ios they are in www/video'
		    var videoPath = (device.platform == 'Android' || device.platform == 'amazon-fireos') ? '' : 'video/'
		    window.plugins.html5Video.initialize({"foundVideo": videoPath + this.item.attributes.video});
	    }
        //create the unlock view
        this.unlockView = new UnlockCodeView({ el:$('#unlock-code'), item: this.item});
        this.unlockView.render();

		//setTimeout(this.centreElements.bind(this), 100);
    },

    centreElements: function() {
	    this.moveToCentre($('.before-found'));
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
	    this.moveToCentre($('.play'));
		  this.moveToCentre($('#foundVideo'));
      navigator.notification.vibrate(500);
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
    },
    replayVideo: function(ev) {
	    //enable stopping on second play
	    $('.stop').show();
	    this.playVideo(ev);
    },
    playVideo: function(ev) {
      
      this.$video.addClass('playing');
      //  //hide the play control
      $('.play-button').hide();
	    
      if(typeof(device)!='undefined') {
		    window.plugins.html5Video.play("foundVideo", this.onVideoEnded.bind(this));
	    } else {
		    //browser
		    this.$video[0].play();
	    }
	    //finish the video early for testing
	    if(typeof(device) == 'undefined') {
		    setTimeout(this.onVideoEnded.bind(this), 2000);
	    }

	    //unhide video and controls
      $('.found-video').show();
	    $('.controls-container').show();
    },
    pauseVideo: function(ev) {
	    this.video.pause();
	    $('.pause').hide();
	    $('.resume').show();
    },
    resumeVideo: function(ev) {
	    this.video.play();
	    $('.pause').show();
	    $('.resume').hide();
    },
    stopVideo: function(ev) {
	    this.video.pause();
	    this.video.currentTime = 0;
        //this.$video.hide();
        //$('.controls-container').hide();
        //$('.buttons-container').show();
        //$('.replay').show();
	    this.onVideoEnded();
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
	    this.moveToVerticalCentre($('.questions'));
	    this.moveToVerticalCentre($('.video-container'));
	  },
    toggleNavMenu: function(ev)
    {
        var content = $('#content');
        content.toggleClass('slideout');
    }

  }
  );

    _.extend(ItemView.prototype, CentreMixin);

  return ItemView;

});
