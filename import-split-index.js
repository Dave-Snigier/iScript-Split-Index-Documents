/*
********************************************************************************************
	name:			SplitIndexDocumentPages.js
	Author:         Dave Snigier (UMass)
	Created:		6/21/2012
	Last Updated:	7/31/2012 Dave Snigier (UMass)
	For Version:	6.x
----------------------------------------------------------------------------------------------
	Summary:
		Runs as an inbound action and splits and/or re-indexes the document using a CSV on the server.

	Mod Summary:
		07/31/2012-Dave S. : Cleaned up whitespace, indentation. Refactored configuration and related
			code. refactored getDrawerNameAD function
		09/04/2012-Dave S.:		Revamped entire script to be driven by configuration,
								simplified configuration setup and made YAML compatible,
								removed report-specific configuration from body of the script,
								converted to an object-oriented design,
								added new transform functions including Jasmine tests.

	Business Use:
		Import all varieties of documents on a continuous basis into the imaging system


*********************************************************************************************/

//********************* Include additional libraries *******************
#include "$IMAGENOWDIR6$\\script\\lib\\envVariable.jsh"
#include "$IMAGENOWDIR6$\\script\\lib\\RouteItem.jsh"
#include "$IMAGENOWDIR6$\\script\\lib\\iScriptDebug.jsh"
#include "$IMAGENOWDIR6$\\script\\lib\\SetProp.jsh"
#include "$IMAGENOWDIR6$\\script\\lib\\CreateOrRouteDoc.jsh"
#include "$IMAGENOWDIR6$\\script\\lib\\yaml_loader.jsh"

// include helper functions that can be used to transform or derive values before loading
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\swapObjectProps.js"
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\getF5DateTime.js"
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\determineDrawer.js"
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\determineCommonAppDoctype.js"
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\decorateDoctypes.js"
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\lookupDrawerDoctypeAD.js"
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\ugrdToGrad.js"
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\checkForRecomendationAD.js"
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\disableUndergrad.js"
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\formatSSN.js"
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\formatPartnership.js"
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\ugrdToGrad.js"//CSR TBD
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\ComAp_lookup_UA_common_app_doctype.js"
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\formatInternational.js"   // DIS-950
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\formatPD.js"   // DIS-950
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\populateDOB.js" //DIS-989
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\populateCareer.js" //DIS-989
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\formatTermDescr.js"   //DIS-1009
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\populateAppNbr.js" //DIS-1181
#include "$IMAGENOWDIR6$\\script\\ImportSplitIndex\\helper_functions\\commonAppDrawer.js" //DIS-1271

//*********************         Configuration        *******************

// for testing only:
//currentWfItem = new INWfItem('301YX4X_034EZYBBN00001M');


// Logging
// false - log to stdout(intool), wfUser(inscript), true - log to inserverXX/log/ directory
#define LOG_TO_FILE true
#define DEBUG_LEVEL 5
#define EMAIL_ERRORS_NOTIFY "UITS.DI.ADMIN.APP@umassp.edu"

// where and how to find the report name that maps to a parsing config
#define FOLDER_DELIM '_'
#define FOLDER_REPORT_INDEX 0

// default error queue to use when there is none specified in the config for a specific report
// Also used when no config is found for a report
#define QUEUE_ERROR 'Import Split Index Error'

#define CSV_EXTENSION '.csv'
#define DEFAULT_CSV_DELIM '^'

// relative path to directory containing script report configuration files (remember a trailing /)
#define REPORT_CONFIG_DIRECTORY_PATH imagenowDir6+"\\script\\ImportSplitIndex\\config\\report_mapping\\"

// maximum length of index fields supported by ImageNow
#define MAX_INDEX_KEY_LENGTH 40
//*/

// JSLint configuration:
/*global RouteItem, moment, STAGE_PROPS, STAGE_KEYS, STAGE_NOT_USED, SPLIT_DOCS,
CUR_CFG, QUEUE_ERROR,
iScriptDebug, LOG_TO_FILE, DEBUG_LEVEL, CONFIG_VERIFIED, Buffer, Clib, printf,
INAutoForm, INBizList, INBizListItem, INClassProp,
INDocManager, INDocPriv, INDocType, INDocTypeList, INDocument, INDrawer, INExternMsg,
INFont, INGroup, INInstanceProp, INKeys, INLib, INLogicalObject, INMail, INOsm, INPriv,
INPrivEnum, INFolder, InProjManager, INProjectType, INProjTypeList, INProperty,
INRemoteService, INRetentionHold, INSequence, INSubObject, INSubobPriv, INSubobTemplate,
INTask, INTaskTemplate, INUser, INVersion, INView, INWfAdmin, INWfItem, INWfQueue,
INWfQueuePriv, INWorksheet, INWsDataDef, INWsPresentation, currentTask, currentWfItem,
currentWfQueue, currentDestinationWfQueue, _argv*/


// *********************       End  Configuration     *******************

// ********************* Initialize global variables ********************

var debug = "";
// custom properties to be applied to the document after creation
var STAGE_PROPS = {};
// INKeys object used to create document
STAGE_KEYS = new INKeys('', '', '', '', '', '', '');
// Key/values mapped from sources, but not to be used directly
var STAGE_NOT_USED = {};
// array of INDoc objects that have been split thus far from the source doc
var SPLIT_DOCS = [];
// reference to the config of the report currently selected
var CUR_CFG = '';
// number of pages on the incoming document
var TOTAL_DOC_PAGES;
// if the report has a CSV file or not
var HAS_CSV = false;

