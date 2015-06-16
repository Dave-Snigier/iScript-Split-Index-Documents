// undergrad to grad
function ugrdToGrad() {
	debug.log('DEBUG', 'Called: ugrdToGrad()\n');
	if (STAGE_NOT_USED.Career === "GRAD") {
		STAGE_PROPS['SA Application Nbr'] = STAGE_KEYS.f4;
		STAGE_KEYS.f4 = STAGE_PROPS.Plan;
		//delete STAGE_PROPS.Plan;
		if (STAGE_PROPS['SSN#, Legacy'])
			delete STAGE_PROPS['SSN#, Legacy']
		if (STAGE_PROPS.DOB)
			delete STAGE_PROPS.DOB
	}
	else {
		STAGE_PROPS['SA Application Nbr'] = STAGE_KEYS.f4;
	}
	return true;
}