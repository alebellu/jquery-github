(function($) {

  var api = "https://api.github.com";

  var methods = {
	init: function( options ) {
	},

	/**
	 * Returns the github raw URL of a given resource.
	 */
	raw: function( user, repo, tag, path ) {
		return "https://raw.github.com/" + user + "/" + repo + "/" + tag + "/" + path;
	},

	/**
	* Gets info for a given tree, given a tree sha/tag name and optionally a path relative to it.
	*
	* @options:
	* 	@user the user
	* 	@repo the repository
	* 	@tree either the name of a tag or the sha of a tag/tree
	*	@path the root path of the tree
	* @returns a deferred for the call; callback will yield a tree object
	*/
	tree: function( options ) {
		if ( options.path ) {
			return $( this ).github( 'treeAtPath', options );
		} else {
			return get( api + "/repos/" + options.user + "/" + options.repo + "/git/trees/" + options.tree );
		}
	},

	/**
	* Gets info for a given path.
	*
	* @options:
	* 	@user the user
	* 	@repo the repository
	* 	@tree either the name of a tag or the sha of a tag/path
	* 	@path the path
	* @returns a deferred for the call; callback will yield a tree object
	*/
	treeAtPath: function( options ) {
		var dr = $.Deferred();
		var drd = function( tree ) { dr.resolveWith( this, [tree] ); };
		var drf = function() { dr.reject(); };

		var path = cleanPath(options.path);

		var opt = $.extend( {}, options );
		delete opt.path;
		$( this ).github( 'tree', opt )
			.done( function( tree ) {
				if ( path ) {
					// still path levels to navigate to..
					var indexOfSlash = path.indexOf( '/' );
					var firstLevel;
					if ( indexOfSlash > 0 ) {
						firstLevel = path.substring( 0, indexOfSlash );
						path = path.substring( indexOfSlash + 1 );
					} else {
						firstLevel = path;
						path = null;
					}

					// ...look for the sha of first level directory in the path..
					var firstLevelSHA;
					for ( var i = 0; i < tree.tree.length; i ++) {
						if (tree.tree[i].type == 'tree' && tree.tree[i].path == firstLevel) {
							firstLevelSHA = tree.tree[i].sha;
						}
					}

					if ( firstLevelSHA ) {
						// ..navigate down one level
						$( this ).github( 'treeAtPath', {
							user: options.user,
							repo: options.repo,
							tree: firstLevelSHA,
							path: path
						} ).done( drd ).fail( drf );
					} else {
						drf();
					}
				} else {
					// got it
					dr.resolveWith( this, [tree] );
				}
			} )
			.fail( drf );

		return dr.promise();
	},

	/**
	* Get blob content given its sha or a tree and the path of the blob relative to that tree.
	*
	* @options:
	* 	@user the user
	* 	@repo the repository
	* 	@sha sha of the blob
	* 	@tree sha of a tree object containing the blob
	* 	@path the path of the blob to retrieve, with respect to the tree object
	* @returns a deferred for the call; callback will yield a blob object
	*/
	blob: function( options ) {
		var path = cleanPath( options.path );
		if ( path ) {
			return $( this ).github( 'blobAtPath', options );
		} else {
			return get( api + "/repos/" + options.user + "/" + options.repo + "/git/blobs/" + options.sha );
		}
	},

	/**
	* Get blob content given a tree and the path of the blob relative to that tree.
	*
	* @options:
	* 	@user the user
	* 	@repo the repository
	* 	@tree either the name of a tag or the sha of a tag/path
	* 	@path the path
	* @returns a deferred for the call; callback will yield a blob object
	*/
	blobAtPath: function( options ) {
		var dr = $.Deferred();
		var drd = function( blob ) { dr.resolveWith( this, [blob] ); };
		var drf = function() { dr.reject(); };

		var path = cleanPath(options.path);
		// extract last blob name from path
		var indexOfSlash = path.lastIndexOf( '/' );
		var blobName;
		if ( indexOfSlash > 0 ) {
			blobName = path.substring( indexOfSlash + 1 );
			path = path.substring( 0, indexOfSlash );
		} else {
			blobName = path;
			path = null;
		}

		var opt = $.extend( {}, options );
		opt.path = path;
		$( this ).github( 'tree', opt )
			.done( function( tree ) {
				// look for the blob sha
				var sha;
				for ( var i = 0; i < tree.tree.length; i ++) {
					if ( tree.tree[i].type == 'blob' && tree.tree[i].path == blobName ) {
						sha = tree.tree[i].sha;
					}
				}
	
				// retrieve the blob
				opt = $.extend( {}, options );
				delete opt.tree;
				delete opt.path;
				opt.sha = sha;
				$( this ).github( 'blob', opt ).done( drd ).fail( drf );
			} )
			.fail( drf );

		return dr.promise();
	},

	/**
	* Gets/sets a reference object.
	*
	* @options:
	* 	@user the user
	* 	@repo the repository
	* 	@ref the reference to retrieve/update
	* 	@commit sha of the commit object this ref will point to
	* @returns a deferred for the call; callback will yield a reference object
	*/
	ref: function( options ) {
		if ( options.commit ) {
			// POST
			return post( api + "/repos/" + options.user + "/" + options.repo + "/git/refs/" + options.ref, {
				sha: options.commit
			} );
		} else {
			// GET
			return get( api + "/repos/" + options.user + "/" + options.repo + "/git/refs/" + options.ref );
		}
	},

	/**
	* Gets or post a commit object.
	* The commit sha can be passed in through the sha parameter. Otherwise a path
	* can be specified and the latest commit for that path will be retrieved.
	*
	* @options:
	* 	@user the user
	* 	@repo the repository
	* 	@sha sha of the commit object to retrieve/update
	*
	* 	@content the content of the blob to commit, base-64 encoded
	* @returns a deferred for the call; callback will yield a commit object
	*/
	commit: function( options ) {
		if ( options.content ) {
			// POST a commit object
			if ( sha ) {
				
			}
		} else {
			// GET a commit object
			return get( api + "/repos/" + options.user + "/" + options.repo + "/commits/" + options.sha );
		}
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

  function cleanPath( path ) {
	if ( path ) {
		// clean the path
		path = path.trim();
		if ( path[0] == '/' ) {
			path = path.substring( 1, path.length );
		}
	}
	return path;
  }

  function get( url ) {
	return jQuery.ajax({
		url: url,
		type: 'GET',
		dataType: "json",
	});
  }

  function post( url, data ) {
	return jQuery.ajax({
		url: url,
		type: 'POST',
		data: data,
		dataType: "json",
	});
  }

})( jQuery );