// ********************* Include additional libraries *******************

// ********************* Function definitions ***************************

/**
 * error handling for the script. Writes out errorReason to the logs and sends an email
 * Also routes the documents to the appropriate error queues
 * @param {String} errorReason to be used in communications
 * @param {Object} sourceDocWfItem an INWFItem object
 */
function throwError(errorReason, sourceDocWfItem) {
	debug.log('DEBUG', 'Called: throwError(%s, %s)\n', errorReason, sourceDocWfItem);
	// route to specific error queue if it exists, otherwise route to the default
	var routeToQueue;
	var tmpItem;
	if (typeof CUR_CFG !== 'undefined' && CUR_CFG.errorQueue) {
		routeToQueue = CUR_CFG.errorQueue;
	} else {
		routeToQueue = QUEUE_ERROR;
	}

	// log verbose logs if not already done
/*	if (DEBUG_LEVEL < 5) {
		debug.log('ERROR', '\n\n%s\n\n', debug.getLogHistory());
	}
*/
	debug.log('ERROR', errorReason + '\n');
	debug.log('ERROR', 'Routing all docs to error queue\n');


	// route split documents to error queue
	routeArrayofINDocs(routeToQueue, SPLIT_DOCS, errorReason);

	// route source document to error queue
	RouteItem(sourceDocWfItem, routeToQueue, errorReason, true);

/*	// send email with error message
	var wf = sourceDocWfItem;
	var errDoc = INDocument(wf.objectId);
	errDoc.getInfo();
	wf.createLink("/tmp");
	var linkPath = "/tmp/" + wf.id + ".inli";
	var body = "Import-Split-Index script failed with the following error message: \n" +
		errorReason + "\n" +
		"\n" +
		"folder:" +  errDoc.folder + "\n" +
		"Workflow Item ID: " + wf.id + "\n" +
		"Document ID: " + wf.objectId + "\n" +
		WEBNOW_ENV_URL + "docid=" + wf.objectId + "&workflow=1" +
		"\n\n" +
		"Errors and Warnings logged\n" +
		"----------------------------------------------------------------------\n";

	var subject = "[DI " + ENV_U3 + " Error] A report failed to be imported";
	var cmd = "echo \'" + body + debug.getLogHistory("NOTIFY") + "\' | mutt -a \'" + linkPath + "\' -s \'" + subject + "\' -- " + EMAIL_ERRORS_NOTIFY;
	//debug.log('DEBUG', 'Email string:\n');
	//debug.log('DEBUG', '%s\n', cmd);
	Clib.system(cmd);
	Clib.remove(linkPath);
*/}


/**
 * routes an array of INDocument objects to a workflow queue
 * @param {String} queueToRouteTo Name of the workflow queue to route the documents to
 * @param {Array} arrayOfINDocObjects array of INDocument Objects
 * @param {String} reason Routing reason visible in the workflow history
 * @returns {Boolean} true on success, false if errors were encountered
 */
function routeArrayofINDocs(queueToRouteTo, arrayOfINDocObjects, reason) {
	debug.log('DEBUG', 'Called: routeArrayofINDocs(%s, %s, %s)\n', queueToRouteTo, arrayOfINDocObjects, reason);
	var i, result, everythingOK = false;
	for (i = arrayOfINDocObjects.length - 1; i >= 0; i--) {
		result = CreateOrRouteDoc(arrayOfINDocObjects[i], queueToRouteTo, reason);
		if (!result) {
			everythingOK = false;
		}
	}
	return everythingOK;
}

/**
 * Takes an absolute or relative path and moves and/or renames files
 * @param {String} source path to current location of file
 * @param {String} dest path to new location/name of file
 * @returns {Boolean} true on success, false on failure
 */
function moveFile(source, dest) {
	debug.log('DEBUG', 'moveFile: mv %s %s\n', source, dest);
	if (Clib.rename(file, newFile) !== 0) {
		debug.log('ERROR', 'moveFile failed to move %s to %s\n', source, dest);
		return false;
	}
	return true;
}

/**
 * Object for working with the filename of the report
 * @param {String} fileName folder value containing the filename of the report being processed
 * @constructor
 */
