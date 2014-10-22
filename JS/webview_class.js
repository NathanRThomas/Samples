/*! \file webview_class.js
 *    \brief This is a class used to handle all webview "stuff".  Use this to preload and show views.
 *    Remember to only push a view from the webview that pre-loaded it
*/

// class - webivew - for handling anything related to webviews for our app.  Due to android limitations we need to do all this from the initial page
function webview (options) {
    
    this.options = {        //set our defaults
        pageName    : '',           //name of the page we're trying to manipulate
        success         : '',           //function callback if it was successful
        error           : '',           //function callback if there was an error
        anim            : '',           //if we want an animation between the pages, this is the name, "fade", "slideup", etc.
        timeout         : 250,      //default timeout between retries
    };
    
    for ( var i in options ) {      //override any defaults
        this.options[i] = options[i];
    }
}

// Define our additional functions/variables for our webview class
webview.prototype = {
    
    //Public - this is how we preload a page
    preload: function (options) {
        for ( var i in options ) {      //override any defaults
            this.options[i] = options[i];
        }
        
        this._doPreload();
    },
    
    //Public - this is how we show a page
    show: function (options) {
        for ( var i in options ) {      //override any defaults
            this.options[i] = options[i];
        }
        
        this._doShow();
    },
    
    //Public - this is how we show a page
    loadDrawer: function (options) {
        for ( var i in options ) {      //override any defaults
            this.options[i] = options[i];
        }
        
        var pageID = this._getPageID();
        if (pageID == 0)
            return;
        
        var pre = new steroids.views.WebView("/views/settings/settings.html");
        //var locWebview = new webview(this.options);
        
        pre.preload({}, {
            onSuccess: function () {
                console.log("***************preload success: ");
                var pre2 = new steroids.views.WebView("/views/settings/settings.html");
                steroids.drawers.update({
                    left: pre2
                  });
                console.log("***************preload success done");
            }
        });
    },
    
    //Public - this is how we show a drawer
    showDrawer: function () {
        steroids.drawers.show( {
            edge: steroids.screen.edges.LEFT
          }, {
            onSuccess: function() {
              console.log("Drawer opening...")
            },
            onFailure: function(error) {
             //console.log("Could not show the drawer: " + error.errorDescription);
             console.log("Could not show the drawer: ");
            }
          });
        
        console.log("***************shown");
    },
    
    //Low-level get's the json object to identify a specific page
    _getPageID: function () {
        switch(this.options.pageName) {
            case 'createaccount':
                return {location: "/views/createaccount/createaccount.html",id: "createaccount"};
            case 'setting':
                return {location: "/views/settings/settings.html", id: "settings"};
            case 'cart':
                return {location: "/views/cart/cart.html", id: 'cart'};
            case 'closet':
                return {location: "/views/closet/closet.html", id: "closet"};
            case 'item':
                return {location: "/views/item/item.html", id: "item"};
            case 'look':
                return {location: "/views/look/look.html", id: "look"};
            case 'checkout':
                return {location: "/views/checkout/checkout.html", id: "checkout"};
            case 'home':
                return {location: "/views/homepage/homepage.html", id: "home"};
            case 'login':
                return {location: "/views/login/login.html", id: "login"};
            case 'forgotpassword':
                return {location: "/views/forgotpassword/forgotpassword.html", id: "forgotpassword"};
            default:
                return 0;
        }
    },
    
    //This actually handles preloading a page, low level
    _doPreload: function () {
        var pageID = this._getPageID();
        if (pageID == 0)
            return;
        
        var pre = new steroids.views.WebView(pageID);    //preload the item view, we'll populate it later when the user clicks
        
        var locTimeout = this.options.timeout;
        if (this.options.success != '')
            var next = this.options.success;
        else
            var next = '';
        
        var locWebview = new webview(this.options);
        
        pre.preload({}, {
            onFailure: function () {
                setTimeout(function () {
                    locWebview.preload();  //try again
                }, locTimeout);    //not sure what to do in this error but try again
            },
            onSuccess: function () {
                if (next != '')
                    next();
            }
        });
    },
    
    //Actually handle show of the view
    _doShow: function () {
        var pageID = this._getPageID();
        if (pageID == 0)
            return;
        
        var pre = new steroids.views.WebView(pageID);
        var locWebview = new webview(this.options);
        var locTimeout = this.options.timeout;
        
        if (this.options.anim != '') {
            var anim = new steroids.Animation(this.options.anim);
            var data = {view: pre, navigationBar: false, animation: anim};
        }
        else
            var data = {view: pre, navigationBar: false};
        
        steroids.layers.push(data, {
            onFailure: function (error) {
                setTimeout(function () {
                    locWebview.show();  //if it fails, try again
                }, locTimeout);
            }
        });
    },
    
    //Actually does a drawer style page
    _doDrawer: function () {
        var pageID = this._getPageID();
        
        if (pageID == 0)
            return;
        
        var pre = new steroids.views.WebView(pageID);
        /*
        steroids.drawers.update({
            left: pre,
        });
        */
    },
}