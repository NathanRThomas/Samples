/*! \file input_class.js
 *	\brief Created to handle custom checks of certain input fields and to up
*/

// class - webivew - for handling anything related to webviews for our app.  Due to android limitations we need to do all this from the initial page
function inputCheck (options) {
	 this.options = {        //set our defaults
        target      	: 0,           //target form field to check
        errTarget	: 0,           //message field to fill in if needed
        errMsg      : '',           //message to show on error
		sucTarget	: 0,			//message field to fill in if needed
		sucMsg		: '',			//message to show if successful
        focus         : false,		//whether or not to give focus in the event of an error
		min			: 1,			//min number of characters for text, min value for numeric
		max			: 99999,	//max number of characters for text, max for numerical value
		msgTimeout: 5000, 	//timeout for messages
    };
    
    for ( var i in options ) {      //override any defaults
		this.options[i] = options[i];
	}
}

// Define our additional functions/variables for our webview class
inputCheck.prototype = {
	
	string: function (options) {
		var locOptions = this.options;	//copy these locally so we don't stomp them
		
		for ( var i in options ) {      //override any defaults
			locOptions[i] = options[i];
		}
		
		if (locOptions.target == 0)
			return true;
		
		if ((locOptions.target).val().length >= locOptions.min &&
			(locOptions.target).val().length <= locOptions.max) {
			this._successState(locOptions);
			return true;
		}
		else {
			this._errorState(locOptions);
			return false;
		}
	},
	
	number: function (options) {
		var locOptions = this.options;	//copy these locally so we don't stomp them
		
		for ( var i in options ) {      //override any defaults
			locOptions[i] = options[i];
		}
		
		if (locOptions.target == 0)
			return true;
		
		if ((locOptions.target).val() >= locOptions.min &&
			(locOptions.target).val() <= locOptions.max) {
			this._successState(locOptions);
			return true;
		}
		else {
			this._errorState(locOptions);
			return false;
		}
	},
	
	email: function (options) {
		var locOptions = this.options;	//copy these locally so we don't stomp them
		
		for ( var i in options ) {      //override any defaults
			locOptions[i] = options[i];
		}
		
		if (locOptions.target == 0)
			return true;
		
		str = (locOptions.target).val();
		var pattern = /^\w+.*@\w+.*\..+$/;
		if (str.match(pattern)) {
			this._successState(locOptions);
			return true;
		}
		else {
			this._errorState(locOptions);
			return false;
		}
	},
	
	setError: function (options) {
		var locOptions = this.options;	//copy these locally so we don't stomp them
		
		for ( var i in options ) {      //override any defaults
			locOptions[i] = options[i];
		}
		
		this._errorState(locOptions);
	},
	
	setSuccess: function (options) {
		var locOptions = this.options;	//copy these locally so we don't stomp them
		
		for ( var i in options ) {      //override any defaults
			locOptions[i] = options[i];
		}
		
		this._successState(locOptions);
	},
	
	_errorState: function (locOptions) {
		if (locOptions.target != 0) {
			(locOptions.target).addClass("input-error");	//add our error class
			
			(locOptions.target).off("focus", "**");
			(locOptions.target).on("focus", function () {
				$(this).removeClass("input-error");
			});
		}
		
		if (locOptions.errTarget != 0) {
			(locOptions.errTarget).html(locOptions.errMsg);
			setTimeout(function () {
				(locOptions.errTarget).html('&nbsp;');
			}, locOptions.msgTimeout);
		}
		
		if (locOptions.focus)
			(locOptions.target).focus();
		
	},
	
	_successState: function (locOptions) {
		if (locOptions.sucTarget != 0) {
			locOptions.sucTarget.html(locOptions.sucMsg);
			
			setTimeout(function () {
				(locOptions.sucTarget).html('&nbsp;');
			}, locOptions.msgTimeout);
		}
	},
    
}