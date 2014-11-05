Samples
=======

Coding samples from some random projects I've worked on recently


  //---------------------------------------------------------------------------------------------------------------//
 //----- jQuery --------------------------------------------------------------------------------------------------//
//---------------------------------------------------------------------------------------------------------------//
inventory.js - This is the javascript used in an inventory management page.  It dynamically loads items into a table
and continues to load them based on onScroll events.  It will also dynamically reload the page based on changes to 
search critera.  It uses some functions from search.js which I was reusing in other parts of the code.

search.js - These functions were pulled out to their own file for use in multiple sections of the site.  There exists
drop-down input boxes with a list of attributes, depending which is selected another drop-down will appear to the
right populated with child attributes of the selected parent.  This can go several levels deep.

  //---------------------------------------------------------------------------------------------------------------//
 //----- JS ------------------------------------------------------------------------------------------------------//
//---------------------------------------------------------------------------------------------------------------//
input_class.js - This is a "class" as far as javascript is concerned.  I was using this to validate input boxes
throught an application.  It would verfiy the input based on the type, and if it was incorrect it would highlight
the input and apply css to indicate that something was wrong.

webview_class.js - Another "class", this was specific to an appgyver app that I wrote.  This was used to show and
hide different pages within the app.

  //---------------------------------------------------------------------------------------------------------------//
 //----- PHP -----------------------------------------------------------------------------------------------------//
//---------------------------------------------------------------------------------------------------------------//
db.php - This is a typical database class that I created to handle specifically the low-level connecting and 
executing of queries.  I would then create another class that extends this one with application specific code,
specifically the queries of the database I'm interested in.

alzheimers.php - This was a caching class that db.php would use.  It was initially setup to use memcached, however
it can be modified easily to accomidate redis or whatever you'd like.  Yes databases like MySQL will cache queries
for you, however for performance reasons I will typically turn that off and use something like this instead.

LoanShark.php - This was a class used to integrate with Stripe payment processing.  Relatively simple and it doesn't
fully include all calls one may make to Stripe, but I figured it would get the point across.

filter.php - This was used in the MiFilter project I worked on.  This includes a set of database queries as well as 
filtering functions to make up a realtively basic "recommendation" for a user.  It would recommend articles based
on other articles a user has liked or not liked, and other information about a user.

  //---------------------------------------------------------------------------------------------------------------//
 //----- CSS -----------------------------------------------------------------------------------------------------//
//---------------------------------------------------------------------------------------------------------------//
I'm not sure what someone looks for with CSS, but I grabbed two files from the MiFilter project.  These are the
default.css and homepage.css.  I will typically create a default.css file which has css for the entire project or
website, and then create page specific css files to try to manage the size.  Nothing fancy here as far as using
LESS or anything.

app.css - This came from a hybrid AppGyver app I created.  It showcases some animations and some more complex
css3 sorts of functionality.

  //---------------------------------------------------------------------------------------------------------------//
 //----- Python --------------------------------------------------------------------------------------------------//
//---------------------------------------------------------------------------------------------------------------//
test.py - Starting to get more into Python.  Created this as a simple function for ordering elements in a file.  The goal
here is to order strings alphabetically and numbers ascending, however the if a number is in the third position,
then it should stay in the third position and not get moved.  So you can't simply order all the elements in the
line together, the numbers must be done separate than the strings.

