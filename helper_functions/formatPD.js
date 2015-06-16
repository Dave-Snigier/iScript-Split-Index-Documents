// convert 1 to Y all other to  "" 
function formatPD() {
	debug.log('INFO', 'Convert: PD()\n');
	if (STAGE_PROPS["PD"]) {
		debug.log('DEBUG', 'Called: CP PD value (%s)\n', STAGE_PROPS["PD"]);
		if (STAGE_NOT_USED.Career != "GRAD") {
            	debug.log('INFO', 'Inside UGRD: CP PD value [%s], Type is : [%s]\n', STAGE_PROPS["International"], typeof STAGE_PROPS["International"]);

			if (STAGE_PROPS["PD"] == "1") {
				STAGE_PROPS["PD"] = "Y";
			} else {
				STAGE_PROPS["PD"] = ""; //don't care for other values
			}
		}
	}	
	return true;
}