function FileNameIndex(fileName) {
	this.name = fileName;
	this.delimiter = FOLDER_DELIM;
	this.reportIndex = FOLDER_REPORT_INDEX;
	this.splitName = fileName.split(FOLDER_DELIM);
	this.splitNameLength = this.splitName.length;
	this.reportName = this.splitName[this.reportIndex];
	this.config;
	this.configLength;
	this.filePath;

	/**
	 * Determines the correct report based on the filename.
	 * This populates the global variable CUR_CFG with that config object
	 * @returns {Boolean} true if it was successfully able to identify the report, false otherwise
	 */
	this.getCurrentReportConfig = function() {
		var re = /^.*\\(.*)\\/;
		var dirName = REPORT_CONFIG_DIRECTORY_PATH;
		debug.log('DEBUG', 'dirName is [%s]\n',dirName);
		dirName = dirName.replace(re, '$1');
		debug.log('DEBUG', 'dirName is [%s]\n',dirName);
		var configPath = CFG[dirName];
		CUR_CFG = false;
		for (var configReportName in configPath) {
			if (configPath.hasOwnProperty(configReportName) && configPath[this.reportName]) {
				CUR_CFG = configPath[this.reportName];
				break;
			}
		}

		if (!CUR_CFG) {
			return false;
		}
		this.config = CUR_CFG.fileNameValues;
		this.configLength = this.config.length;
		debug.log('DEBUG', 'CUR_CFG.csvFilePath: %s\n', CUR_CFG.csvFilePath);
		if (CUR_CFG.csvFilePath && CUR_CFG.csvFilePath !== "") {
			this.filePath = CUR_CFG.csvFilePath + fileName + '.csv';
			debug.log('DEBUG', '========Setting HAS_CSV to true!!!!\n');
			HAS_CSV = true;
		}

		return true;
	};
	/**
	 * Performs any mapping defined in the yaml relating to the filename updates.
	 * Takes values from the filename and populates the appropriate global staging objects.
	 */
	this.mapValuesToStaging = function() {
		debug.log('DEBUG', 'Called: mapValuesToStaging()\n');
		var type, name, value;
		var everythingOK = true;
		if (this.configLength > this.splitNameLength) {
			errTxt = 'Number of spiits defined in config [%d] greater than number in' +
				'filename: %s [%d]\n';
			debug.log('ERROR', errTxt, lengthConfig, fileName, lengthName);
			return false;
		}
		// want these assigned top down as defined in the config
		for (var i = 0; i < this.configLength; i++) {
			type = this.config[i].type;
			name = this.config[i].name;
			value = this.splitName[i];
			if (!stageValue(name, type, value)) {
				everythingOK = false;
			}
		}
		debug.log('DEBUG', 'Completed mapping values from file name\n');
		debug.log('DEBUG', 'STAGE_KEYS\n');
		debug.logObject('DEBUG', STAGE_KEYS);
		debug.log('DEBUG', 'STAGE_NOT_USED\n');
		debug.logObject('DEBUG', STAGE_NOT_USED);
		debug.log('DEBUG', 'STAGE_PROPS\n');
		debug.logObject('DEBUG', STAGE_PROPS);
		return everythingOK;
	};
}


/**
 * provides methods for working with configuration and data coming from a CSV for a report
 * @param {String} filePath path to the CSV file to use
 * @param {Object} reportConfig configuration object to use when parsing the CSV
 * @constructor
 */
