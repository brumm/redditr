// var postTemplate = "<li><%= title %></li>";

var Post = Backbone.Model.extend({
});

var Posts = Backbone.Collection.extend({
   model: Post, 
   url: "http://www.reddit.com/hot/.json?jsonp=?", 
   initialize: function() {
   },
   parse: function(response) {
      var parsed = _(response.data.children).map(function(child) {
         child.data.image_url = (child.data.url.match(/\.png|jpg|gif$/) ? child.data.url : (child.data.url.match(/imgur.com\/([a-zA-Z]{5})$/) ? "http://i.imgur.com/" + child.data.url.match(/imgur.com\/([a-zA-Z]{5})$/)[1] + ".png" : ""));
         child.data.thumbnail = _.isEmpty(child.data.thumbnail) || child.data.thumbnail.match(/^\/static/) ? "noimage.png" : child.data.thumbnail;
         child.data.thumbnail = child.data.image_url ? child.data.image_url : child.data.thumbnail;
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
         selftext : this.model.get("selftext"),
         url : this.model.get("url")
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
         this.posts.url = "http://www.reddit.com/r/" + this.options.subreddit + "/.json?jsonp=?";
         console.log(this.posts.url);
      } 
      else {
         this.posts = new Posts();
      };
      
      this.posts.bind("refresh", this.addAllPosts);
      this.posts.bind("change", this.addAllPosts);
      
      this.posts.fetch();
      this.render();
   },
   render: function() {
      $(this.el).append("<ul id='posts'></ul>");
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

$(document).ready(function() {
   new AppController();
   Backbone.history.start();
   
   $(".post_actions li").live("click", function() {
      var target = $(this).attr("class").split("_")[0];
      var post = $(this).closest(".post");
      var wanted = post.find("span." + target);
      $(this).addClass('clicked');
      
      if (target == "comments") {
         if (post.hasClass("open")) {
            post.removeClass("open");
            $(this).removeClass('clicked');
            post.find(".comment").remove();
         } 
         else {
            $.getJSON("http://www.reddit.com/comments/" + post.attr("id") + ".json?limit=4&jsonp=?", function(response) {
               for (var i=0; i < response[1].data.children.length-1; i++) {
                  post.find(".content").append($("<span class='comment'>" + response[1].data.children[i].data.body + "</span>"));
               };
            });
            post.addClass("open");
            return;
         };
      };
      if (wanted.hasClass("hidden")) {
         wanted.removeClass('hidden');
         post.addClass("open");
      } 
      else {
         wanted.addClass('hidden');
         post.removeClass("open");
         $(this).remove('clicked');
      };
   });
});