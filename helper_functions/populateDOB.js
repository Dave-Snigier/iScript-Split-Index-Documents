// undergrad to grad
function populateDOB() {
	debug.log('DEBUG', 'Called populateDOB()\n');
	var dobCPName = 'DOB';
	var dob = STAGE_PROPS[dobCPName];
	if (STAGE_NOT_USED.Career != "GRAD") {
		debug.log('DEBUG', 'Inside Career BEFORE: Converting temp DOB: [%s] to Stage DOB [%s] and STAGE_PROPS.DOB is:  [%s}\n', STAGE_PROPS['tmp_preapp-DOB'], dobCPName, STAGE_PROPS.DOB );
		STAGE_PROPS['tmp_preapp-DOB'] = dob;
		debug.log('DEBUG', 'Inside Career AFTER: Converting temp DOB: [%s] to Stage DOB [%s]\n', STAGE_PROPS['tmp_preapp-DOB'], STAGE_PROPS.DOB );
	}
	return true;
}