function CSVIndex(filePath, reportConfig) {
	// report configuration in use for this csv file
	this.config = reportConfig.csvValues;
	// delimiter used to split the CSV file
	this.delimiter;
	// number of columns defined in the config
	this.configLength = this.config.length;
	// column location of the pages property
	this.pageColumnIndex;
	// array of current row contents split by the delimiter
	this.splitRow = [];
	// raw contents of the current row in the csv
	this.row;
	// row number of the csv that we're currently processing
	this.rowNumber = 0;

	// number of pages processed so far for this document
	this.pagesProcessed = 0;
	// number of pages per row if we've found the pages column
	this.pagesForRow = 0;
	// so we can do assignment to these properties from methods within
	var self = this;
	// has the page column been found?
	this.pageFound = false;
	// file handle for the csv file being processed
	var roPointer = null;

	/**
	 * parses the delimiter from the configuration
	 * @private
	 */
	var getDelim = function() {
		debug.log('DEBUG', 'Called: getDelim()\n');
		var specialDelimType = typeof reportConfig.csvDelimiter;

		if (specialDelimType !== 'undefined') {
			self.delimiter = reportConfig.csvDelimiter;
		} else {
			debug.log('DEBUG', 'using default delimiter of: %s\n', DEFAULT_CSV_DELIM);
			self.delimiter = DEFAULT_CSV_DELIM;
		}
	};

	/**
	 * Resets the position of the pointer on the CSV back to the beginning.
	 */
	this.rewind = function() {
		Clib.rewind(roPointer);
		self.rowNumber = 0;
		self.pagesProcessed = 0;
	};

	/**
	 * Retreives the next line of the csv
	 * @returns {Array} Array of CSV values
	 */
	this.getNextRow = function() {
		self.row = Clib.fgets(roPointer);
		if (self.row) {
			// debug.log('DEBUG', 'Current line: %s\n', self.row);
			self.splitRow = self.row.split(self.delimiter);
			self.rowNumber++;
			if (self.pageFound) {
				self.pagesForRow = parseInt(self.splitRow[self.pageColumnIndex], 10);
				self.pagesProcessed = parseInt(self.pagesProcessed + self.pagesForRow, 10);
			}
			return self.row;
		}
		return false;
	};

	/**
	 * Opens the CSV file for reading
	 * @returns {Boolean} true on success, false if we cannot open the file
	 */
	this.loadFile = function() {
		roPointer = Clib.fopen(filePath, "r");
		if (roPointer === null) {
			debug.log("ERROR", "unable to find file at [%s]\n", filePath);
			return false;
		}
		debug.log("INFO", "opened [%s] for reading\n", filePath);
		return true;
	};

	/**
	 * returns the total page count and validates the column count
	 * @returns {Integer|Boolean} Page count if page count was enabled in the configuration.
	 * True if columns matched, but page counts weren't validated.
	 * False on any line column mismatch
	 */
	this.getPages = function() {
		debug.log('DEBUG', 'Called: CSVIndex.getPages()\n');
		var line, i, lineCnt = 0, everythingOK = true;
		var pageCnt = 0;
		var numConfigColumns = self.config.length;
		var totalPageCount = 0;

		// check for a pages property, if it exists then check pages, otherwise no go
		debug.log('INFO', 'Expecting %d columns from the config.\n', numConfigColumns);

		// find which column the page count is
		for (i = 0; i < numConfigColumns; i++) {
			if (self.config[i].type.toUpperCase() === "PAGES") {
				self.pageFound = true;
				self.pageColumnIndex = i;
				break;
			}
		}
		line = self.getNextRow();
		while (line) {
			lineCnt++;
			// debug.log('DEBUG', 'self.delimiter => [%s]\n', self.delimiter);
			// debug.logObject('DEBUG',self.splitRow);
			// check for the correct number of columns
			if (numConfigColumns != self.splitRow.length) {
				debug.log('WARNING', 'Incorrect number of columns on line: %d - has %d columns.\n', lineCnt, self.splitRow.length);
				everythingOK = false;
			}
			if (self.pageFound) {
				totalPageCount += parseInt(self.splitRow[self.pageColumnIndex], 10);
				debug.log('DEBUG', 'totalPageCount: %s\n', totalPageCount);
			}
			line = self.getNextRow();
		}
		debug.log('INFO', 'Validated %d lines in the CSV file.\n', lineCnt);

		// reset the pointer to the beginning of the line
		self.rewind();


		if (everythingOK && self.pageFound) {
			self.pageCount = totalPageCount;
			return totalPageCount;
		} else if (everythingOK && !self.pageFound) {
			return true;
		} else {
			return false;
		}
	};

	/**
	 * Checks to see if page count in the CSV matches the value passed (typically the pages in the document)
	 * Checks the configuration to see if it should count the final page of the document or not
	 * @param {Integer} pageCountToMatch
	 * @returns {Boolean} true if the counts match, false if they do not
	 */
	this.comparePageCount = function(pageCountToMatch) {
		debug.log('DEBUG', 'Called: comparePageCount(%s)\n', pageCountToMatch);
		var indexPages = 0;
		var totalDocPages = parseInt(pageCountToMatch, 10);
		// If the ignore final page flag is set we don't want that messing with our results
		if (typeof CUR_CFG.ignoreFinalPage === 'boolean' && CUR_CFG.ignoreFinalPage) {
			totalDocPages = totalDocPages - 1;
		}
		if (self.pageFound) {
			if (self.pageCount === totalDocPages) {
				debug.log('INFO','Page Counts match between document and csv index file\n');
			} else {
				var errStr = 'Document Pages: [%d], CSV Pages: [%d], ignore final page: [%s]\n';
				debug.log('ERROR', errStr, pageCountToMatch, self.pageCount, CUR_CFG.ignoreFinalPage);
				return false;
			}
		} else {
			return true;
		}
		return true;
	};

	/**
	 * Closes the CSV file pointer
	 */
	this.cleanup = function() {
		// close file pointer
		Clib.fclose(roPointer);
	};

	/**
	 * maps values from the current CSV row onto the global staging objects according to the config.
	 * @returns {Boolean} true if successful, false otherwise
	 */
	this.mapValuesToStaging = function() {
		debug.log('DEBUG', 'Called: mapValuesFromCSV()\n');
		var i, type, name, value = '', everythingOK = true;

		for (i = self.splitRow.length - 1; i >= 0; i--) {
			type = self.config[i].type;
			name = self.config[i].name;
			value = self.splitRow[i];

			if (!stageValue(name, type, value)) {
				everythingOK = false;
			}
		}
		debug.log('DEBUG', 'Completed mapping values from CSV\n');
		debug.log('DEBUG', 'STAGE_KEYS\n');
		debug.logObject('DEBUG', STAGE_KEYS);
		debug.log('DEBUG', 'STAGE_NOT_USED\n');
		debug.logObject('DEBUG', STAGE_NOT_USED);
		debug.log('DEBUG', 'STAGE_PROPS\n');
		debug.logObject('DEBUG', STAGE_PROPS);
		return everythingOK;
	};
	getDelim();
}

/** @class global */

/**
 * Parses the staticValues section of the config file
 * and stages any values set there to the global staging objects
 * @returns {Boolean} true if mapping was successful, false otherwise
 */
function mapValuesFromStaticConfig() {
	debug.log('DEBUG', 'Called: mapValuesFromStaticConfig()\n');
	var everythingOK = true;
	var type, name, value;
	var config = CUR_CFG.staticValues;
	var length = config.length;
	for (var i = 0; i < config.length; i++) {
		if (typeof config[i].value === 'string' || typeof config[i].value === 'number') {
			// assign and cast to a string
			value = config[i].value + '';
		} else {
			value = '';
		}
		name = config[i].name;
		type = config[i].type;
		if (!stageValue(name, type, value)) {
			everythingOK = false;
		}
	}
	debug.log('DEBUG', 'Completed mapping values from Static Config\n');
	debug.log('DEBUG', 'STAGE_KEYS\n');
	debug.logObject('DEBUG', STAGE_KEYS);
	debug.log('DEBUG', 'STAGE_NOT_USED\n');
	debug.logObject('DEBUG', STAGE_NOT_USED);
	debug.log('DEBUG', 'STAGE_PROPS\n');
	debug.logObject('DEBUG', STAGE_PROPS);
	return everythingOK;
}

