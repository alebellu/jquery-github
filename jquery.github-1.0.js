(function($) {

  var api = "https://api.github.com";

  var methods = {
    init: function( options ) {
	},
    rawResourceURL: function( user, repo, tag, path ) {
        return "https://raw.github.com/" + user + "/" + repo + "/" + tag + "/" + path;
    },
	/**
	* Get info for a given tree.
	*
	* @user the user
	* @repo the repository
	* @tree the tree, either the name or the sha
	* @returns a deferred for the call
	*/
	tree: function( options ) {
		return jsonCall(
			api + "/repos/" + options.user + "/" + options.repo + "/git/trees/" + options.tree
		);
	},
	/**
	* Get info for a given tree.
	*
	* @user the user
	* @repo the repository
	* @sha sha of the blob
	* @returns a deferred for the call
	*/
	blob: function( user, repo, sha ) {
		return jsonCall(
			api + "/repos/" + user + "/" + repo + "/git/blobs/" + sha
		);
	},
	getResource: function( user, repo, tag, path ) {
		$(this).github('tree', user)
	},
    commit: function() {
    }
  }

  $.fn.github = function( method ) {
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.github' );
    }
  };

  function jsonCall( url ) {
	return jQuery.ajax({
		url: url,
		dataType: "json",
	});
  }

  function jsonpCall( url, callbackContext, callback, failCallback ) {
	/* No proper handling of error 404, ie fail is not fired => using jquery-jsonp plugin. */
	/*jQuery.ajax({
		url: url,
		dataType: "jsonp",
		jsonpCallback: "resource"
	}).done(callback).fail(failCallback);*/

	jQuery.jsonp({
		url: url,
		callback: "resource",
        context: callbackContext,
		success: callback,
		error: failCallback
	});
  }
})( jQuery );
