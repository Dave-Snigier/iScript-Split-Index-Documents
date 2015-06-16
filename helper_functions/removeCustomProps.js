// Removes custom properties from STAGE_PROPS
// @param {String} arguments overloaded function
function removeCustomProps() {
	for (var i = removeCustomProps.arguments.length - 1; i >= 0; i--) {
		if (STAGE_PROPS[removeCustomProps.arguments[i]]) {
			delete STAGE_PROPS[removeCustomProps.arguments[i]];
		} else {
			debug.log('CRITICAL', '[%s] is not a property defined in your config for this report\n', removeCustomProp.arguments[i]);
			return false;
		}
	}
	return true;
}