/**
 * used by the map functions to add values to the global config objects
 * @param {String} name key to use on the object
 * @param {String} type what type of value it is, used to determine which object to map to
 * @param {String} value the value of the key
 * @returns {Boolean} true if successful, false otherwise
 */
function stageValue(name, type, value) {
	var everythingOK = true;

	// check to make sure we actually have a valid type
	if (!type) {
		debug.log('CRITICAL', 'Type not defined in config for [%s]\n', name);
		return false;
	}
	type = type.toUpperCase();
	if (type === 'IDX' || type === 'INDEX') {
		if (!stageToIndex(name, value)) {
			debug.log('WARNING', 'Incorrect config. No index key of: %s\n', name);
			everythingOK = false;
		}
	} else if (type === 'CP' || type === 'PROP') {
		if (!stageToProps(name, value)) {
			debug.log('WARNING', 'Incorrect config. Cannot stage custom property: %s\n', name);
			everythingOK = false;
		}
	} else {
		if (!stageToTemp(name, value)) {
			debug.log('WARNING', 'Incorrect config. Cannot stage to temp array: %s\n', name);
			everythingOK = false;
		}
	}
	return everythingOK;

	function stageToIndex(name, value) {
		debug.log('DEBUG', 'Called: stageToIndex(%s, %s)\n', name, value);
		var nameUpper = name.toUpperCase();

		// truncate values greater than 40 characters
		if (value.length > MAX_INDEX_KEY_LENGTH) {
			value = value.substring(0, MAX_INDEX_KEY_LENGTH);
			debug.log('WARNING', 'an index key has been truncated\n');
		}

		switch (nameUpper) {
		case 'DRAWER':
			STAGE_KEYS.drawer = value;
			break;
		case 'FOLDER':
			STAGE_KEYS.folder = value;
			break;
		case 'TAB':
			STAGE_KEYS.tab = value;
			break;
		case 'F3':
			STAGE_KEYS.f3 = value;
			break;
		case 'F4':
			STAGE_KEYS.f4 = value;
			break;
		case 'F5':
			STAGE_KEYS.f5 = value;
			break;
		case 'DOCTYPENAME':
			STAGE_KEYS.docTypeName = value;
			break;
		case 'DOCTYPE':
			STAGE_KEYS.docTypeName = value;
			break;
		case 'DOCUMENT TYPE':
			STAGE_KEYS.docTypeName = value;
			break;
		default:
			return false;
		}
		return true;
	}

	function stageToProps(name, value) {
		debug.log('DEBUG', 'Called: stageToProps(%s, %s)\n', name, value);
		STAGE_PROPS[name] = value;
		return true;
	}

	function stageToTemp(name, value) {
		debug.log('DEBUG', 'Called: stageToTemp(%s, %s)\n', name, value);
		STAGE_NOT_USED[name] = value;
		return true;
	}
}


/**
 * Executes any transform functions specified in the config array.
 * Currently these functions need to be global and cannot take any parameters
 * @param {Array} configArray An array of config objects
 * @returns {Boolean} true if no errors were encountered, false otherwise
 */
function runTransforms(configArray) {
	debug.log('DEBUG', 'Called: runTransforms\n');
	// loop through the config to get the functions
	var paramsArr;
	var functionName;
	// var transform;

	// iterate through the passed config object looking for transforms to run
	for (i = 0; i < configArray.length; i++) {
		if (typeof configArray[i].transform === 'string') {
			debug.log('DEBUG', 'Transformer found: %s\n', configArray[i].transform);
			// check for parameters
			if (configArray[i].parameters) {
				if (isArray(configArray[i].parameters)) {
					paramsArr = configArray[i].parameters;
				} else {
					debug.log('CRITICAL', 'Parameters in configuration need to be in an array\n');
					return false;
				}
			} else {
				// run function with no parameters
				paramsArr = [];
			}
			functionName = configArray[i].transform;

			// let's make this a function
			if (typeof global[functionName] === "function") {
				transform = global[functionName];
			} else {
				var errTxt = 'transform value of [%s] is not a function or is not defined. ' +
								'Did you remember to #include the script?\n';
				debug.log('DEBUG', errTxt, functionName);
				return false;
			}

			// look ma, no eval()
			debug.log('DEBUG', 'running transform function: [%s]\n', functionName);
			if (!transform.apply(global, paramsArr)) {
				debug.log('ERROR', 'Function returned false: %s() with the following parameters:\n', functionName);
				debug.logObject('ERROR', 'paramsArr');
				return false;
			}
		}
	}
	return true;
}

/**
 * Checks if an object is an array
 *
 * @param {Object} obj object to test
 * @returns {Boolean} true if object is an array, false if it is not
 */
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}


/**
 * returns number of pages from latest version of a document
 * @param {Object} inDocObject An INDocument object
 * @returns {Integer|Boolean} Number of pages, false if an error was encountered
 */
function returnINDocumentPages(inDocObject) {
	debug.log('DEBUG', 'Called: returnINDocumentPages()\n');
	debug.log('DEBUG', 'inDocObject:\n');
	debug.logObject('DEBUG', inDocObject);
	var pageCount = 0;
	var verObj = new INVersion(inDocObject.id, -1);
	if(!verObj.getInfo()) {
		debug.log("ERROR", "Couldn't get verObj: %s\n", getErrMsg());
		return false;
	}
	pageCount = verObj.logobCount;
	return pageCount;
}

