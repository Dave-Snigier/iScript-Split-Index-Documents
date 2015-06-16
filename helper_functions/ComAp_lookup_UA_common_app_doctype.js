// perform lookup of doctypes for the UA common app stuff

function ComAp_lookup_UA_common_app_doctype () {
	var lookupMap = {
		UMBUA: {
			CAO: "Common App - Appl/Supplemnt BUA",
			LOR: "Letter of Recommendation BUA",
			WS: "Essay BUA",
			SR: "HS - School Report BUA",
			ST: "HS - Official Tran BUA",
			OR:	"HS - Optional Report BUA",
			OT: "HS - First Quarter Grades BUA",
			MR:	"HS - Mid Year Report BUA",
			MT:	"HS - Mid Year Grades BUA",
			FR:	"HS - Final Report BUA",
			FT: "HS - Final Official Tran BUA",
			TE:	"Letter of Recommendation BUA",
			OE: "Letter of Recommendation BUA",
 			RR: "Common App - Addl Application Matl BUA",
			RT: "College - Official Tran BUA",
			AE: "Letter of Recommendation BUA",
			FW:	"Fee Waiver BUA",
			ED: "Common App - Addl Application Matl BUA"
		},
		UMDUA: {
			CAO: "Common App - Appl/Supplemnt DUA",
			LOR: "Letter of Recommendation DUA",
			WS: "Essay DUA",
			SR: "HS - Official Transcript DUA",
			ST: "HS - Official Transcript DUA",
			OR:	"HS - Current Grades DUA",
			OT: "HS - Current Grades DUA",
			MR:	"HS - Official Mid Year Report DUA",
			MT:	"HS - Official Mid Year Report DUA",
			FR:	"HS - Official Final Tran DUA",
			FT: "HS - Official Final Tran DUA",
			TE:	"Letter of Recommendation DUA",
			OE: "Letter of Recommendation DUA",
 			RR: "College - Official Transcript DUA",
			RT: "College - Official Transcript DUA",
			AE: "Letter of Recommendation DUA",
			FW:	"Fee Waiver DUA",
			ED: "Common App - Addl Application Matl DUA"
		},
		UMLUA: {
		    CAO: "Common App - Appl/Supplemnt LUA",
		    LOR: "Letter of Recommendation LUA",
			WS: "Essay LUA",
			SR: "HS - Official School Report LUA",
			ST: "HS - Official Transcript LUA",
			OR:	"HS - Optional Report LUA",
			OT: "HS - Current Grades LUA",
			MR:	"HS - Official Mid Year Report LUA",
			MT:	"HS - Current Grades LUA",
			FR:	"HS - Official Final Report LUA",
			FT: "HS - Official Final Tran LUA",
			TE:	"Letter of Recommendation LUA",
			OE: "Letter of Recommendation LUA",
 			RR: "College - Registrar Report LUA",
			RT: "College - Official Transcript LUA",
			AE: "Letter of Recommendation LUA",
			FW:	"App - Fee Waiver LUA",
			ED: "Common App - Addl Application Matl LUA"
		}
	};

	var drawer = STAGE_KEYS.drawer;
	var dtCode = STAGE_NOT_USED.documentTypeCode;

	if (lookupMap[drawer][dtCode]) {
		STAGE_KEYS.docTypeName = lookupMap[drawer][dtCode];
		return true;
	} else {
		debug.log('ERROR', 'ComAp_lookup_UA_common_app_doctype: No doctype found for campus [%s] and code [%s]\n', drawer, dtCode);
		return false;
	}
}
