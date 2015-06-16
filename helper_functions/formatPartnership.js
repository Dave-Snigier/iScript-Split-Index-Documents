// gets rid of whitespace 
function formatPartnership() {
	debug.log('DEBUG', 'Entering function formatPartnership with a value of: ["%s"]\n', STAGE_PROPS['Partnership']);
	if (STAGE_PROPS['Partnership'] == " \n") {
		STAGE_PROPS['Partnership'] = "";
		debug.log('DEBUG', 'Removed whitespace from Partnership CP\n');
	}
	return true;
}