/**
 *
 * @param {Array} pageArray An array of integers (page numbers)
 * @param {Object} sourceDoc INDocument object to copy the pages from
 * @param {Object} destINKKeys INKeys object containing index keys for the new document
 * @param {Array} instancePropsArr An array of INInstanceProp objects for populating the custom properties of the new document
 * @returns {Object|Boolean} INDocument object of new document, false if a failure was encountered
 */
function copyPagesToNewDocument(pageArray, sourceDoc, destINKeys, instancePropsArr) {
	var logObjIdArr = [];
	var i;
	var temp;
	var logObj;

	if (!pageArray) return false;
	debug.log('DEBUG', 'Pages to be copied:\n');
	debug.logObject('DEBUG', pageArray, 10);

	// get logical object IDs for each page
	for (i = 0; i < pageArray.length; i++) {
		debug.log('DEBUG', 'copying page [%s]\n', pageArray[i]);
		logObj = new INLogicalObject(sourceDoc.id, -1, pageArray[i]);
		if(!logObj.getInfo()) {
			debug.log("ERROR", "Could not get logObj: %s\n", getErrMsg());
			return false;
		}
		logObjIdArr.push(logObj.id);
		debug.log('DEBUG', 'logObjIdArr:\n');
		debug.logObject('DEBUG', logObjIdArr, 10);
	}


	var newDoc = new INDocument(destINKeys);
	if (!newDoc.id)
	{
		if (instancePropsArr) {
			debug.log('DEBUG', 'instance Props were found, they should be applied to doc!!!!\n');
	
			if (!newDoc.create(instancePropsArr))
			{
				debug.log('ERROR', 'Failed to create new document and set custom properties: %s\n', getErrMsg());
				return false;
			}
		} else {
			if (!newDoc.create())
			{
				debug.log('ERROR', 'Failed to create new document: %s\n', getErrMsg());
				return false;
			}
		}
	} else
	{
		debug.log("ERROR","[%s] already exists.  Cannot create new document with this ID\n", newDoc.id);
		return false;
	}


	// TODO ********** add some logic to check for failed get info call
	newDoc.getInfo();

	debug.log('DEBUG', 'keys for new doc:\n');
	debug.logObject('DEBUG', destINKeys);

	debug.log('INFO', 'New Document Created...\n');
	debug.log('INFO', 'ID:            %s\n', newDoc.id);
	debug.log('INFO', 'Drawer:        %s\n', newDoc.drawer);
	debug.log('INFO', 'Folder:        %s\n', newDoc.folder);
	debug.log('INFO', 'Tab:           %s\n', newDoc.tab);
	debug.log('INFO', 'Field 3:       %s\n', newDoc.f3);
	debug.log('INFO', 'Field 4:       %s\n', newDoc.f4);
	debug.log('INFO', 'Field 5:       %s\n', newDoc.f5);
	debug.log('INFO', 'Document Type: %s\n', newDoc.docTypeName);

	debug.log('DEBUG', 'Source Document:\n');
	debug.logObject('DEBUG', sourceDoc);

	debug.log('DEBUG', 'Array of logical objects (pages)\n');
	debug.logObject('DEBUG', logObjIdArr);


	//  copy pages to new document
	if(!INDocManager.insertObject("COPY", sourceDoc.id, newDoc.id, "AFTER", "", logObjIdArr)) {
		debug.log('ERROR', "Unable to copy pages into new document!\n");
		debug.log('ERROR', "Last Server Error: [%s]\n", getErrMsg());
		return false;
	}
	debug.log('DEBUG', 'Pages copied successfully\n');
	return newDoc;
}



/**
 * Converts object of name value pairs to an array of inInstance props.
 * @param {object} inputObject Object with custom property name as the key, value as the value
 * @returns {Array|Boolean} An array of INInstanceProp objects, false on error
 */
function convertObjectofCPsTOINInstanceProp(inputObject) {
	var iProps = [], type, prop, index=0, errTxt;

	type = typeof inputObject;
	if (type !== 'object') {
		debug.log('ERROR', 'Cannot convert variable type of: [%s]\n', type);
		return false;
	}

	for (prop in inputObject) {
		iProps[index] = new INInstanceProp();
		iProps[index].name = [prop];
		iProps[index].setValue(inputObject[prop]);
		index++;
	}

	// check to see if any custom properties aren't defined or have errors
	for (var i = iProps.length - 1; i >= 0; i--) {
		if (iProps[i].id === '') {
			errTxt = 'Custom Property of [%s] cannot be assigned a value of [%s]. Does it exist?\n';
			debug.log('WARNING', errTxt, iProps[i].name, inputObject[prop]);
			iProps.splice(i, 1);
		}
	}
	return iProps;
}

/**
 * Clears global staging objects in preparation for the next split document.
 */
function setTheStage() {
	debug.log('DEBUG', 'Called: setTheStage()\n');
	STAGE_PROPS = {};
	STAGE_KEYS = new INKeys();
	STAGE_NOT_USED = {};
}


/**
 * Expands a sequential numeric series into an array.
 * @param {Integer} start
 * @param {Integer} end
 * @returns {Array} numArray An array of integers in order.
 */
