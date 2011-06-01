
var Post = Backbone.Model.extend({
});

var Posts = Backbone.Collection.extend({
   model: Post, 
   url: "http://www.reddit.com/.json?feed=073632c88f054fc2e478e09f3f6016494066b752&user=cmdq&limit=100&jsonp=?", 
   initialize: function() {
   },
   parse: function(response) {
      var parsed = _(response.data.children).map(function(child) {
         child.data.image_url = (child.data.url.match(/\.png|jpg|gif$/) ? child.data.url : (child.data.url.match(/imgur.com\/([a-zA-Z]{5})$/) ? "http://i.imgur.com/" + child.data.url.match(/imgur.com\/([a-zA-Z]{5})$/)[1] + ".png" : ""));
         child.data.thumbnail = _.isEmpty(child.data.thumbnail) || child.data.thumbnail.match(/^\/static/) ? "noimage.png" : child.data.thumbnail;
         child.data.thumbnail = child.data.image_url ? child.data.image_url : child.data.thumbnail;
         child.data.permalink = "http://www.reddit.com" + child.data.permalink;
         child.data.flashcontent = child.data.url.match(/youtube/) ? "http://www.redditmedia.com/mediaembed/" + child.data.id : null;
         return child.data;
      });
      return parsed;
   }
});

var PostView = Backbone.View.extend({
   initialize: function() {
      _.bind(this, "render");
   }, 
   render: function() {
      this.el = _.template($("#postTemplate").text(), {
         id : this.model.get("id"),
         title : this.model.get("title"),
         thumbnail : this.model.get("thumbnail"),
         image_url : this.model.get("image_url"),
         selftext : $("<div></div>").html(this.model.get("selftext_html")).text(),
         url : this.model.get("url"),
         permalink : this.model.get("permalink"),
         flashcontent : this.model.get("flashcontent"),
         subreddit : this.model.get("subreddit"),
         author : this.model.get("author"),
         num_comments : this.model.get("num_comments"),
         ups : this.model.get("ups"),
         downs : this.model.get("downs")
      });
      return this;
   }
});

var AppView = Backbone.View.extend({
   el: "body", 
   initialize: function() {
      _.bindAll(this, "render", "addPost", "addAllPosts");
      if (this.options.subreddit) {
         this.posts = new Posts();
         this.posts.url = "http://www.reddit.com/r/" + this.options.subreddit + "/.json?limit=100&jsonp=?";
      } 
      else {
         this.posts = new Posts();
      };
      
      this.posts.bind("refresh", this.addAllPosts);
      this.posts.bind("change", this.addAllPosts);
      
      this.posts.fetch();
      this.render();
   },
   events: {
   "change #search": "loadSubreddit"
   },
   loadSubreddit: function(event) {
      var query = $(event.currentTarget).val();
      this.posts.url = "http://www.reddit.com/r/" + query + "/.json?limit=100&jsonp=?";
      this.render();
      this.posts.fetch();
   },
   render: function() {
      $(this.el).find("#posts .post").remove();
      return this;
   },
   addPost: function(post) {
      var view = new PostView({
         model : post
      });
      $(this.el).find("#posts").append(view.render().el);
   },
   addAllPosts: function() {
      this.posts.each(this.addPost)
   }
});

var AppController = Backbone.Controller.extend({
   routes: {
      "": "index",
      ":subreddit": "subreddit",  
   }, 
   index: function() {
      new AppView();
   },
   subreddit: function(subreddit) {
      new AppView({
         "subreddit" : subreddit
      });
   }
});

///////////////////////////////////////////////////////////////////////

$(document).ready(function() {
   new AppController();
   Backbone.history.start();
   
   $(".post_actions li").live("click", function(event) {
      var target = $(this);
      
      if (!target.attr("class").match(/button/)) {
         return;
      };
      
      var targetType = target.attr("class").split("_")[0];
      var post = $(this).closest(".post");
      var wanted = post.find("." + $(this).attr("class").split("_")[0]);
      this.old_height = this.height;
      this.height = post.height();
      post.css('height', this.height);
      event.preventDefault();
      
      $(this).addClass('clicked');
      
      if (targetType == "comments") {
         if (post.hasClass("open")) {
            post.animate({"background-color": "#E8E7E2", "height": this.old_height }, "", "easeOutExpo", function() {
               post.removeClass("open");
               target.removeClass('clicked');
               post.find(".comment").remove();
            });
         } 
         else {
            $.getJSON("http://www.reddit.com/comments/" + post.attr("id") + ".json?limit=5&jsonp=?", function(response) {
               for (var i=0; i < response[1].data.children.length-1; i++) {
                  var comment = response[1].data.children[i].data;
                  post.find(".content").append($("<span id='" + comment.id + "' class='comment'></span>")); 
                  post.find("#" + comment.id).append($("<div></div>").html(comment.body_html).text());
               };
               post.addClass("open");
               post.animate({"background-color": "#7E7565", "height" : post.find(".content").height() }, "", "easeOutExpo");
            });
            return;
         };
      };
      if (wanted.hasClass("hidden")) {
         wanted.removeClass('hidden');
         post.addClass("open");
         // post.animate({"background-color": "#7E7565", "height" : post.find(".content").height() > 400 ? "400px" : post.find(".content").height() });
         post.animate({"background-color": "#7E7565", "height" : post.find(".content").height() }, "", "easeOutExpo");
      } 
      else {
         post.animate({"background-color": "#E8E7E2", "height": this.old_height }, "", "easeOutExpo", function() {
            wanted.addClass('hidden');
            post.removeClass("open");
            target.removeClass('clicked');
         });
      };
   });
});