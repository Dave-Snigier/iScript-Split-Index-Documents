function formatSSN() {
	debug.log('INFO', 'Entering Function: formatSSN()\n');
	var ssnCPName = 'SSN#, Legacy';
	var ssn = STAGE_PROPS[ssnCPName].toString();
	var re = /^(.{3})(.{2})(.{4})$/;
	STAGE_PROPS[ssnCPName] = ssn.replace(re, "$1-$2-$3");
	if (STAGE_NOT_USED.Career != "GRAD") {
		debug.log('INFO', 'Transforming tmp_preapp-SSN [%s] to [%s]\n', STAGE_PROPS["tmp_preapp-SSN"], ssn.replace(re, "$1-$2-$3"));
		STAGE_PROPS["tmp_preapp-SSN"]  = ssn.replace(re, "$1-$2-$3");
	}
	return true;
}