/**
 * LEAFLET.PHOTO PLUGIN
 *
 * A Leaflet plugin for displaying photos as custom markers on a map.
 * Supports optional clustering when used with Leaflet.markercluster plugin.
 *
 * DEPENDENCIES:
 * - Leaflet.js (required) - https://leafletjs.com/
 * - Leaflet.markercluster (optional, for clustering) - https://github.com/Leaflet/Leaflet.markercluster
 *
 * PHOTO OBJECT FORMAT:
 * Each photo must be an object with the following properties:
 * {
 *   lat: number,        // Latitude coordinate (e.g., 38.9072)
 *   lng: number,        // Longitude coordinate (e.g., -77.0369)
 *   url: string,        // URL to full-size image (shown in popup)
 *   iconUrl: string,    // URL to thumbnail image (shown as marker icon)
 *   caption: string     // (Optional) Caption text for popup
 * }
 *
 * BASIC USAGE (Without Clustering):
 *
 *   // Create photo layer
 *   const photoLayer = L.photo([
 *     { lat: 38.9072, lng: -77.0369, url: 'photo1.jpg', iconUrl: 'thumb1.jpg', caption: 'Photo 1' },
 *     { lat: 38.9100, lng: -77.0400, url: 'photo2.jpg', iconUrl: 'thumb2.jpg', caption: 'Photo 2' }
 *   ]);
 *
 *   // Add to map
 *   photoLayer.addTo(map);
 *
 *   // Handle click events
 *   photoLayer.on('click', function(evt) {
 *     const photo = evt.layer.photo;
 *     evt.layer.bindPopup('<img src="' + photo.url + '"/><p>' + photo.caption + '</p>').openPopup();
 *   });
 *
 * USAGE WITH CLUSTERING (Recommended for many photos):
 *
 *   // Create clustered photo layer
 *   const photoLayer = L.photo.cluster().on('click', function(evt) {
 *     const photo = evt.layer.photo;
 *     const template = '<img src="{url}"/><p>{caption}</p>';
 *     evt.layer.bindPopup(L.Util.template(template, photo)).openPopup();
 *   });
 *
 *   // Add photos dynamically
 *   photoLayer.add([
 *     { lat: 38.9072, lng: -77.0369, url: 'photo1.jpg', iconUrl: 'thumb1.jpg', caption: 'Photo 1' }
 *   ]);
 *
 *   // Add to map
 *   photoLayer.addTo(map);
 *
 * CUSTOMIZATION OPTIONS:
 *
 *   // Custom icon size
 *   const photoLayer = L.photo(photos, {
 *     icon: { iconSize: [60, 60] }  // Default is [40, 40]
 *   });
 *
 *   // Custom cluster radius
 *   const photoLayer = L.photo.cluster({
 *     maxClusterRadius: 150  // Default is 100 pixels
 *   });
 *
 * CSS STYLING:
 * The plugin uses the 'leaflet-marker-photo' class for styling markers.
 * Customize appearance in your CSS file.
 */

// ============================================================================
// L.Photo - Main Photo Layer Class
// ============================================================================
// Extends Leaflet's FeatureGroup to create a layer of photo markers

