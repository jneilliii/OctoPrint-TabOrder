# coding=utf-8

import octoprint.plugin
import os

class taborder(octoprint.plugin.AssetPlugin,
				octoprint.plugin.TemplatePlugin,
                octoprint.plugin.SettingsPlugin):
	
	##-- AssetPlugin mixin
	def get_assets(self):
		return dict(js=["js/taborder.js"],
					css=["css/taborder.css"])
		
	##-- Settings mixin
	def get_settings_defaults(self):
		return dict(tabs=[{'name':'temperature'},{'name':'control'},{'name':'gcodeviewer'},{'name':'terminal'},{'name':'timelapse'}])
		
	def on_settings_save(self, data):
		old_tabs = self._settings.get(["tabs"])

		octoprint.plugin.SettingsPlugin.on_settings_save(self, data)
		self._plugin_manager.send_plugin_message(self._identifier, dict(global_tabs=self._settings.global_get(["appearance","components","order","tab"]))
		new_tabs = self._settings.get(["tabs"])
		if old_tabs != new_tabs:
			self._logger.info("tabs changed from {old_tabs} to {new_tabs} reordering tabs.".format(**locals()))
			flattened_tabs = []
			for tab in new_tabs:
				flattened_tabs.append(tab["name"])
			self._settings.global_set(["appearance","components","order","tab"],flattened_tabs)
			self._plugin_manager.send_plugin_message(self._identifier, dict(reload=True))
	
	##-- Template mixin
	def get_template_configs(self):
		return [dict(type="settings",custom_bindings=True)]

	##~~ Softwareupdate hook
	def get_version(self):
		return self._plugin_version
		
	def get_update_information(self):
		return dict(
			taborder=dict(
				displayName="Tab Order",
				displayVersion=self._plugin_version,

				# version check: github repository
				type="github_release",
				user="jneilliii",
				repo="OctoPrint-TabOrder",
				current=self._plugin_version,

				# update method: pip
				pip="https://github.com/jneilliii/OctoPrint-TabOrder/archive/{target_version}.zip"
			)
		)

__plugin_name__ = "Tab Order"

def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = taborder()

	global __plugin_hooks__
	__plugin_hooks__ = {
		"octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
	}
