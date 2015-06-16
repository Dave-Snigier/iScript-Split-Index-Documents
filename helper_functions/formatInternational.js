// convert 1 to Y all other to  "" 
function formatInternational() {
	debug.log('DEBUG', 'Convert: International()\n');
	if (STAGE_PROPS["International"]) {
		debug.log('INFO', 'Called: CP International value [%s], Type is : [%s]\n', STAGE_PROPS["International"], typeof STAGE_PROPS["International"]);
		if (STAGE_NOT_USED.Career != "GRAD"){
           debug.log('INFO', 'Inside UGRD: CP International value [%s], Type is : [%s]\n', STAGE_PROPS["International"], typeof STAGE_PROPS["International"]);

			if (STAGE_PROPS["International"].substring(0,1) == "1") { // we need this because last col in csv file has a line break 
				STAGE_PROPS["International"] = "Y";
				debug.log('INFO', 'Within International value sould be yes: CP International value [%s]\n', STAGE_PROPS["International"]);
			} else {
				STAGE_PROPS["International"] = ""; //don't care for other values
				debug.log('INFO', 'Within International value should be No: CP International value [%s]\n', STAGE_PROPS["International"]);
			} 
		}
	}	
	return true;
}