function expandNumberSet(start, end) {
	var numArray = [];
	for (var i = start; i <= end; i++) {
		numArray.push(i);
	}
	return numArray;
}

/**
 * Calculates the pages that should be included for this record.
 * @param {Object} csv instance of CSVIndex
 * @returns {Array} An array of page numbers to be copied to the current document, false on error
 */
function getPageArray(csv) {
	debug.log('DEBUG', 'Called: getPageArray()\n');
	var pagesArr = [];
	var startPage ;
	var endPage ;

	if (csv.pageFound) {
		// page index found in the csv file
		startPage = (csv.pagesProcessed - csv.pagesForRow) + 1;
		endPage = csv.pagesProcessed;
	} else {
		// no page index found in the csv file
		startPage = 1;
		endPage = TOTAL_DOC_PAGES;
		if (CUR_CFG.ignoreFinalPage) {
			endPage = endPage - 1;
		}
	}

	debug.log('DEBUG', 'startPage: %s\n', startPage);
	debug.log('DEBUG', 'endPage: %s\n', endPage);


	var i = startPage;
	do {
		pagesArr.push(i);
		debug.log('DEBUG', 'logging i [%s]\n', i);
		i++;
	} while (i <= endPage);

	if (CUR_CFG.copyFinalPageToChildren) {
		pagesArr.push(TOTAL_DOC_PAGES);
	}
	debug.log('DEBUG', 'pagesArr:\n');
	debug.logObject('DEBUG', pagesArr);
	return pagesArr;
}

/**
 * Runs through the document creation and mapping methods.
 * Uses many global objects (sorry!).
 * @param {INDocument Object} sourceDoc source document to be split from
 * @param {INWFItem Object} workflow item object
 * @param {FileNameIndex Object} fn object for accessing filename methods
 * @param {CSVIndex Object} csvObj (optional) object for accessing csv file methods
 * @returns {Boolean} false if any terminal errors are encountered
 */
function mapAndTransform(wfDoc, wfItem, fn, csvObj) {
	// mapping time!
	if (typeof csvObj !== "undefined") {
		if (!csvObj.mapValuesToStaging()) {
			throwError('Mapping values from csv to stage objects failed', wfItem);
			return false;
		}
	}

	if (!fn.mapValuesToStaging()) {
		throwError('Mapping values from fileName to stage objects failed', wfItem);
		return false;
	}
	if (!mapValuesFromStaticConfig()) {
		throwError('Mapping values from static config to stage objects failed', wfItem);
		return false;
	}

	// transform functions
	if (!runTransforms(CUR_CFG.fileNameValues)) {
		throwError('A fileName transform function has failed', wfItem);
		return false;
	}

	if (typeof csvObj !== "undefined") {
		if (!runTransforms(CUR_CFG.csvValues)) {
			throwError('A CSV transform function has failed', wfItem);
			return false;
		}
	}

	if (!runTransforms(CUR_CFG.staticValues)) {
		throwError('A Static Value transform function has failed', wfItem);
		return false;
	}

	// convert STAGE_PROPS object to array of INInstanceProps
	STAGE_PROPS = convertObjectofCPsTOINInstanceProp(STAGE_PROPS);

	debug.log('DEBUG', 'STAGE_KEYS:\n');
	debug.logObject('DEBUG', STAGE_KEYS);
	debug.log('DEBUG', 'STAGE_PROPS:\n');
	debug.logObject('DEBUG', STAGE_PROPS);
	debug.log('DEBUG', 'STAGE_NOT_USED:\n');
	debug.logObject('DEBUG', STAGE_NOT_USED);
	debug.log('INFO', 'total doc pages: %s\n', TOTAL_DOC_PAGES);


	// Determine pages to be copied to the current document
	var pagesArr = [];
	if (typeof csvObj !== "undefined") {
		pagesArr = getPageArray(csvObj);
	} else {
		pagesArr = expandNumberSet(1, TOTAL_DOC_PAGES);
	}

	// Create split document with keys and custom properties
	var newDoc = copyPagesToNewDocument(pagesArr, wfDoc, STAGE_KEYS, STAGE_PROPS);
	if (!newDoc) {
		throwError('Could not split off document', wfItem);
		return false;
	}

	// add document to array so we can keep track of it
	SPLIT_DOCS.push(newDoc);

	// add document to playground queue
	if (CUR_CFG.tempQueue) {
		if (!CreateOrRouteDoc(newDoc, CUR_CFG.tempQueue, 'Split from report: ' + wfDoc.folder)) {
			throwError('Could not route document to temp queue', wfDoc);
			return false;
		}
	}

	return true;
}


/** ****************************************************************************
  *		Main body of script.
  *
  * @param {none} None
  * @returns {void} None
  *****************************************************************************/
