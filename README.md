# OctoPrint-TabOrder

This plugin allows for controlling the order of tabs within the OctoPrint web interface. After changes are made you must do a force reload by holding down CTRL key while pressing the F5 key.

Now supports fontawesome icons!

![screenshot](tab_icons.png)

## Setup

Install via the Plugin Manager or manually using this URL:

    https://github.com/jneilliii/OctoPrint-TabOrder/archive/master.zip

## Settings

![screenshot](settings.png)

## Changelog

### [0.5.5] - 2019-11-1
- Added fontawesome icon picker to make the class naming easier on the end user.

### [0.5.4] - 2019-10-21
- Added Python 3 compatibility.

### [0.5.3] - 2019-01-03
- Added fontawesom version 4 shim to resolve issues with other icons missing in OctoPrint after installing.

### [0.5.2] - 2019-01-01
- Updated to [fontawesom 5.6.3](https://fontawesome.com/v5.6.3/icons?d=gallery&m=free). As a result, some icons may become broken.  In order to handle the new solid versus branded icons the base icon class (**fas** or **fab**) must also be included in the icon field.

### [0.5.1] - 2019-01-01
- Added resize event trigger onAllBound to remove tab stacking when only icons are used.

### [0.5.0] - 2018-05-12
- Simplified the process for adding tabs based on existing tabs detected within the interface.

### [0.4.1] - 2018-05-10
- Added icon color option and tooltip for hover text.

### [0.4.0] - 2018-05-09
- Added icon support. Credit to [ntoff](https://github.com/ntoff/OctoPrint-TabIcons) for the original idea. Uses the [fontawesom 4.7.0](https://fontawesome.com/v4.7.0/icons/) library for class names.

### [0.3.0] - 2018-01-24
- Updated pop up message for better clarification of the reload process.

### [0.2.0] - 2018-01-23
- Updated description that displays in Plugin Manager.

### [0.1.0] - 2018-01-19
- Initial release.

## Get Help

If you experience issues with this plugin or need assistance please use the issue tracker by clicking issues above.

### Additional Plugins

Check out my other plugins [here](https://plugins.octoprint.org/by_author/#jneilliii)

### Sponsors
- Andreas Lindermayr
- [@Mearman](https://github.com/Mearman)
- [@TxBillbr](https://github.com/TxBillbr)
- Gerald Dachs
- [@TheTuxKeeper](https://github.com/thetuxkeeper)

### Support My Efforts
I, jneilliii, programmed this plugin for fun and do my best effort to support those that have issues with it, please return the favor and leave me a tip or become a Patron if you find this plugin helpful and want me to continue future development.

[![Patreon](patreon-with-text-new.png)](https://www.patreon.com/jneilliii) [![paypal](paypal-with-text.png)](https://paypal.me/jneilliii)

<small>No paypal.me? Send funds via PayPal to jneilliii&#64;gmail&#46;com</small>

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://paypal.me/jneilliii)

[0.5.5]: https://github.com/jneilliii/OctoPrint-TabOrder/tree/0.5.5
[0.5.4]: https://github.com/jneilliii/OctoPrint-TabOrder/tree/0.5.4
[0.5.3]: https://github.com/jneilliii/OctoPrint-TabOrder/tree/0.5.3
[0.5.2]: https://github.com/jneilliii/OctoPrint-TabOrder/tree/0.5.2
[0.5.1]: https://github.com/jneilliii/OctoPrint-TabOrder/tree/0.5.1
[0.5.0]: https://github.com/jneilliii/OctoPrint-TabOrder/tree/0.5.0
[0.4.1]: https://github.com/jneilliii/OctoPrint-TabOrder/tree/0.4.1
[0.4.0]: https://github.com/jneilliii/OctoPrint-TabOrder/tree/0.4.0
[0.3.0]: https://github.com/jneilliii/OctoPrint-TabOrder/tree/0.3.0
[0.2.0]: https://github.com/jneilliii/OctoPrint-TabOrder/tree/0.2.0
[0.1.0]: https://github.com/jneilliii/OctoPrint-TabOrder/tree/0.1.0


