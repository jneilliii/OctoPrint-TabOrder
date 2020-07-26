$(function() {
	function taborderViewModel(parameters) {
		var self = this;

		self.settings = parameters[0];
		self.tabs = ko.observableArray();
		self.hidden_tabs = ko.observableArray();
		self.selectedTab = ko.observable();
		self.reloadOverlay = undefined;
		self.availableTabs = ko.observableArray();
		self.assignedTabs = ko.pureComputed(function(){
								var tabs = ko.utils.arrayMap(self.tabs(), function(tab) {
										return tab.name();
									});
								return tabs.sort();
							});
		self.hiddenTabs = ko.pureComputed(function(){
								var tabs = ko.utils.arrayMap(self.hidden_tabs(), function(tab) {
										return tab.name();
									});
								return tabs.sort();
							});
		self.hiddenTabsByID = ko.pureComputed(function(){
								var tabs = ko.utils.arrayMap(self.hidden_tabs(), function(tab) {
										if(tab.name().indexOf('plugin_') > -1){
											return 'tab_' + tab.name() + '_link';
										} else {
											return tab.name().replace('temperature','temp').replace('terminal','term').replace('gcodeviewer','gcode') + '_link';
										}
									});
								return tabs;
							});
		self.unassignedTabs = ko.pureComputed(function() {
								//find out the categories that are missing from uniqueNames
								var combined_tabs = self.assignedTabs().concat(self.hiddenTabs())
								var differences = ko.utils.compareArrays(self.availableTabs().sort(), combined_tabs.sort());
								//return a flat list of differences
								var results = [];
								ko.utils.arrayForEach(differences, function(difference) {
									if (difference.status === "deleted") {
										results.push(difference.value);
									}
								});
								return results;
							});

		self.onBeforeBinding = function() {
			self.tabs(self.settings.settings.plugins.taborder.tabs());
			self.hidden_tabs(self.settings.settings.plugins.taborder.hidden_tabs());
		}

		self.onEventSettingsUpdated = function (payload) {
			self.tabs(self.settings.settings.plugins.taborder.tabs());
			self.hidden_tabs(self.settings.settings.plugins.taborder.hidden_tabs());
			if (self.active_settings_tabs !== ko.toJSON(self.settings.settings.plugins.taborder.tabs) || self.active_settings_hidden_tabs !== ko.toJSON(self.settings.settings.plugins.taborder.hidden_tabs)){
				self.showReloadDialog();
			}
		}

		self.onAfterBinding = function(){
			self.active_settings_tabs = ko.toJSON(self.settings.settings.plugins.taborder.tabs);
			self.active_settings_hidden_tabs = ko.toJSON(self.settings.settings.plugins.taborder.hidden_tabs);
			$('ul#tabs li:not(.dropdown)').each(function(){
				var tabid = $(this).attr('id');
				if(tabid.match(/^(tab_)?(.+)_link$/g)){
					self.availableTabs.push(tabid.replace('temp_link','temperature_link').replace('term_link','terminal_link').replace('gcode_link','gcodeviewer_link').replace(/^(tab_)?(.+)_link$/g,'$2'));
				}
			});
		}

		self.onAllBound = function(allViewModels){
			self.renderTabs();
		}

		self.renderTabs = function(){
			ko.utils.arrayForEach(self.tabs(), function(tab) {
				var tabid = tab.name().replace('temperature','temp').replace('terminal','term').replace('gcodeviewer','gcode'); // fix for default tab ids not matching links.
				if (!tab.showtext()){
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').text('');
				}
				if (tab.usetitle()){
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').text(tab.icon_tooltip());
				}
				if ($('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').children('i').length > 0) {
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').attr('title',tab.icon_tooltip()).children('i').addClass(tab.icon()).css({'color':tab.icon_color()});
				} else {
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').attr('title',tab.icon_tooltip()).prepend('<i class="'+tab.icon()+'" style="color:'+tab.icon_color()+'"></i> ');
				}
			});
			ko.utils.arrayForEach(self.hidden_tabs(), function(tab) {
				var tabid = tab.name().replace('temperature','temp').replace('terminal','term').replace('gcodeviewer','gcode'); // fix for default tab ids not matching links.
				if (!tab.showtext()){
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').text('');
				}
				if (tab.usetitle()){
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').text(tab.icon_tooltip());
				}
				if ($('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').children('i').length > 0) {
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').attr('title',tab.icon_tooltip()).children('i').addClass(tab.icon()).css({'color':tab.icon_color()});
				} else {
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').attr('title',tab.icon_tooltip()).prepend('<i class="'+tab.icon()+'" style="color:'+tab.icon_color()+'"></i> ');
				}
			});
		}

		self.onStartupComplete = function(){
			if($('#tabs').data('tabdrop') == undefined){
				$('#tabs').tabdrop({hidden: self.hiddenTabsByID()});
			}
			setTimeout(function(){$(window).resize();},200);
		}

		self.showReloadDialog = function(){
			$('#reloadui_overlay_wrapper > div > div > p:nth-child(2)').html('Tab Order changes detected, you must reload now for these new changes to take effect. This will not interrupt any print jobs you might have ongoing.');
			$('#reloadui_overlay').modal();
		};

		self.addMissingTab = function(data) {
			self.selectedTab({'name':ko.observable(data),'icon':ko.observable(''),'showtext':ko.observable(true),'usetitle':ko.observable(false),'icon_color':ko.observable('#000000'),'icon_tooltip':ko.observable('')});
			self.settings.settings.plugins.taborder.tabs.push(self.selectedTab());
			self.tabs(self.settings.settings.plugins.taborder.tabs());
			$('#TabOrderEditor').modal('show');
		}

		self.addHiddenMissingTab = function(data) {
			self.selectedTab({'name':ko.observable(data),'icon':ko.observable(''),'showtext':ko.observable(true),'usetitle':ko.observable(false),'icon_color':ko.observable('#000000'),'icon_tooltip':ko.observable('')});
			self.settings.settings.plugins.taborder.hidden_tabs.push(self.selectedTab());
			self.hidden_tabs(self.settings.settings.plugins.taborder.hidden_tabs());
			$('#TabOrderEditor').modal('show');
		}

		self.editTab = function(data) {
			console.log(data);
			self.selectedTab(data);
			$('#TabOrderEditor').modal('show');
		}

		self.removeTab = function(data) {
			self.settings.settings.plugins.taborder.tabs.remove(data);
			self.tabs(self.settings.settings.plugins.taborder.tabs());
		}

		self.removeHiddenTab = function(data) {
			self.settings.settings.plugins.taborder.hidden_tabs.remove(data);
			self.hidden_tabs(self.settings.settings.plugins.taborder.hidden_tabs());
		}
	}

	ADDITIONAL_VIEWMODELS.push([
		taborderViewModel,
		["settingsViewModel"],
		["#settings_plugin_taborder"]
	]);
});