function main() {
	try {
		debug = new iScriptDebug("USE SCRIPT FILE NAME", LOG_TO_FILE, DEBUG_LEVEL, {logHistoryMax:10000});
		debug.showINowInfo("INFO");
		var wfItem, wfDoc, splitFilename, i, reportName, filePath, csvFile;
		var foundTheConfigFlag = false;
		var appNumber = "";
		var planCP = "";
		var totalPageCountCSV;


		if (typeof currentWfItem === 'undefined') {
			debug.log("CRITICAL", "This script is not designed to run from intool.\n");  //intool
			return false;
		}
		debug.log("INFO", "REPORT_CONFIG_DIRECTORY_PATH is [%s]\n", REPORT_CONFIG_DIRECTORY_PATH);
		// load report config files
		loadYAMLConfig(REPORT_CONFIG_DIRECTORY_PATH);

		//get wfItem info
		wfItem = new INWfItem(currentWfItem.id);
		if (!wfItem.id || !wfItem.getInfo()) {
			throwError('Could not get info for wfItem: ' + currentWfItem.id, wfItem);
			return false;
		}
		
		//added per Perceptive's request for CSR 1869
		debug.log("DEBUG", "Processing item [%s]\n", wfItem.id); 
		debug.log("DEBUG", "Running from queue [%s]\n", wfItem.queueName);

		//get doc info
		wfDoc = new INDocument(wfItem.objectId);
		if (!wfDoc.id || !wfDoc.getInfo(["doc.id", "doc.drawer", "doc.folder", "doc.tab", "doc.field3", "doc.field4", "doc.field5", "doc.type"])) {
			throwError('Could not get info for doc, wfItem ID: ' + currentWfItem.id, wfItem);
			return false;
		}

		debug.log('INFO', 'Processing document: [%s] with folder value: [%s] \n', wfDoc.id, wfDoc.folder);
		debug.incrementIndent();
		if (wfDoc.folder === "") {
			throwError('Folder value cannot be empty', wfItem);
			return false;
		}

		// instantiate filename object
		var fn = new FileNameIndex(wfDoc.folder);

		// find matching config for report type
		if (!fn.getCurrentReportConfig()) {
			throwError('Cannot find a configuration defined for this report type', wfItem);
			return false;
		}

		// Get pages from source document
		TOTAL_DOC_PAGES = returnINDocumentPages(wfDoc);
		if (!TOTAL_DOC_PAGES) {
			throwError('Cannot retreive page counts from source document', wfItem);
			return false;
		}

		debug.log('DEBUG', '===============HAS_CSV: %s\n', HAS_CSV);
		debug.logObject('DEBUG', HAS_CSV, 10);

		if (HAS_CSV) {

			// instantiate a new CSVIndex object for working with the index file
			var csv = new CSVIndex(fn.filePath, CUR_CFG);

			// Open the file for reading
			if (!csv.loadFile()) {
				throwError('Cannot open csv index file for reading', wfItem);
				return false;
			}

			// Get total number of pages from the CSV and validate column config
			if (!csv.getPages()) {
				throwError('CSV index column or config has wrong number of columns', wfItem);
				return false;
			}

			// check to see if page counts match
			if (!csv.comparePageCount(TOTAL_DOC_PAGES)) {
				throwError('Page count in document does not match CSV index', wfItem);
				return false;
			}

			// time to itterate through each row and get down to business
			while (csv.getNextRow()) {
				// map values and run transform functions
				if (!mapAndTransform(wfDoc, wfItem, fn, csv)) {
					return false;
				}


				debug.log('DEBUG', 'One document done... starting on the next!\n');
				// wipe the staging objects clean
				setTheStage();
			}
		} else {
			// map values and run transform functions
			if (!mapAndTransform(wfDoc, wfItem, fn)) {
				return false;
			}
		}

		// Route split documents to the final queue specified in the config
		if (CUR_CFG.finalQueue) {
			routeArrayofINDocs(CUR_CFG.finalQueue, SPLIT_DOCS, 'Split and Index was a success!');
		}

		// Route source document to the backup queue specified in the config
		//RouteItem(wfItem, CUR_CFG.backupQueue, 'Split and Index was a success!', true);


		if (HAS_CSV) {
			// close file pointer on csv
			csv.cleanup();

			// if index file archive path is set, archive the csv file
			if (typeof csvArchivePath === 'string') {
				//moveFile(CUR_CFG.csvFilePath, CUR_CFG.csvArchivePath);
			}
		}

		// Route source document to the backup queue specified in the config
		RouteItem(wfItem, CUR_CFG.backupQueue, 'Split and Index was a success!', true);


	} catch (e) {
		if (!debug) {
			printf("\n\nFATAL iSCRIPT ERROR: %s\n\n", e.toString());
		}
		try {
			throwError('Split Index Script crashed.\n', wfItem);
		} catch (err) {}
		debug.log("CRITICAL", "***********************************************\n");
		debug.log("CRITICAL", "***********************************************\n");
		debug.log("CRITICAL", "**                                           **\n");
		debug.log("CRITICAL", "**    ***    Fatal iScript Error!     ***    **\n");
		debug.log("CRITICAL", "**                                           **\n");
		debug.log("CRITICAL", "***********************************************\n");
		debug.log("CRITICAL", "***********************************************\n");
		debug.log("CRITICAL", "\n\n\n%s\n\n\n", e.toString());
		debug.log("CRITICAL", "\n\nThis script has failed in an unexpected way.  Please\ncontact Perceptive Software Customer Support at 800-941-7460 ext. 2\nAlternatively, you may wish to email support@imagenow.com\nPlease attach:\n - This log file\n - The associated script [%s]\n - Any supporting files that might be specific to this script\n\n", _argv[0]);
		debug.log("CRITICAL", "***********************************************\n");
		debug.log("CRITICAL", "***********************************************\n");
	} finally {
		debug.finish();
		return;
	}
}