L.Photo = L.FeatureGroup.extend({
	// Default options for photo markers
	options: {
		icon: {
			iconSize: [40, 40]  // Width and height of photo marker thumbnails in pixels
		}
	},

	/**
	 * Initialize the photo layer
	 * @param {Array} photos - Array of photo objects (each with lat, lng, url, iconUrl, caption)
	 * @param {Object} options - Configuration options (e.g., custom icon size)
	 */
	initialize: function (photos, options) {
		L.setOptions(this, options);
		L.FeatureGroup.prototype.initialize.call(this, photos);
	},

	/**
	 * Add multiple photo markers to the layer
	 * @param {Array} photos - Array of photo objects to add
	 * @returns {L.Photo} Returns this for method chaining
	 */
	addLayers: function (photos) {
		if (photos) {
			for (var i = 0, len = photos.length; i < len; i++) {
				this.addLayer(photos[i]);
			}
		}
		return this;
	},

	/**
	 * Add a single photo marker to the layer
	 * @param {Object} photo - Photo object with lat, lng, url, iconUrl, caption
	 */
	addLayer: function (photo) {
		L.FeatureGroup.prototype.addLayer.call(this, this.createMarker(photo));
	},

	/**
	 * Create a Leaflet marker from a photo object
	 * Uses a custom DivIcon with the photo thumbnail as background image
	 * @param {Object} photo - Photo object
	 * @returns {L.Marker} Leaflet marker with photo data attached
	 */
	createMarker: function (photo) {
		var marker = L.marker(photo, {
			// Create custom icon using DivIcon with inline background-image style
			icon: L.divIcon(L.extend({
				html: '<div style="background-image: url(' + photo.iconUrl + ');"></div>​',
				className: 'leaflet-marker-photo'  // CSS class for styling
			}, photo, this.options.icon)),
			title: photo.caption || ''  // Tooltip text on hover
		});
		marker.photo = photo;  // Attach original photo data to marker for later access
		return marker;
	}
});

/**
 * Factory function to create a photo layer
 * @param {Array} photos - Array of photo objects
 * @param {Object} options - Configuration options
 * @returns {L.Photo} New photo layer instance
 */
L.photo = function (photos, options) {
	return new L.Photo(photos, options);
};

// ============================================================================
// L.Photo.Cluster - Clustered Photo Layer (Optional)
// ============================================================================
// Only available if Leaflet.markercluster plugin is loaded
// Groups nearby photos together to prevent marker overlap on crowded maps

if (L.MarkerClusterGroup) {

	L.Photo.Cluster = L.MarkerClusterGroup.extend({
		options: {
			featureGroup: L.photo,  // Use L.photo as the feature group factory
			maxClusterRadius: 100,  // Max distance (pixels) between markers to cluster them together
			showCoverageOnHover: false,  // Don't show cluster coverage polygon on hover

			/**
			 * Custom function to create cluster icons
			 * Shows the first photo's thumbnail with a count badge
			 * @param {L.MarkerCluster} cluster - The cluster object
			 * @returns {L.DivIcon} Custom cluster icon
			 */
			iconCreateFunction: function(cluster) {
				return new L.DivIcon(L.extend({
					className: 'leaflet-marker-photo',  // Same class as individual markers
					// HTML: Show first photo thumbnail + badge with count
					html: '<div style="background-image: url(' + cluster.getAllChildMarkers()[0].photo.iconUrl + ');"></div>​<b>' + cluster.getChildCount() + '</b>'
				}, this.icon));
		   	},
			icon: {
				iconSize: [40, 40]  // Cluster icon size (same as individual markers)
			}
		},

		/**
		 * Initialize the clustered photo layer
		 * @param {Object} options - Configuration options
		 */
		initialize: function (options) {
			options = L.Util.setOptions(this, options);
			L.MarkerClusterGroup.prototype.initialize.call(this);
			this._photos = options.featureGroup(null, options);  // Create internal photo layer
		},

		/**
		 * Add photos to the clustered layer
		 * @param {Array} photos - Array of photo objects to add
		 * @returns {L.Photo.Cluster} Returns this for method chaining
		 */
		add: function (photos) {
			this.addLayer(this._photos.addLayers(photos));
			return this;
		},

		/**
		 * Remove all photos from the clustered layer
		 */
		clear: function () {
			this._photos.clearLayers();
			this.clearLayers();
		}

	});

	/**
	 * Factory function to create a clustered photo layer
	 * @param {Object} options - Configuration options
	 * @returns {L.Photo.Cluster} New clustered photo layer instance
	 */
	L.photo.cluster = function (options) {
		return new L.Photo.Cluster(options);
	};

}